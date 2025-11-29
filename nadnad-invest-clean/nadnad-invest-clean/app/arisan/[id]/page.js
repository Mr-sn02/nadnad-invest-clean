// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "../../../lib/supabaseClient";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  const newDate = new Date(d.getTime());
  newDate.setMonth(d.getMonth() + n);
  return newDate;
}

export default function ArisanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id;

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [contribs, setContribs] = useState([]); // arisan_contributions
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [joining, setJoining] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAll = async (userId) => {
    setErrorMsg("");

    // 1) grup
    const { data: grp, error: gErr } = await supabase
      .from("arisan_groups")
      .select("*")
      .eq("id", groupId)
      .maybeSingle();

    if (gErr || !grp) {
      console.error("Load group error:", gErr?.message);
      setErrorMsg("Grup arisan tidak ditemukan.");
      return;
    }

    setGroup(grp);

    // 2) members
    const { data: mems, error: mErr } = await supabase
      .from("arisan_members")
      .select("*")
      .eq("group_id", groupId)
      .order("position", { ascending: true });

    if (mErr) {
      console.error("Load members error:", mErr.message);
      setErrorMsg("Gagal memuat anggota arisan.");
      return;
    }

    setMembers(mems || []);

    const me = (mems || []).find((m) => m.user_id === userId);
    setIsMember(!!me);
    if (me && me.nickname) setNickname(me.nickname);

    // 3) contributions
    const { data: contrib, error: cErr } = await supabase
      .from("arisan_contributions")
      .select("*")
      .eq("group_id", groupId);

    if (cErr) {
      console.error("Load contrib error:", cErr.message);
      setErrorMsg("Gagal memuat data setoran arisan.");
      return;
    }

    setContribs(contrib || []);
  };

  useEffect(() => {
    const init = async () => {
      if (!groupId) return;
      setLoading(true);
      setErrorMsg("");

      try {
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

        // ambil wallet
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Wallet error:", wErr.message);
        }
        setWallet(w || null);

        await loadAll(user.id);
      } catch (err) {
        console.error("Arisan detail init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat detail arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, groupId]);

  const handleJoin = async () => {
    if (!user) return;
    if (!group) return;

    if (isMember) {
      alert("Kamu sudah terdaftar di arisan ini.");
      return;
    }

    try {
      setJoining(true);
      // hitung posisi terakhir + 1
      const maxPos = members.reduce(
        (max, m) => (m.position && m.position > max ? m.position : max),
        0
      );
      const nextPos = maxPos + 1;

      const { error } = await supabase.from("arisan_members").insert({
        group_id: group.id,
        user_id: user.id,
        nickname: nickname.trim() || null,
        position: nextPos,
        status: "ACTIVE",
      });

      if (error) {
        console.error("Join error:", error.message);
        alert("Gagal bergabung ke arisan.");
        return;
      }

      await loadAll(user.id);
      alert("Berhasil bergabung ke arisan.");
    } catch (err) {
      console.error("Join error:", err);
      alert("Terjadi kesalahan saat bergabung.");
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!user || !group) return;
    const me = members.find((m) => m.user_id === user.id);
    if (!me) return;

    try {
      const { error } = await supabase
        .from("arisan_members")
        .update({
          nickname: nickname.trim() || null,
        })
        .eq("id", me.id);

      if (error) {
        console.error("Update nickname error:", error.message);
        alert("Gagal memperbarui nama panggilan.");
        return;
      }

      await loadAll(user.id);
      alert("Nama panggilan diperbarui.");
    } catch (err) {
      console.error("Update nickname error:", err);
      alert("Terjadi kesalahan saat menyimpan nama panggilan.");
    }
  };

  const handlePayFromWallet = async (roundNumber) => {
    if (!user || !wallet || !group) return;
    const me = members.find((m) => m.user_id === user.id);
    if (!me) {
      alert("Kamu belum menjadi anggota arisan ini.");
      return;
    }

    // cek apakah sudah setor untuk putaran ini
    const already = contribs.find(
      (c) =>
        c.user_id === user.id &&
        c.round_number === roundNumber
    );
    if (already) {
      alert("Kamu sudah mencatat setoran untuk putaran ini.");
      return;
    }

    const amount = group.monthly_amount || 0;
    if (!amount || amount <= 0) {
      alert("Nominal iuran per putaran tidak valid.");
      return;
    }

    if (!wallet.balance || wallet.balance < amount) {
      alert(
        `Saldo dompet kamu tidak cukup. Saldo sekarang: ${formatCurrency(
          wallet.balance || 0
        )}`
      );
      return;
    }

    if (
      !confirm(
        `Catat setoran arisan putaran ${roundNumber} sebesar ${formatCurrency(
          amount
        )} dan kurangi dari saldo dompet Nanad Invest kamu?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      const before = wallet.balance || 0;
      const after = before - amount;

      // 1) update saldo wallet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
        alert("Gagal mengurangi saldo dompet.");
        return;
      }

      // 2) catat transaksi wallet (jenis ARISAN_CONTRIB)
      const { data: txData, error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ARISAN_CONTRIB",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Setoran arisan '${group.name}' putaran ${roundNumber}`,
          user_email: user.email || null,
        })
        .select("id")
        .single();

      if (txErr) {
        console.error("Insert tx error:", txErr.message);
        alert("Gagal mencatat transaksi dompet.");
        return;
      }

      const walletTxId = txData?.id || null;

      // 3) catat ke arisan_contributions
      const { error: cErr } = await supabase
        .from("arisan_contributions")
        .insert({
          group_id: group.id,
          user_id: user.id,
          round_number: roundNumber,
          amount,
          from_wallet_id: wallet.id,
          wallet_transaction_id: walletTxId,
        });

      if (cErr) {
        console.error("Insert contrib error:", cErr.message);
        alert("Gagal mencatat setoran arisan.");
        return;
      }

      // refresh data
      const { data: newWallet, error: newWErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", wallet.id)
        .maybeSingle();

      if (!newWErr && newWallet) setWallet(newWallet);

      await loadAll(user.id);

      alert("Setoran arisan berhasil dicatat dan saldo dompet dikurangi.");
    } catch (err) {
      console.error("Pay from wallet error:", err);
      alert("Terjadi kesalahan saat mencatat setoran.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat detail arisan...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg || !group) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat grup arisan.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg || "Data grup tidak ditemukan."}
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

  const rounds = [];
  for (let i = 1; i <= group.total_rounds; i++) {
    const date = addMonths(group.start_date, i - 1);
    rounds.push({ roundNumber: i, date });
  }

  const memberById = {};
  members.forEach((m) => {
    memberById[m.user_id] = m;
  });

  const me = user ? members.find((m) => m.user_id === user.id) : null;

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
                Detail arisan · {group.name}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
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
              onClick={() => router.push("/arisan")}
            >
              Daftar arisan
            </button>
          </div>
        </header>

        {/* Info grup + status diri sendiri */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Arisan group</p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            Iuran per putaran{" "}
            <strong>{formatCurrency(group.monthly_amount)}</strong> selama{" "}
            <strong>{group.total_rounds} putaran</strong>, mulai{" "}
            <strong>
              {new Date(group.start_date).toLocaleDateString("id-ID")}
            </strong>
            . Status:{" "}
            <strong style={{ textTransform: "uppercase" }}>
              {group.status}
            </strong>
            .
          </p>
          {group.description && (
            <p className="nanad-dashboard-body" style={{ marginTop: "0.35rem" }}>
              {group.description}
            </p>
          )}

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet kamu</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
              >
                Setoran arisan yang dicatat dari dompet akan{" "}
                <strong>mengurangi saldo</strong> di sini (simulasi pencatatan).
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Status kamu</p>
              <p className="nanad-dashboard-stat-number">
                {me ? "Anggota arisan" : "Belum terdaftar"}
              </p>

              {me ? (
                <>
                  <p
                    className="nanad-dashboard-body"
                    style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
                  >
                    Urutan menerima arisan:{" "}
                    <strong>
                      {me.position ? `Putaran ke-${me.position}` : "Belum diatur"}
                    </strong>
                    .
                  </p>
                  <div
                    style={{
                      marginTop: "0.4rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.45rem",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nama panggilan di arisan"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      style={{
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.7)",
                        background:
                          "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                        padding: "0.35rem 0.8rem",
                        fontSize: "0.78rem",
                        color: "#e5e7eb",
                        outline: "none",
                        minWidth: "180px",
                      }}
                    />
                    <button
                      type="button"
                      className="nanad-dashboard-logout"
                      style={{ fontSize: "0.74rem", padding: "0.4rem 0.9rem" }}
                      onClick={handleUpdateNickname}
                    >
                      Simpan nama panggilan
                    </button>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    marginTop: "0.5rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nama panggilan di arisan (opsional)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                      padding: "0.35rem 0.8rem",
                      fontSize: "0.78rem",
                      color: "#e5e7eb",
                      outline: "none",
                      minWidth: "180px",
                    }}
                  />
                  <button
                    type="button"
                    disabled={joining}
                    className="nanad-dashboard-deposit-submit"
                    style={{ fontSize: "0.74rem", padding: "0.4rem 0.9rem" }}
                    onClick={handleJoin}
                  >
                    {joining ? "Memproses..." : "Gabung arisan ini"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Jadwal putaran & setoran */}
        <section className="nanad-dashboard-table-section">
          {/* Jadwal & setoran pribadi */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran &amp; setoran kamu</h3>
              <p>
                Lihat jadwal putaran, lalu catat setoran yang diambil dari
                saldo dompet Nanad Invest kamu.
              </p>
            </div>

            {!me ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum menjadi anggota arisan ini. Gabung terlebih dahulu
                untuk mulai mencatat setoran.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((r) => {
                  const myContrib = contribs.find(
                    (c) =>
                      c.user_id === user.id &&
                      c.round_number === r.roundNumber
                  );

                  const isMyReceiveRound =
                    me.position && me.position === r.roundNumber;

                  const dateStr = r.date.toLocaleDateString("id-ID");

                  return (
                    <div
                      key={r.roundNumber}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>
                        Putaran ke-{r.roundNumber}
                        <br />
                        <small>{dateStr}</small>
                      </div>
                      <div>
                        Iuran:{" "}
                        <strong>
                          {formatCurrency(group.monthly_amount)}
                        </strong>
                        <br />
                        {isMyReceiveRound ? (
                          <span
                            style={{
                              fontSize: "0.76rem",
                              color: "#4ade80",
                            }}
                          >
                            Ini jadwal perkiraan kamu menerima arisan
                            (berdasarkan urutan).
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.76rem",
                              color: "#e5e7eb",
                            }}
                          >
                            Putaran reguler untuk setoran arisan.
                          </span>
                        )}
                        {myContrib && (
                          <p
                            className="nanad-dashboard-body"
                            style={{
                              marginTop: "0.3rem",
                              fontSize: "0.78rem",
                              color: "#bbf7d0",
                            }}
                          >
                            Sudah dicatat: {formatCurrency(myContrib.amount)}{" "}
                            pada{" "}
                            {new Date(
                              myContrib.paid_at
                            ).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                        }}
                      >
                        {!myContrib && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            className="nanad-dashboard-deposit-submit"
                            style={{
                              fontSize: "0.74rem",
                              padding: "0.4rem 0.9rem",
                            }}
                            onClick={() =>
                              handlePayFromWallet(r.roundNumber)
                            }
                          >
                            {actionLoading
                              ? "Memproses..."
                              : "Setor dari dompet"}
                          </button>
                        )}
                        {myContrib && (
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "#4ade80",
                            }}
                          >
                            Setoran tercatat
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daftar anggota & urutan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar anggota &amp; urutan menerima</h3>
              <p>
                Daftar ini membantu semua peserta melihat siapa saja yang
                terlibat dan urutan perkiraan penerima arisan.
              </p>
            </div>

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota di arisan ini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="nanad-dashboard-deposits-row"
                  >
                    <div>
                      {m.position
                        ? `Urutan ke-${m.position}`
                        : "Urutan belum diatur"}
                      <br />
                      <small>
                        Bergabung:{" "}
                        {new Date(m.joined_at).toLocaleString("id-ID")}
                      </small>
                    </div>
                    <div>
                      <strong>
                        {m.nickname || "(Nama panggilan belum diisi)"}
                      </strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#e5e7eb",
                        }}
                      >
                        {m.user_id === user.id
                          ? "Ini akun kamu"
                          : "Peserta arisan"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        fontSize: "0.78rem",
                        color: "#9ca3af",
                      }}
                    >
                      {m.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module.
          </span>
          <span>
            Semua pencatatan di sini bersifat simulasi / administratif. Pastikan
            pergerakan dana nyata diatur dengan kesepakatan tertulis dan sesuai
            regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
