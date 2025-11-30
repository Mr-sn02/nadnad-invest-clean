// app/arisan/[id]/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Format tanggal
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArisanGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [group, setGroup] = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);

  const [pageError, setPageError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [payLoadingRoundId, setPayLoadingRoundId] = useState(null);
  const [winnerLoadingRoundId, setWinnerLoadingRoundId] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // apakah user adalah owner grup?
  const isOwner = useMemo(
    () => membership?.role === "OWNER",
    [membership]
  );

  // Muat data awal
  useEffect(() => {
    if (!groupId) return;

    const init = async () => {
      setLoading(true);
      setPageError("");

      try {
        // 1) Cek user
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.error("auth getUser error:", authErr.message);
        }
        const u = authData?.user;
        if (!u) {
          router.push("/login");
          return;
        }
        setUser(u);

        // 2) Ambil grup
        const { data: g, error: gErr } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (gErr) {
          console.error("load group error:", gErr.message);
          setPageError("Gagal memuat grup arisan.");
          return;
        }
        if (!g) {
          setPageError("Grup arisan tidak ditemukan.");
          return;
        }
        setGroup(g);

        // 3) Keanggotaan user ini
        const { data: m, error: mErr } = await supabase
          .from("arisan_memberships")
          .select("*")
          .eq("group_id", groupId)
          .eq("user_id", u.id)
          .maybeSingle();

        if (mErr) {
          console.error("load membership error:", mErr.message);
        }
        setMembership(m ?? null);

        // 4) Daftar semua anggota
        const { data: memberList, error: membersErr } = await supabase
          .from("arisan_memberships")
          .select("*")
          .eq("group_id", groupId)
          .order("joined_at", { ascending: true });

        if (membersErr) {
          console.error("load members error:", membersErr.message);
        } else {
          setMembers(memberList || []);
        }

        // 5) Putaran
        const { data: roundList, error: roundsErr } = await supabase
          .from("arisan_rounds")
          .select("*")
          .eq("group_id", groupId)
          .order("round_number", { ascending: true });

        if (roundsErr) {
          console.error("load rounds error:", roundsErr.message);
        } else {
          setRounds(roundList || []);
        }

        // 6) Pembayaran semua anggota
        const { data: payList, error: payErr } = await supabase
          .from("arisan_round_payments")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true });

        if (payErr) {
          console.error("load payments error:", payErr.message);
        } else {
          setPayments(payList || []);
        }

        // 7) Pesan chat grup
        const { data: msgList, error: msgErr } = await supabase
          .from("arisan_group_messages")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true })
          .limit(100);

        if (msgErr) {
          console.error("load messages error:", msgErr.message);
        } else {
          setMessages(msgList || []);
        }
      } catch (err) {
        console.error("Unexpected arisan group init error:", err);
        setPageError("Terjadi kesalahan saat memuat grup arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [groupId, router]);

  // Map bantuan: pembayaran per round + user
  const paymentMap = useMemo(() => {
    const map = new Map();
    for (const p of payments) {
      const key = `${p.round_id}-${p.user_id}`;
      map.set(key, p);
    }
    return map;
  }, [payments]);

  // Hitung total setoran per putaran (dipakai pot arisan)
  const totalPaidPerRound = useMemo(() => {
    const agg = {};
    for (const p of payments) {
      agg[p.round_id] = (agg[p.round_id] || 0) + (p.amount || 0);
    }
    return agg;
  }, [payments]);

  // ================== AKSI ===================

  // User join grup ini
  const handleJoinGroup = async () => {
    if (!user || !group) return;
    if (membership) {
      alert("Kamu sudah terdaftar sebagai anggota grup ini.");
      return;
    }

    setJoinLoading(true);
    try {
      const displayName = user.email || "Member";

      const { data: inserted, error } = await supabase
        .from("arisan_memberships")
        .insert({
          group_id: group.id,
          user_id: user.id,
          user_email: user.email,
          display_name: displayName,
          role: "MEMBER",
        })
        .select("*")
        .single();

      if (error) {
        console.error("join group error:", error.message);
        alert("Gagal bergabung ke grup arisan.");
        return;
      }

      setMembership(inserted);

      // refresh anggota
      const { data: memberList } = await supabase
        .from("arisan_memberships")
        .select("*")
        .eq("group_id", group.id)
        .order("joined_at", { ascending: true });

      setMembers(memberList || []);
      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("join group unexpected error:", err);
      alert("Terjadi kesalahan saat bergabung ke grup.");
    } finally {
      setJoinLoading(false);
    }
  };

  // Setor iuran dari dompet ke putaran tertentu
  const handlePayFromWallet = async (round) => {
    if (!user || !group || !membership) {
      alert("Kamu harus menjadi anggota grup untuk setor iuran.");
      return;
    }

    setPayLoadingRoundId(round.id);
    try {
      // 1) Ambil dompet user
      const { data: wallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wErr) {
        console.error("wallet load error:", wErr.message);
        alert("Gagal memuat Dompet Nadnad kamu.");
        return;
      }

      if (!wallet) {
        alert(
          "Dompet Nadnad kamu belum ada. Silakan buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
        );
        return;
      }

      const amount = group.per_round_amount;
      if ((wallet.balance || 0) < amount) {
        alert(
          `Saldo dompet kamu kurang. Saldo: ${formatCurrency(
            wallet.balance
          )}, iuran putaran: ${formatCurrency(amount)}`
        );
        return;
      }

      // Cek apakah sudah pernah setor untuk putaran ini
      const key = `${round.id}-${user.id}`;
      if (paymentMap.has(key)) {
        alert("Kamu sudah tercatat setor iuran untuk putaran ini.");
        return;
      }

      const before = wallet.balance || 0;
      const after = before - amount;

      // 2) Catat pembayaran arisan_round_payments
      const { error: payErr } = await supabase
        .from("arisan_round_payments")
        .insert({
          group_id: group.id,
          round_id: round.id,
          user_id: user.id,
          wallet_id: wallet.id,
          amount,
        });

      if (payErr) {
        console.error("insert payment error:", payErr.message);
        alert("Gagal mencatat setoran arisan.");
        return;
      }

      // 3) Update saldo dompet & transaksi dompet
      const { error: updWalletErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (updWalletErr) {
        console.error("update wallet error:", updWalletErr.message);
        alert("Gagal memperbarui saldo dompet.");
        return;
      }

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ARISAN_PAY",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Setoran arisan putaran ${round.round_number} grup ${group.name}`,
          user_email: user.email || null,
        });

      if (txErr) {
        console.error("wallet tx error:", txErr.message);
        // tidak fatal untuk user, saldo sudah berubah
      }

      // 4) refresh payments
      const { data: payList, error: payReloadErr } = await supabase
        .from("arisan_round_payments")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true });

      if (!payReloadErr) {
        setPayments(payList || []);
      }

      alert("Setoran arisan berhasil dicatat dari Dompet Nadnad kamu.");
    } catch (err) {
      console.error("pay from wallet unexpected error:", err);
      alert("Terjadi kesalahan saat mencatat setoran arisan.");
    } finally {
      setPayLoadingRoundId(null);
    }
  };

  // Owner menetapkan pemenang + auto kredit ke dompet
  const handleSetWinnerAndCredit = async (round, winnerUserId) => {
    if (!isOwner) {
      alert("Hanya pemilik grup yang bisa menetapkan pemenang.");
      return;
    }

    setWinnerLoadingRoundId(round.id);
    try {
      // Cari anggota winner
      const winnerMember = members.find((m) => m.user_id === winnerUserId);
      if (!winnerMember) {
        alert("Anggota pemenang tidak ditemukan.");
        return;
      }

      // Hitung pot (total iuran yang sudah tercatat)
      const { data: roundPays, error: payErr } = await supabase
        .from("arisan_round_payments")
        .select("amount")
        .eq("group_id", group.id)
        .eq("round_id", round.id);

      if (payErr) {
        console.error("load round payments error:", payErr.message);
        alert("Gagal membaca setoran putaran.");
        return;
      }

      let pot = 0;
      for (const p of roundPays || []) {
        pot += p.amount || 0;
      }

      if (pot <= 0) {
        const ok = window.confirm(
          "Belum ada setoran tercatat untuk putaran ini. Tetap lanjut menetapkan pemenang tanpa kredit dompet?"
        );
        if (!ok) {
          setWinnerLoadingRoundId(null);
          return;
        }
      }

      // Ambil / buat dompet pemenang
      const { data: existingWallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", winnerUserId)
        .maybeSingle();

      let winnerWallet = existingWallet;
      if (wErr) {
        console.error("winner wallet load error:", wErr.message);
        alert("Gagal memuat Dompet Nadnad pemenang.");
        return;
      }

      if (!winnerWallet) {
        const { data: createdWallet, error: createErr } = await supabase
          .from("wallets")
          .insert({
            user_id: winnerUserId,
            user_email: winnerMember.user_email,
            balance: 0,
          })
          .select("*")
          .single();

        if (createErr) {
          console.error("create winner wallet error:", createErr.message);
          alert("Gagal membuat Dompet Nadnad pemenang.");
          return;
        }
        winnerWallet = createdWallet;
      }

      let before = winnerWallet.balance || 0;
      let after = before + pot;

      // Kredit dompet jika ada pot > 0
      if (pot > 0) {
        const { error: updWalletErr } = await supabase
          .from("wallets")
          .update({ balance: after })
          .eq("id", winnerWallet.id);

        if (updWalletErr) {
          console.error("update winner wallet error:", updWalletErr.message);
          alert("Gagal mengkredit Dompet Nadnad pemenang.");
          return;
        }

        const { error: txErr } = await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: winnerWallet.id,
            type: "ARISAN_WIN",
            amount: pot,
            balance_before: before,
            balance_after: after,
            status: "COMPLETED",
            note: `Kredit kemenangan arisan putaran ${round.round_number} grup ${group.name}`,
            user_email: winnerMember.user_email || null,
          });

        if (txErr) {
          console.error("winner wallet tx error:", txErr.message);
          // tidak fatal, saldo sudah masuk
        }
      }

      // Update info putaran
      const { error: updRoundErr } = await supabase
        .from("arisan_rounds")
        .update({
          status: "CLOSED",
          winner_user_id: winnerUserId,
          winner_wallet_id: winnerWallet.id,
          winner_credit_amount: pot,
        })
        .eq("id", round.id);

      if (updRoundErr) {
        console.error("update round error:", updRoundErr.message);
        alert("Gagal memperbarui status putaran.");
        return;
      }

      // Refresh rounds
      const { data: roundList, error: roundsErr } = await supabase
        .from("arisan_rounds")
        .select("*")
        .eq("group_id", group.id)
        .order("round_number", { ascending: true });

      if (!roundsErr) {
        setRounds(roundList || []);
      }

      alert(
        `Pemenang putaran ${round.round_number} ditetapkan, Dompet Nadnad dikredit ${formatCurrency(
          pot
        )}.`
      );
    } catch (err) {
      console.error("set winner unexpected error:", err);
      alert("Terjadi kesalahan saat menetapkan pemenang.");
    } finally {
      setWinnerLoadingRoundId(null);
    }
  };

  // Kirim pesan chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !user || !group) return;

    if (!membership) {
      alert("Hanya anggota grup yang bisa mengirim pesan.");
      return;
    }

    setChatSending(true);
    try {
      const { error } = await supabase.from("arisan_group_messages").insert({
        group_id: group.id,
        sender_user_id: user.id,
        sender_email: user.email,
        sender_display_name: membership.display_name || user.email,
        content: chatText.trim(),
      });

      if (error) {
        console.error("send message error:", error.message);
        alert("Gagal mengirim pesan.");
        return;
      }

      setChatText("");

      const { data: msgList, error: msgErr } = await supabase
        .from("arisan_group_messages")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!msgErr) {
        setMessages(msgList || []);
      }
    } catch (err) {
      console.error("send message unexpected error:", err);
      alert("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setChatSending(false);
    }
  };

  const handleRefreshChat = async () => {
    if (!group) return;
    try {
      const { data: msgList, error: msgErr } = await supabase
        .from("arisan_group_messages")
        .select("*")
        .eq("group_id", group.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!msgErr) setMessages(msgList || []);
    } catch (err) {
      console.error("refresh chat error:", err);
    }
  };

  // ================== RENDER ===================

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat grup arisan...</p>
        </div>
      </main>
    );
  }

  if (pageError || !group) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">{pageError}</p>
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

  const userHasJoined = !!membership;
  const memberCount = members.length;

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Arisan · Detail grup {group.group_code}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Kembali ke dashboard
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/arisan")}
            >
              Daftar grup arisan
            </button>
          </div>
        </header>

        {/* Info grup */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Grup arisan</p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            ID Grup: <strong>{group.group_code}</strong> · Iuran per putaran:{" "}
            <strong>{formatCurrency(group.per_round_amount)}</strong> · Total
            putaran: <strong>{group.total_rounds}</strong> · Mulai:{" "}
            <strong>{formatDate(group.start_date)}</strong>
          </p>
          {group.description && (
            <p className="nanad-dashboard-body" style={{ marginTop: "0.3rem" }}>
              {group.description}
            </p>
          )}
        </section>

        {/* Status keanggotaan */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Status kamu</h3>
              <p>
                Kamu{" "}
                {userHasJoined
                  ? `sudah bergabung sebagai ${membership.role}.`
                  : "belum terdaftar sebagai anggota grup ini."}
              </p>
            </div>

            {userHasJoined ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.6rem" }}
              >
                Peran kamu di grup ini:{" "}
                <strong>{membership.role || "MEMBER"}</strong>. Hanya anggota
                yang bisa ikut setor iuran dari Dompet Nadnad dan mengirim
                pesan di ruang chat.
              </p>
            ) : (
              <div style={{ marginTop: "0.75rem" }}>
                <p className="nanad-dashboard-body">
                  Kamu belum terdaftar sebagai anggota grup. Hanya anggota yang
                  dapat ikut iuran dan mengakses chat.
                </p>
                <button
                  type="button"
                  disabled={joinLoading}
                  onClick={handleJoinGroup}
                  className="nanad-dashboard-deposit-submit"
                  style={{ marginTop: "0.6rem" }}
                >
                  {joinLoading ? "Memproses..." : "Gabung grup arisan ini"}
                </button>
              </div>
            )}
          </div>

          {/* Anggota grup */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup</h3>
              <p>Semua anggota yang bergabung di grup arisan ini.</p>
            </div>

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.6rem" }}
              >
                Belum ada anggota terdaftar.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.6rem" }}
              >
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="nanad-dashboard-deposits-row"
                    style={{ gridTemplateColumns: "140px 1.8fr" }}
                  >
                    <div style={{ fontSize: "0.76rem" }}>
                      {m.role === "OWNER" ? "OWNER" : "MEMBER"}
                      <br />
                      <span style={{ color: "#9ca3af" }}>
                        Bergabung: {formatDate(m.joined_at)}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.86rem" }}>
                        {m.display_name || m.user_email || "Anggota"}
                      </div>
                      {m.user_email && (
                        <small style={{ color: "#9ca3af" }}>
                          Email: {m.user_email}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Jadwal putaran + aksi */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Jadwal putaran</h3>
            <p>
              Lihat status iuran dan pemenang untuk setiap putaran arisan.
              Iuran:{" "}
              <strong>{formatCurrency(group.per_round_amount)} / putaran</strong>
              .
            </p>
          </div>

          {rounds.length === 0 ? (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.6rem" }}
            >
              Belum ada jadwal putaran tercatat.
            </p>
          ) : (
            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.6rem" }}
            >
              {rounds.map((r) => {
                const userKey = `${r.id}-${user?.id}`;
                const userPaid = user && paymentMap.has(userKey);
                const totalRoundPaid = totalPaidPerRound[r.id] || 0;
                const winnerMember =
                  r.winner_user_id &&
                  members.find((m) => m.user_id === r.winner_user_id);

                return (
                  <div key={r.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Putaran ke-{r.round_number}
                      <br />
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        Jatuh tempo: {formatDate(r.due_date)}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.85rem" }}>
                        Total setoran tercatat:{" "}
                        <strong>{formatCurrency(totalRoundPaid)}</strong>
                      </div>
                      {winnerMember ? (
                        <p
                          className="nanad-dashboard-body"
                          style={{ marginTop: "0.2rem" }}
                        >
                          Pemenang:{" "}
                          <strong>
                            {winnerMember.display_name ||
                              winnerMember.user_email}
                          </strong>{" "}
                          · Kredit ke Dompet Nadnad:{" "}
                          <strong>
                            {formatCurrency(r.winner_credit_amount || 0)}
                          </strong>
                        </p>
                      ) : (
                        <p
                          className="nanad-dashboard-body"
                          style={{ marginTop: "0.2rem" }}
                        >
                          Belum ada pemenang ditetapkan.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        alignItems: "flex-end",
                      }}
                    >
                      {userHasJoined && !userPaid && (
                        <button
                          type="button"
                          disabled={payLoadingRoundId === r.id}
                          className="nanad-dashboard-deposit-submit"
                          onClick={() => handlePayFromWallet(r)}
                        >
                          {payLoadingRoundId === r.id
                            ? "Memproses..."
                            : "Setor dari Dompet Nadnad"}
                        </button>
                      )}

                      {userHasJoined && userPaid && (
                        <span
                          style={{
                            fontSize: "0.76rem",
                            color: "#22c55e",
                            fontWeight: 600,
                          }}
                        >
                          SUDAH SETOR
                        </span>
                      )}

                      {isOwner && (
                        <div style={{ marginTop: "0.2rem" }}>
                          <label
                            style={{
                              fontSize: "0.7rem",
                              color: "#9ca3af",
                              display: "block",
                              marginBottom: "0.2rem",
                            }}
                          >
                            Tetapkan pemenang
                          </label>
                          <select
                            defaultValue={r.winner_user_id || ""}
                            onChange={(e) =>
                              handleSetWinnerAndCredit(r, e.target.value)
                            }
                            disabled={winnerLoadingRoundId === r.id}
                            style={{
                              width: "100%",
                              borderRadius: 999,
                              border: "1px solid rgba(148,163,184,0.7)",
                              background:
                                "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                              color: "white",
                              fontSize: "0.75rem",
                              padding: "0.25rem 0.6rem",
                            }}
                          >
                            <option value="">
                              {r.winner_user_id
                                ? "Ubah pemenang..."
                                : "Pilih anggota..."}
                            </option>
                            {members.map((m) => (
                              <option key={m.id} value={m.user_id}>
                                {m.display_name || m.user_email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Chat grup arisan */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Chat grup arisan</h3>
            <p>
              Ruang obrolan sederhana untuk koordinasi setoran, jadwal, dan
              pengumuman.
            </p>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              maxHeight: "260px",
              overflowY: "auto",
              borderRadius: "1rem",
              padding: "0.6rem 0.8rem",
              border: "1px solid rgba(30,64,175,0.35)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.9))",
            }}
          >
            {messages.length === 0 ? (
              <p className="nanad-dashboard-body">
                Belum ada pesan di grup ini.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{ marginBottom: "0.4rem", fontSize: "0.78rem" }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {msg.sender_display_name || msg.sender_email || "Anggota"}
                  </span>{" "}
                  <span style={{ color: "#9ca3af", fontSize: "0.7rem" }}>
                    ·{" "}
                    {new Date(msg.created_at).toLocaleString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <div>{msg.content}</div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSendChat}
            style={{
              marginTop: "0.7rem",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder={
                userHasJoined
                  ? "Tulis pesan untuk anggota grup..."
                  : "Gabung grup dulu untuk mengirim pesan."
              }
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              disabled={!userHasJoined || chatSending}
              style={{
                flex: 1,
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.7)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                color: "white",
              }}
            />
            <button
              type="submit"
              disabled={!userHasJoined || chatSending}
              className="nanad-dashboard-deposit-submit"
            >
              {chatSending ? "Mengirim..." : "Kirim"}
            </button>
            <button
              type="button"
              onClick={handleRefreshChat}
              className="nanad-dashboard-logout"
            >
              Segarkan chat
            </button>
          </form>
        </section>

        {/* Footer */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Arisan module (beta).
          </span>
          <span>
            Fitur arisan di aplikasi ini bersifat pencatatan &amp; simulasi.
            Pengelolaan dana nyata tetap mengikuti kesepakatan dan regulasi di
            luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
