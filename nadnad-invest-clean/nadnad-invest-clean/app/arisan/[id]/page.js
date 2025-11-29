// app/arisan/[id]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function ArisanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [group, setGroup] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [members, setMembers] = useState([]);
  const [contribs, setContribs] = useState([]);

  const [errorMsg, setErrorMsg] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // ---- Helper: cari membership user ini ----
  const myMember = useMemo(() => {
    if (!user) return null;
    return members.find((m) => m.user_id === user.id) || null;
  }, [members, user]);

  // ---- Helper: round berikutnya untuk user ini ----
  const nextRoundForUser = useMemo(() => {
    if (!myMember) return null;
    const myContribs = contribs.filter((c) => c.user_id === myMember.user_id);
    const lastRound = myContribs.reduce(
      (max, c) => Math.max(max, Number(c.round_number) || 0),
      0
    );
    const next = lastRound + 1;
    if (!group) return next;
    if (next > (group.total_rounds || 0)) return null; // sudah lunas semua
    return next;
  }, [myMember, contribs, group]);

  // ---- Helper: round "sekarang" berdasarkan tanggal mulai (per bulan) ----
  const currentRoundNumber = useMemo(() => {
    if (!group || !group.start_date) return 1;
    const start = new Date(group.start_date);
    const now = new Date();

    if (now < start) return 1;

    const yearDiff = now.getFullYear() - start.getFullYear();
    const monthDiff = now.getMonth() - start.getMonth();
    let diffMonths = yearDiff * 12 + monthDiff;

    // bulatkan menuju atas kalau sudah lewat tanggal
    if (now.getDate() >= start.getDate()) {
      diffMonths += 1;
    }

    const round = diffMonths <= 0 ? 1 : diffMonths;
    const maxRounds = group.total_rounds || round;
    return Math.min(round, maxRounds);
  }, [group]);

  // ---- LOAD DATA AWAL ----
  useEffect(() => {
    if (!groupId) return;

    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) cek login
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error:", error.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // 2) ambil group
        const { data: grp, error: gErr } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (gErr || !grp) {
          console.error("Load group error:", gErr?.message);
          setErrorMsg("Grup arisan tidak ditemukan atau terjadi kesalahan.");
          return;
        }

        setGroup(grp);

        // 3) ambil wallet user
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Load wallet error:", wErr.message);
        }

        setWallet(w || null);

        // 4) ambil members
        const { data: m, error: mErr } = await supabase
          .from("arisan_members")
          .select("*")
          .eq("group_id", groupId)
          .order("position", { ascending: true });

        if (mErr) {
          console.error("Load members error:", mErr.message);
          setErrorMsg("Gagal memuat anggota arisan.");
          return;
        }

        setMembers(m || []);

        // 5) ambil kontribusi
        const { data: c, error: cErr } = await supabase
          .from("arisan_contributions")
          .select("*")
          .eq("group_id", groupId)
          .order("round_number", { ascending: true })
          .order("created_at", { ascending: true });

        if (cErr) {
          console.error("Load contributions error:", cErr.message);
          setErrorMsg("Gagal memuat data setoran arisan.");
          return;
        }

        setContribs(c || []);
      } catch (err) {
        console.error("Arisan detail init error:", err);
        setErrorMsg(
          "Terjadi kesalahan saat memuat halaman arisan. Periksa koneksi atau konfigurasi Supabase."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [groupId, router]);

  // ---- Aksi: gabung grup ----
  const handleJoinGroup = async () => {
    if (!user || !group) return;
    if (myMember) {
      alert("Kamu sudah terdaftar sebagai anggota arisan ini.");
      return;
    }

    try {
      setJoinLoading(true);
      setErrorMsg("");

      const nextPosition = members.length + 1;

      const { error } = await supabase.from("arisan_members").insert({
        group_id: group.id,
        user_id: user.id,
        nickname: null,
        position: nextPosition,
        status: "ACTIVE",
      });

      if (error) {
        console.error("Join group error:", error.message);
        setErrorMsg("Gagal bergabung dengan grup arisan.");
        return;
      }

      // reload anggota
      const { data: m, error: mErr } = await supabase
        .from("arisan_members")
        .select("*")
        .eq("group_id", group.id)
        .order("position", { ascending: true });

      if (mErr) {
        console.error("Reload members error:", mErr.message);
      } else {
        setMembers(m || []);
      }

      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("Join group unexpected error:", err);
      setErrorMsg("Terjadi kesalahan saat bergabung ke grup arisan.");
    } finally {
      setJoinLoading(false);
    }
  };

  // ---- Aksi: bayar iuran putaran berikutnya dari wallet ----
  const handlePayNextRound = async () => {
    if (!user || !group || !wallet || !myMember) {
      alert(
        "Data belum lengkap. Pastikan kamu punya dompet, sudah login, dan sudah tergabung di grup."
      );
      return;
    }

    if (!nextRoundForUser) {
      alert("Kamu sudah menyelesaikan semua iuran untuk grup ini.");
      return;
    }

    const amount = group.monthly_amount || 0;
    if (!amount || amount <= 0) {
      alert("Nominal iuran arisan belum diatur dengan benar.");
      return;
    }

    if ((wallet.balance || 0) < amount) {
      alert(
        `Saldo dompet kamu tidak cukup.\nSaldo: ${formatCurrency(
          wallet.balance || 0
        )}\nIuran: ${formatCurrency(amount)}`
      );
      return;
    }

    try {
      setPayLoading(true);
      setErrorMsg("");

      const before = wallet.balance || 0;
      const after = before - amount;

      // 1) catat ke tabel kontribusi arisan
      const { error: cErr } = await supabase
        .from("arisan_contributions")
        .insert({
          group_id: group.id,
          member_id: myMember.id,
          user_id: user.id,
          round_number: nextRoundForUser,
          amount,
          status: "PAID",
        });

      if (cErr) {
        console.error("Insert contribution error:", cErr.message);
        alert("Gagal mencatat setoran arisan. Saldo belum dipotong.");
        return;
      }

      // 2) catat ke wallet_transactions
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ARISAN_CONTRIB",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Setoran arisan "${group.name}" putaran ke-${nextRoundForUser}`,
          user_email: user.email || null,
        });

      if (txErr) {
        console.error("Insert wallet tx error:", txErr.message);
        alert(
          "Setoran arisan tercatat, tapi gagal mencatat transaksi wallet. Periksa di Supabase."
        );
        // kita tetap lanjut update saldo supaya konsisten
      }

      // 3) update saldo wallet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
        alert(
          "Gagal memperbarui saldo dompet. Periksa konsistensi saldo di Supabase."
        );
      }

      // reload wallet & kontribusi
      const { data: wReload, error: wReloadErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", wallet.id)
        .maybeSingle();

      if (!wReloadErr && wReload) {
        setWallet(wReload);
      }

      const { data: cReload, error: cReloadErr } = await supabase
        .from("arisan_contributions")
        .select("*")
        .eq("group_id", group.id)
        .order("round_number", { ascending: true })
        .order("created_at", { ascending: true });

      if (!cReloadErr && cReload) {
        setContribs(cReload);
      }

      alert(
        `Setoran arisan putaran ke-${nextRoundForUser} berhasil dicatat.\nSaldo baru: ${formatCurrency(
          after
        )}`
      );
    } catch (err) {
      console.error("Pay contribution error:", err);
      alert("Terjadi kesalahan saat memproses setoran arisan.");
    } finally {
      setPayLoading(false);
    }
  };

  // ---- Ringkasan setoran per putaran ----
  const roundsSummary = useMemo(() => {
    if (!group) return [];
    const totalRounds = group.total_rounds || 0;
    if (!totalRounds) return [];

    const arr = [];
    for (let r = 1; r <= totalRounds; r++) {
      const roundContribs = contribs.filter(
        (c) => Number(c.round_number) === r
      );
      arr.push({
        round: r,
        count: roundContribs.length,
      });
    }
    return arr;
  }, [group, contribs]);

  // ---- Render ----

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat detail arisan...</p>
        </div>
      </main>
    );
  }

  if (!group || !user) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">
              {errorMsg ||
                "Grup yang kamu cari tidak dapat dimuat. Mungkin sudah dihapus atau ID-nya salah."}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/arisan")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke daftar arisan
            </button>
          </section>
        </div>
      </main>
    );
  }

  const isOwner = group.owner_user_id === user.id;
  const memberCount = members.length;
  const totalPot =
    (group.monthly_amount || 0) * (memberCount > 0 ? memberCount : 1);

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Arisan · Detail grup &amp; setoran
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/arisan")}
            >
              Daftar arisan
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Dompet
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* Info utama grup */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Detail grup arisan</p>
          <h1 className="nanad-dashboard-heading">
            {group.name}
            {group.group_code && (
              <span
                style={{
                  display: "block",
                  marginTop: "0.35rem",
                  fontSize: "0.78rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#e5e7eb",
                }}
              >
                ID GRUP:{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {group.group_code}
                </span>
              </span>
            )}
          </h1>
          <p className="nanad-dashboard-body">
            {group.description ||
              "Grup arisan bersama teman/pelanggan yang terjadwal dan tercatat di dalam Nanad Invest."}
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Iuran per putaran</p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(group.monthly_amount || 0)}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
              >
                Dibayar oleh setiap anggota untuk setiap putaran.
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Total putaran</p>
              <p className="nanad-dashboard-stat-number">
                {group.total_rounds || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
              >
                Mulai dari tanggal{" "}
                {group.start_date
                  ? new Date(group.start_date).toLocaleDateString("id-ID")
                  : "-"}
                .
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Perkiraan pot per putaran</p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalPot)}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
              >
                Berdasarkan jumlah anggota saat ini: {memberCount} orang.
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Status &amp; giliran</p>
              <p className="nanad-dashboard-stat-number">
                {group.status || "ACTIVE"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
              >
                Perkiraan putaran berjalan: ke-{currentRoundNumber}.
              </p>
            </div>
          </div>

          {wallet && (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.6rem", fontSize: "0.8rem" }}
            >
              Saldo dompet kamu:{" "}
              <strong>{formatCurrency(wallet.balance || 0)}</strong>
            </p>
          )}

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.5rem", color: "#fecaca" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* Grid: anggota & iuran */}
        <section className="nanad-dashboard-table-section">
          {/* Anggota dan keikutsertaan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota & urutan penerima</h3>
              <p>
                Urutan anggota bisa digunakan sebagai urutan penerima pot
                arisan pada tiap putaran, sesuai kesepakatan kalian.
              </p>
            </div>

            {!myMember && (
              <div style={{ marginTop: "0.8rem" }}>
                <button
                  type="button"
                  className="nanad-dashboard-deposit-submit"
                  disabled={joinLoading}
                  onClick={handleJoinGroup}
                >
                  {joinLoading ? "Memproses..." : "Gabung grup arisan ini"}
                </button>
              </div>
            )}

            {myMember && (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.6rem", fontSize: "0.8rem" }}
              >
                Kamu terdaftar sebagai anggota pada posisi{" "}
                <strong>#{myMember.position}</strong>{" "}
                {isOwner && "(kamu juga pemilik grup/arisan ini)"}.
              </p>
            )}

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota yang terdaftar.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {members.map((m) => (
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>Posisi #{m.position}</div>
                    <div>
                      <strong>
                        {m.nickname ||
                          (m.user_id === user.id
                            ? "Kamu"
                            : `Member #${m.position}`)}
                      </strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#e5e7eb",
                        }}
                      >
                        User ID:{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {m.user_id}
                        </span>
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            m.status === "ACTIVE" ? "#4ade80" : "#facc15",
                        }}
                      >
                        {m.status || "ACTIVE"}
                      </span>
                      {group.owner_user_id === m.user_id && (
                        <span
                          style={{
                            marginLeft: "0.4rem",
                            fontSize: "0.7rem",
                            padding: "0.08rem 0.45rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(245,209,122,0.8)",
                          }}
                        >
                          OWNER
                        </span>
                      )}
                    </div>
                    <div style={{ justifyContent: "flex-end" }}>
                      {m.user_id === user.id && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#facc15",
                            textAlign: "right",
                          }}
                        >
                          Ini kamu
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Setoran & jadwal putaran */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Setoran arisan & jadwal putaran</h3>
              <p>
                Catatan iuran tiap putaran yang dibayar dari saldo dompet
                Nanad Invest.
              </p>
            </div>

            {myMember && nextRoundForUser && (
              <div
                style={{
                  marginTop: "0.9rem",
                  marginBottom: "0.75rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(245,209,122,0.5)",
                  background:
                    "radial-gradient(circle at top, rgba(245, 209, 122, 0.12), rgba(15, 23, 42, 1))",
                  fontSize: "0.8rem",
                  color: "#fef9c3",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.72rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Putaran berikutnya untuk kamu
                </p>
                <p style={{ margin: "0.25rem 0 0.4rem" }}>
                  Putaran ke-<strong>{nextRoundForUser}</strong> dengan iuran{" "}
                  <strong>{formatCurrency(group.monthly_amount || 0)}</strong>.
                  Gunakan saldo dompet Nanad Invest untuk mencatat setoran ini.
                </p>
                <button
                  type="button"
                  className="nanad-dashboard-deposit-submit"
                  disabled={payLoading}
                  onClick={handlePayNextRound}
                >
                  {payLoading
                    ? "Memproses setoran..."
                    : "Bayar iuran putaran ini dari dompet"}
                </button>
              </div>
            )}

            {myMember && !nextRoundForUser && (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
              >
                Kamu sudah menyelesaikan semua iuran untuk grup ini. 🎉
              </p>
            )}

            {!myMember && (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
              >
                Bergabung dulu ke grup arisan ini sebelum mencatat setoran
                iuran.
              </p>
            )}

            {roundsSummary.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.8rem" }}
              >
                Belum ada putaran yang tercatat atau total putaran belum
                diatur.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.8rem" }}
              >
                {roundsSummary.map((r) => (
                  <div key={r.round} className="nanad-dashboard-deposits-row">
                    <div>Putaran ke-{r.round}</div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Setoran tercatat:{" "}
                        <strong>
                          {r.count}/{memberCount || "-"} anggota
                        </strong>
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                        }}
                      >
                        Nominal per anggota:{" "}
                        {formatCurrency(group.monthly_amount || 0)} · Pot
                        maksimum:{" "}
                        {formatCurrency(
                          (group.monthly_amount || 0) * (memberCount || 1)
                        )}
                      </span>
                    </div>
                    <div style={{ justifyContent: "flex-end" }}>
                      {currentRoundNumber === r.round && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.6rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(245,209,122,0.8)",
                          }}
                        >
                          Putaran berjalan
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan &amp; saving
            circle.
          </span>
          <span>
            Sistem ini membantu mencatat iuran dan saldo. Kesepakatan teknis
            arisan (jadwal penerima, konsekuensi telat bayar, dsb.) tetap perlu
            disepakati di luar sistem oleh semua peserta.
          </span>
        </footer>
      </div>
    </main>
  );
}
