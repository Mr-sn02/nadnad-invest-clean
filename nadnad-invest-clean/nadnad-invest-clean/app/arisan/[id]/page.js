// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "../../../lib/supabaseClient";

const ADMIN_EMAILS = ["sonnnn603@gmail.com"]; // bisa tambah email admin lain

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
  const [contribs, setContribs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [joining, setJoining] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isMember, setIsMember] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // ---------- LOAD DATA DARI SUPABASE ----------
  const loadAll = async (userId) => {
    setErrorMsg("");

    // 1) Detail grup
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

    // 2) Anggota
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

    // 3) Setoran arisan
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

    // 4) Pencairan arisan
    const { data: pays, error: pErr } = await supabase
      .from("arisan_payouts")
      .select("*")
      .eq("group_id", groupId);

    if (pErr) {
      console.error("Load payouts error:", pErr.message);
      // tidak fatal, jadi hanya console.error
    } else {
      setPayouts(pays || []);
    }
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

        // Ambil dompet user (kalau belum ada, boleh null)
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

  // ----------------- JOIN ARISAN & NICKNAME -----------------

  const handleJoin = async () => {
    if (!user || !group) return;

    if (isMember) {
      alert("Kamu sudah terdaftar di arisan ini.");
      return;
    }

    try {
      setJoining(true);

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

  // ----------------- SETOR DARI DOMPET -----------------

  const handlePayFromWallet = async (roundNumber) => {
    if (!user || !wallet || !group) return;

    const me = members.find((m) => m.user_id === user.id);
    if (!me) {
      alert("Kamu belum menjadi anggota arisan ini.");
      return;
    }

    // cek sudah setor belum
    const already = contribs.find(
      (c) => c.user_id === user.id && c.round_number === roundNumber
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

      // 1) Update saldo dompet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
        alert("Gagal mengurangi saldo dompet.");
        return;
      }

      // 2) Catat transaksi dompet (WITHDRAW + APPROVED)
      const { data: txData, error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "WITHDRAW",
          amount,
          balance_before: before,
          balance_after: after,
          status: "APPROVED",
          note: `Setoran arisan '${group.name}' putaran ${roundNumber}`,
          user_email: user.email || null,
        })
        .select("id")
        .single();

      if (txErr) {
        console.error("Insert tx error:", txErr);
        alert(
          "Gagal mencatat transaksi dompet: " +
            (txErr.message ||
              "cek definisi tabel wallet_transactions di Supabase.")
        );
        return;
      }

      const walletTxId = txData?.id || null;

      // 3) Catat ke tabel setoran arisan
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
        console.error("Insert contrib error:", cErr);
        alert(
          "Gagal mencatat setoran arisan: " +
            (cErr.message ||
              "cek tabel arisan_contributions di Supabase.")
        );
        return;
      }

      // Refresh dompet & arisan
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
      alert(
        "Terjadi kesalahan saat mencatat setoran: " +
          (err.message || "error tak dikenal.")
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------- PENC AIRAN (PAYOUT) OLEH ADMIN -----------------

  const handlePayout = async (roundNumber) => {
    if (!user || !group) return;

    const isGlobalAdmin =
      user.email && ADMIN_EMAILS.includes(user.email);
    const isGroupOwner =
      group.owner_user_id && group.owner_user_id === user.id;
    const isAdminForThisGroup = isGlobalAdmin || isGroupOwner;

    if (!isAdminForThisGroup) {
      alert("Hanya admin arisan yang dapat menandai pencairan.");
      return;
    }

    // Jangan dobel payout
    const existing = payouts.find((p) => p.round_number === roundNumber);
    if (existing) {
      alert("Putaran ini sudah ditandai cair sebelumnya.");
      return;
    }

    const receiverMember = members.find(
      (m) => m.position === roundNumber
    );
    if (!receiverMember) {
      alert(
        "Tidak ada anggota dengan urutan penerima untuk putaran ini."
      );
      return;
    }

    const roundContribs = contribs.filter(
      (c) => c.round_number === roundNumber
    );
    const totalMembers = members.length;
    const paidCount = roundContribs.length;

    if (!totalMembers || paidCount !== totalMembers) {
      if (
        !confirm(
          "Belum semua anggota mencatat setoran untuk putaran ini. Tetap tandai sebagai sudah dicairkan?"
        )
      ) {
        return;
      }
    }

    const totalPot = roundContribs.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    if (!totalPot || totalPot <= 0) {
      if (
        !confirm(
          "Total pot untuk putaran ini tercatat 0. Lanjutkan pencairan tetap sebagai catatan administratif?"
        )
      ) {
        return;
      }
    }

    if (
      !confirm(
        `Tandai putaran ${roundNumber} sebagai \"SUDAH DIBAYAR\" ke peserta dengan urutan ke-${roundNumber}?`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      // Cari dompet penerima
      let { data: recvWallet, error: rwErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", receiverMember.user_id)
        .maybeSingle();

      if (rwErr) {
        console.error("Receiver wallet error:", rwErr.message);
      }

      // Jika belum punya dompet, buat baru
      if (!recvWallet) {
        const { data: created, error: createErr } = await supabase
          .from("wallets")
          .insert({
            user_id: receiverMember.user_id,
            user_email: null,
            balance: 0,
            currency: "IDR",
          })
          .select("*")
          .single();

        if (createErr) {
          console.error("Create receiver wallet error:", createErr);
          alert("Gagal menyiapkan dompet penerima.");
          return;
        }
        recvWallet = created;
      }

      const before = recvWallet.balance || 0;
      const after = before + totalPot;

      // 1) Update saldo dompet penerima
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", recvWallet.id);

      if (updErr) {
        console.error("Update receiver wallet error:", updErr.message);
        alert("Gagal memperbarui saldo dompet penerima.");
        return;
      }

      // 2) Catat transaksi dompet (DEPOSIT + APPROVED)
      const { data: depTx, error: depErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: recvWallet.id,
          type: "DEPOSIT",
          amount: totalPot,
          balance_before: before,
          balance_after: after,
          status: "APPROVED",
          note: `Penerimaan arisan '${group.name}' putaran ${roundNumber}`,
          user_email: recvWallet.user_email || null,
        })
        .select("id")
        .single();

      if (depErr) {
        console.error("Insert payout tx error:", depErr);
        alert(
          "Gagal mencatat transaksi dompet penerima: " +
            (depErr.message ||
              "cek tabel wallet_transactions di Supabase.")
        );
        return;
      }

      const payoutTxId = depTx?.id || null;

      // 3) Catat ke tabel arisan_payouts
      const { error: payErr } = await supabase
        .from("arisan_payouts")
        .insert({
          group_id: group.id,
          round_number: roundNumber,
          receiver_user_id: receiverMember.user_id,
          total_amount: totalPot,
          status: "PAID",
          wallet_id: recvWallet.id,
          wallet_transaction_id: payoutTxId,
          admin_user_id: user.id,
          note: `Pencairan arisan '${group.name}' putaran ${roundNumber}`,
        });

      if (payErr) {
        console.error("Insert arisan_payouts error:", payErr);
        alert(
          "Saldo dompet penerima sudah diperbarui, tetapi gagal mencatat payout di tabel arisan_payouts. Periksa manual di Supabase."
        );
        return;
      }

      // Refresh data
      if (receiverMember.user_id === user.id) {
        // kalau kebetulan admin = penerima, refresh dompet di state
        const { data: newWallet, error: nwErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("id", recvWallet.id)
          .maybeSingle();
        if (!nwErr && newWallet) setWallet(newWallet);
      }

      await loadAll(user.id);

      alert(
        `Putaran ${roundNumber} berhasil ditandai sebagai sudah dicairkan.`
      );
    } catch (err) {
      console.error("Payout error:", err);
      alert(
        "Terjadi kesalahan saat mencatat pencairan: " +
          (err.message || "error tak dikenal.")
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ----------------- RENDER STATE LOADING / ERROR -----------------

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat detail arisan...</p>
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

  // ================= DATA TURUNAN UNTUK JADWAL ==================

  const rounds = [];
  const totalRounds = group.total_rounds || 0;
  for (let i = 1; i <= totalRounds; i++) {
    const date = addMonths(group.start_date, i - 1);
    rounds.push({ roundNumber: i, date });
  }

  const me = user ? members.find((m) => m.user_id === user.id) : null;
  const totalMembers = members.length;

  const isGlobalAdmin =
    user && user.email && ADMIN_EMAILS.includes(user.email);
  const isGroupOwner =
    group?.owner_user_id && user && group.owner_user_id === user.id;
  const isAdminForThisGroup = isGlobalAdmin || isGroupOwner;

  // ======================= UI =======================

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

        {/* Info grup + status user */}
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
                <strong>mengurangi saldo</strong> di sini (simulasi
                pencatatan).
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
          {/* Putaran + payout */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran, penerima, setoran &amp; pencairan</h3>
              <p>
                Lihat jadwal iuran, calon penerima, siapa saja yang sudah
                setor, dan status pencairan dana per putaran.
              </p>
            </div>

            {totalRounds === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Jumlah putaran arisan belum diatur.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((r) => {
                  const dateStr = r.date.toLocaleDateString("id-ID");

                  const receiverMember = members.find(
                    (m) => m.position === r.roundNumber
                  );

                  const roundContribs = contribs.filter(
                    (c) => c.round_number === r.roundNumber
                  );
                  const paidCount = roundContribs.length;
                  const totalPot = roundContribs.reduce(
                    (sum, c) => sum + (c.amount || 0),
                    0
                  );
                  const allPaid =
                    totalMembers > 0 && paidCount === totalMembers;

                  const myContrib = roundContribs.find(
                    (c) => c.user_id === user?.id
                  );

                  const isMyReceiveRound =
                    me && me.position === r.roundNumber;

                  const payout = payouts.find(
                    (p) => p.round_number === r.roundNumber
                  );

                  return (
                    <div
                      key={r.roundNumber}
                      className="nanad-dashboard-deposits-row"
                    >
                      {/* Kolom kiri: info putaran */}
                      <div>
                        Putaran ke-{r.roundNumber}
                        <br />
                        <small>{dateStr}</small>
                        {allPaid && !payout && (
                          <div
                            style={{
                              marginTop: "0.35rem",
                              fontSize: "0.7rem",
                              color: "#bbf7d0",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            ✓ Semua anggota sudah setor
                          </div>
                        )}
                        {payout && (
                          <div
                            style={{
                              marginTop: "0.35rem",
                              fontSize: "0.7rem",
                              color: "#facc15",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            ✓ SUDAH CAIR{" "}
                            {payout.paid_at &&
                              " · " +
                                new Date(
                                  payout.paid_at
                                ).toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>

                      {/* Kolom tengah: penerima, ringkasan, status payout */}
                      <div>
                        <div>
                          Iuran:{" "}
                          <strong>
                            {formatCurrency(group.monthly_amount)}
                          </strong>
                        </div>

                        <div style={{ marginTop: "0.25rem" }}>
                          Calon penerima putaran ini:{" "}
                          <strong>
                            {receiverMember
                              ? receiverMember.nickname ||
                                "(nama panggilan belum diisi)"
                              : "Belum diatur (tidak ada anggota dengan urutan ini)"}
                          </strong>
                          {isMyReceiveRound && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                marginLeft: "0.3rem",
                                color: "#facc15",
                              }}
                            >
                              ← Ini jadwal kamu menerima
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "0.3rem",
                            fontSize: "0.78rem",
                            color: "#e5e7eb",
                          }}
                        >
                          Status setoran:{" "}
                          <strong>
                            {paidCount}/{totalMembers} peserta
                          </strong>{" "}
                          sudah tercatat, total pot sementara{" "}
                          <strong>{formatCurrency(totalPot)}</strong>.
                        </div>

                        {myContrib && (
                          <p
                            className="nanad-dashboard-body"
                            style={{
                              marginTop: "0.3rem",
                              fontSize: "0.78rem",
                              color: "#bbf7d0",
                            }}
                          >
                            Setoran kamu:{" "}
                            {formatCurrency(myContrib.amount)} pada{" "}
                            {myContrib.paid_at
                              ? new Date(
                                  myContrib.paid_at
                                ).toLocaleString("id-ID")
                              : "waktu tidak tercatat"}
                          </p>
                        )}

                        {payout && (
                          <p
                            className="nanad-dashboard-body"
                            style={{
                              marginTop: "0.3rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            Dana telah ditandai{" "}
                            <strong>cair ke penerima</strong>. Catatan
                            administratif: {payout.note || "-"}
                          </p>
                        )}
                      </div>

                      {/* Kolom kanan: tombol setor / payout */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          gap: "0.45rem",
                        }}
                      >
                        {/* Tombol setor user */}
                        {!me ? (
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "#9ca3af",
                              textAlign: "right",
                            }}
                          >
                            Gabung arisan dulu untuk mulai setor.
                          </span>
                        ) : !myContrib ? (
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
                        ) : (
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: "#4ade80",
                            }}
                          >
                            Setoran kamu sudah tercatat
                          </span>
                        )}

                        {/* Tombol payout admin */}
                        {isAdminForThisGroup && !payout && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            className="nanad-dashboard-logout"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.35rem 0.9rem",
                              marginTop: "0.25rem",
                            }}
                            onClick={() =>
                              handlePayout(r.roundNumber)
                            }
                          >
                            Tandai sudah cair
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daftar anggota */}
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
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>
                      {m.position
                        ? `Urutan ke-${m.position}`
                        : "Urutan belum diatur"}
                      <br />
                      <small>
                        Bergabung:{" "}
                        {m.joined_at
                          ? new Date(m.joined_at).toLocaleString(
                              "id-ID"
                            )
                          : "-"}
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
                        {m.user_id === user?.id
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
            Jadwal penerima dan setoran di sini bersifat administratif. Pastikan
            penyaluran dana nyata diatur dengan kesepakatan dan aturan yang
            jelas.
          </span>
        </footer>
      </div>
    </main>
  );
}
