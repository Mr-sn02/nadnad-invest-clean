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

  // membership user
  const myMember = useMemo(() => {
    if (!user) return null;
    return members.find((m) => m.user_id === user.id) || null;
  }, [members, user]);

  // putaran berikutnya untuk user ini
  const nextRoundForUser = useMemo(() => {
    if (!group || !myMember) return null;
    const myContribs = contribs.filter((c) => c.user_id === myMember.user_id);
    const lastRound = myContribs.reduce(
      (max, c) => Math.max(max, Number(c.round_number) || 0),
      0
    );
    const next = lastRound + 1;
    if (!group.total_rounds) return next;
    if (next > group.total_rounds) return null;
    return next;
  }, [group, myMember, contribs]);

  // load awal
  useEffect(() => {
    if (!groupId) return;

    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // user
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

        // group
        const { data: g, error: gErr } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (gErr || !g) {
          console.error("Load group error:", gErr?.message);
          setErrorMsg("Grup arisan tidak ditemukan.");
          return;
        }

        setGroup(g);

        // wallet
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Load wallet error:", wErr.message);
        }
        setWallet(w || null);

        // members
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

        // contributions
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
        setErrorMsg("Terjadi kesalahan saat memuat detail arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [groupId, router]);

  const isOwner = group && user && group.owner_user_id === user.id;
  const memberCount = members.length;
  const totalPot =
    (group?.monthly_amount || 0) * (memberCount > 0 ? memberCount : 1);

  // gabung grup
  const handleJoinGroup = async () => {
    if (!group || !user) return;
    if (myMember) {
      alert("Kamu sudah menjadi anggota grup ini.");
      return;
    }

    try {
      setJoinLoading(true);
      setErrorMsg("");

      const nextPosition = members.length + 1;

      const { error } = await supabase.from("arisan_members").insert({
        group_id: group.id,
        user_id: user.id,
        position: nextPosition,
        status: "ACTIVE",
      });

      if (error) {
        console.error("Join group error:", error.message);
        setErrorMsg("Gagal bergabung ke grup arisan.");
        return;
      }

      const { data: m, error: mErr } = await supabase
        .from("arisan_members")
        .select("*")
        .eq("group_id", group.id)
        .order("position", { ascending: true });

      if (!mErr && m) setMembers(m);

      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("Join group unexpected error:", err);
      setErrorMsg("Terjadi kesalahan saat bergabung ke grup.");
    } finally {
      setJoinLoading(false);
    }
  };

  // bayar iuran putaran berikutnya dari wallet
  const handlePayNextRound = async () => {
    if (!group || !user || !wallet || !myMember) {
      alert(
        "Data belum lengkap. Pastikan kamu punya dompet dan sudah bergabung ke grup."
      );
      return;
    }

    if (!nextRoundForUser) {
      alert("Kamu sudah melunasi semua iuran arisan ini.");
      return;
    }

    const amount = group.monthly_amount || 0;
    if (!amount || amount <= 0) {
      alert("Nominal iuran belum diset di grup ini.");
      return;
    }

    if ((wallet.balance || 0) < amount) {
      alert(
        `Saldo dompet tidak cukup.\nSaldo: ${formatCurrency(
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

      // 1) simpan kontribusi
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
        alert("Gagal mencatat setoran arisan. Saldo belum diubah.");
        return;
      }

      // 2) catat transaksi wallet
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
      }

      // 3) update saldo wallet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
      }

      // reload wallet & kontribusi
      const { data: wReload } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", wallet.id)
        .maybeSingle();

      if (wReload) setWallet(wReload);

      const { data: cReload } = await supabase
        .from("arisan_contributions")
        .select("*")
        .eq("group_id", group.id)
        .order("round_number", { ascending: true })
        .order("created_at", { ascending: true });

      if (cReload) setContribs(cReload);

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
            <p className="nanad-dashboard-body">{errorMsg}</p>
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
                Arisan · Detail grup &amp; iuran
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

        {/* Info grup */}
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
              "Grup arisan yang tercatat di Nanad Invest. Iuran dapat dicatat dari saldo dompet masing-masing."}
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Iuran per putaran</p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(group.monthly_amount || 0)}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Total putaran</p>
              <p className="nanad-dashboard-stat-number">
                {group.total_rounds || "-"}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Perkiraan pot per putaran
              </p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalPot)}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet kamu</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
            </div>
          </div>

          {myMember && (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.6rem", fontSize: "0.8rem" }}
            >
              Kamu terdaftar sebagai anggota pada posisi{" "}
              <strong>#{myMember.position}</strong>{" "}
              {isOwner && "(kamu juga pemilik grup ini)"}.
            </p>
          )}

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

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.5rem", color: "#fecaca" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* Anggota & iuran */}
        <section className="nanad-dashboard-table-section">
          {/* Anggota */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota & urutan</h3>
              <p>
                Urutan bisa digunakan sebagai urutan penerima arisan, sesuai
                kesepakatan kalian.
              </p>
            </div>

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota dalam grup ini.
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
                        {m.user_id === user.id
                          ? "Kamu"
                          : m.nickname || `Member #${m.position}`}
                      </strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.76rem",
                          color: "#9ca3af",
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

          {/* Iuran */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Setoran iuran arisan</h3>
              <p>
                Iuran yang dibayar dari saldo dompet akan tercatat di sini dan
                di riwayat dompet.
              </p>
            </div>

            {myMember && nextRoundForUser && (
              <div
                style={{
                  marginTop: "0.9rem",
                  marginBottom: "0.8rem",
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
                </p>
                <button
                  type="button"
                  className="nanad-dashboard-deposit-submit"
                  disabled={payLoading}
                  onClick={handlePayNextRound}
                >
                  {payLoading
                    ? "Memproses setoran..."
                    : "Bayar iuran dari dompet"}
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
                Bergabung ke grup terlebih dahulu sebelum mencatat setoran
                iuran.
              </p>
            )}

            {contribs.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.8rem" }}
              >
                Belum ada setoran arisan yang tercatat.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.8rem" }}
              >
                {contribs.map((c) => (
                  <div key={c.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Putaran ke-{c.round_number}
                      <br />
                      <span
                        style={{
                          fontSize: "0.76rem",
                          color: "#9ca3af",
                        }}
                      >
                        {new Date(c.created_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Setoran {formatCurrency(c.amount || 0)}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            c.status === "PAID" || c.status === "COMPLETED"
                              ? "#4ade80"
                              : "#facc15",
                        }}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div style={{ justifyContent: "flex-end" }}>
                      {formatCurrency(c.amount || 0)}
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
            Kesepakatan teknis arisan (urutan penerima, denda, dll.) tetap
            menjadi kesepakatan para peserta. Sistem ini membantu pencatatan
            saja.
          </span>
        </footer>
      </div>
    </main>
  );
}
