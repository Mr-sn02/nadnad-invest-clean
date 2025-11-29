// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArisanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [myMembership, setMyMembership] = useState(null);
  const [members, setMembers] = useState([]);

  const [wallet, setWallet] = useState(null);
  const [rounds, setRounds] = useState([]); // jadwal putaran

  // state arisan
  const [processingRound, setProcessingRound] = useState(null);
  const [savingRecipient, setSavingRecipient] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [joining, setJoining] = useState(false);

  const isOwner = myMembership?.role === "OWNER";

  // state chat
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // ====== INIT / LOAD UTAMA ======
  useEffect(() => {
    if (!rawId) return;

    const loadAll = async () => {
      setLoading(true);
      setErrorMsg("");
      setNotFound(false);

      try {
        // 1) User
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

        const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
        const isCode = /^\d{5}$/.test(idStr);

        // 2) Grup (by group_code 5 digit atau id)
        let groupQuery = supabase.from("arisan_groups").select("*");
        if (isCode) {
          groupQuery = groupQuery.eq("group_code", idStr);
        } else {
          groupQuery = groupQuery.eq("id", idStr);
        }

        const { data: g, error: gErr } = await groupQuery.maybeSingle();

        if (gErr) {
          console.error("Load group error:", gErr.message);
          setErrorMsg("Gagal memuat grup arisan.");
          return;
        }
        if (!g) {
          setNotFound(true);
          return;
        }
        setGroup(g);

        // 3) Members & membership saya
        const { data: membersData, error: membersErr } = await supabase
          .from("arisan_memberships")
          .select(
            "id, role, user_id, user_email, display_name, created_at"
          )
          .eq("group_id", g.id)
          .order("created_at", { ascending: true });

        if (membersErr) {
          console.error("Load members error:", membersErr.message);
        }
        const membersList = membersData || [];
        setMembers(membersList);

        const mine = membersList.find((m) => m.user_id === user.id) || null;
        setMyMembership(mine || null);

        // 4) Wallet user
        let currentWallet = null;
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Load wallet error:", wErr.message);
        }
        if (w) {
          currentWallet = w;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("wallets")
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0,
              currency: "IDR",
            })
            .select("*")
            .single();

          if (cErr) {
            console.error("Create wallet error:", cErr.message);
          } else {
            currentWallet = created;
          }
        }
        setWallet(currentWallet);

        // 5) Putaran & pembayaran
        await loadRoundsAndPayments(g.id, g, membersList, currentWallet);

        // 6) Chat grup
        await loadMessages(g.id);
      } catch (err) {
        console.error("Arisan detail error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat grup arisan.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [rawId, router]);

  // ====== POLLING CHAT RINGAN (tiap 8 detik) ======
  useEffect(() => {
    if (!group) return;
    const interval = setInterval(() => {
      loadMessages(group.id);
    }, 8000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  // ====== LOAD ROUNDS + PAYMENTS ======
  const loadRoundsAndPayments = async (groupId, g, membersList, currentWallet) => {
    try {
      // cek existing rounds
      let { data: roundsData, error: rErr } = await supabase
        .from("arisan_rounds")
        .select(
          `
          id,
          group_id,
          round_number,
          scheduled_date,
          recipient_membership_id,
          status,
          note,
          created_at
        `
        )
        .eq("group_id", groupId)
        .order("round_number", { ascending: true });

      if (rErr) {
        console.error("Load rounds error:", rErr.message);
        return;
      }

      // jika belum ada rounds -> buat berdasarkan total_rounds
      if ((!roundsData || roundsData.length === 0) && g.total_rounds > 0) {
        const start = g.start_date ? new Date(g.start_date) : null;
        const toInsert = [];

        for (let i = 1; i <= g.total_rounds; i++) {
          let sched = null;
          if (start) {
            const d = new Date(start);
            d.setMonth(d.getMonth() + (i - 1)); // asumsi bulanan
            sched = d.toISOString().slice(0, 10);
          }

          toInsert.push({
            group_id: groupId,
            round_number: i,
            scheduled_date: sched,
          });
        }

        const { data: newRounds, error: createErr } = await supabase
          .from("arisan_rounds")
          .insert(toInsert)
          .select("*");

        if (createErr) {
          console.error("Create rounds error:", createErr.message);
        } else {
          roundsData = newRounds;
        }
      }

      // ambil payments
      const roundIds = (roundsData || []).map((r) => r.id);
      let paymentsData = [];

      if (roundIds.length > 0) {
        const { data: pData, error: pErr } = await supabase
          .from("arisan_round_payments")
          .select(
            `
            id,
            round_id,
            membership_id,
            status,
            paid_at,
            note
          `
          )
          .in("round_id", roundIds);

        if (pErr) {
          console.error("Load payments error:", pErr.message);
        } else {
          paymentsData = pData || [];
        }
      }

      // bentuk view
      const roundsView = (roundsData || []).map((r) => {
        const roundPayments = paymentsData.filter((p) => p.round_id === r.id);

        const recipient =
          membersList.find((m) => m.id === r.recipient_membership_id) || null;

        return {
          id: r.id,
          number: r.round_number,
          scheduledDate: r.scheduled_date,
          status: r.status,
          note: r.note,
          recipient,
          payments: roundPayments.map((p) => ({
            ...p,
            member: membersList.find((m) => m.id === p.membership_id) || null,
          })),
        };
      });

      setRounds(roundsView);
    } catch (err) {
      console.error("loadRoundsAndPayments error:", err);
    }
  };

  // ====== LOAD CHAT MESSAGES ======
  const loadMessages = async (groupId) => {
    if (!groupId) return;
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("arisan_group_messages")
        .select(
          "id, group_id, user_id, user_email, message, created_at"
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) {
        console.error("Load messages error:", error.message);
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error("loadMessages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ====== JOIN GROUP ======
  const handleJoinGroup = async () => {
    if (!group || !user) return;
    if (myMembership) {
      alert("Kamu sudah terdaftar di grup ini.");
      return;
    }

    try {
      setJoining(true);

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split("@")[0] : "Member");

      const { data: inserted, error } = await supabase
        .from("arisan_memberships")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "MEMBER",
          user_email: user.email,
          display_name: displayName,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Join group error:", error.message);
        alert("Gagal bergabung ke grup arisan.");
        return;
      }

      setMyMembership(inserted);
      const newMembers = [...members, inserted];
      setMembers(newMembers);

      // reload putaran biar slot pembayaran masuk
      await loadRoundsAndPayments(group.id, group, newMembers, wallet);

      alert("Berhasil bergabung sebagai peserta arisan.");
    } catch (err) {
      console.error("Join group error:", err);
      alert("Terjadi kesalahan saat bergabung ke grup arisan.");
    } finally {
      setJoining(false);
    }
  };

  // ====== SETOR IURAN DARI WALLET ======
  const handlePayRound = async (round) => {
    if (!group || !wallet || !user) return;
    if (!myMembership) {
      alert("Kamu harus bergabung sebagai anggota arisan terlebih dahulu.");
      return;
    }

    const amount = group.monthly_amount || 0;
    const currentBalance = wallet.balance || 0;

    if (!amount || amount <= 0) {
      alert("Nominal iuran arisan tidak valid.");
      return;
    }
    if (currentBalance < amount) {
      alert(
        `Saldo dompet belum cukup. Saldo ${formatCurrency(
          currentBalance
        )}, iuran ${formatCurrency(amount)}.`
      );
      return;
    }

    // cek sudah lunas atau belum untuk user & putaran ini
    const existingPayment = round.payments.find(
      (p) => p.membership_id === myMembership.id && p.status === "PAID"
    );
    if (existingPayment) {
      alert("Iuran putaran ini sudah tercatat lunas.");
      return;
    }

    try {
      setProcessingRound(round.id);

      const before = currentBalance;
      const after = before - amount;

      // 1) transaksi wallet
      const { data: tx, error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "WITHDRAW",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `ARISAN:${group.id}:${round.number}`,
          user_email: user.email || null,
        })
        .select("id")
        .single();

      if (txErr) {
        console.error("Insert wallet tx error:", txErr.message);
        alert("Gagal mencatat transaksi dompet.");
        return;
      }

      // 2) update saldo
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
        alert(
          "Transaksi tercatat, tapi gagal memperbarui saldo dompet. Hubungi admin."
        );
      }

      // 3) payment
      const { data: existing, error: getPayErr } = await supabase
        .from("arisan_round_payments")
        .select("*")
        .eq("round_id", round.id)
        .eq("membership_id", myMembership.id)
        .maybeSingle();

      if (getPayErr) {
        console.error("Get payment error:", getPayErr.message);
      }

      if (existing) {
        const { error: updErr } = await supabase
          .from("arisan_round_payments")
          .update({
            status: "PAID",
            paid_at: new Date().toISOString(),
            wallet_tx_id: tx.id,
            note: "Setor iuran via wallet.",
          })
          .eq("id", existing.id);

        if (updErr) {
          console.error("Update payment error:", updErr.message);
        }
      } else {
        const { error: insErr } = await supabase
          .from("arisan_round_payments")
          .insert({
            round_id: round.id,
            membership_id: myMembership.id,
            status: "PAID",
            paid_at: new Date().toISOString(),
            wallet_tx_id: tx.id,
            note: "Setor iuran via wallet.",
          });

        if (insErr) {
          console.error("Insert payment error:", insErr.message);
        }
      }

      // update state lokal
      setWallet((prev) => (prev ? { ...prev, balance: after } : prev));
      await loadRoundsAndPayments(group.id, group, members, {
        ...wallet,
        balance: after,
      });

      alert(
        `Setoran iuran putaran ke-${round.number} berhasil dicatat dari saldo wallet.`
      );
    } catch (err) {
      console.error("Pay round error:", err);
      alert("Terjadi kesalahan saat menyetor iuran arisan.");
    } finally {
      setProcessingRound(null);
    }
  };

  // ====== OWNER: UBAH PENERIMA PUTARAN ======
  const handleChangeRecipient = async (roundId, membershipId) => {
    if (!isOwner || !group) return;
    try {
      setSavingRecipient(roundId);
      const { error } = await supabase
        .from("arisan_rounds")
        .update({ recipient_membership_id: membershipId || null })
        .eq("id", roundId);

      if (error) {
        console.error("Update recipient error:", error.message);
        alert("Gagal mengubah penerima putaran.");
        return;
      }

      await loadRoundsAndPayments(group.id, group, members, wallet);
    } catch (err) {
      console.error("Change recipient error:", err);
      alert("Terjadi kesalahan saat mengubah penerima putaran.");
    } finally {
      setSavingRecipient(null);
    }
  };

  // ====== OWNER: TANDAI PUTARAN SUDAH CAIR ======
  const handleMarkReceived = async (roundId) => {
    if (!isOwner || !group) return;
    try {
      const { error } = await supabase
        .from("arisan_rounds")
        .update({ status: "RECEIVED" })
        .eq("id", roundId);

      if (error) {
        console.error("Mark received error:", error.message);
        alert("Gagal menandai putaran sebagai sudah cair.");
        return;
      }

      await loadRoundsAndPayments(group.id, group, members, wallet);
    } catch (err) {
      console.error("Mark received error:", err);
      alert("Terjadi kesalahan saat menandai putaran.");
    }
  };

  // ====== OWNER: ARSIPKAN GRUP ======
  const handleArchiveGroup = async () => {
    if (!isOwner || !group) return;
    if (
      !window.confirm(
        "Arsipkan grup ini? Grup tetap bisa dilihat, tapi tidak aktif."
      )
    ) {
      return;
    }

    try {
      setArchiving(true);
      const { error } = await supabase
        .from("arisan_groups")
        .update({ is_archived: true })
        .eq("id", group.id);

      if (error) {
        console.error("Archive group error:", error.message);
        alert("Gagal mengarsipkan grup.");
        return;
      }

      setGroup((prev) => (prev ? { ...prev, is_archived: true } : prev));
      alert("Grup berhasil diarsipkan.");
    } catch (err) {
      console.error("Archive group error:", err);
      alert("Terjadi kesalahan saat mengarsipkan grup.");
    } finally {
      setArchiving(false);
    }
  };

  // ====== KIRIM CHAT ======
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!group || !user) return;
    if (!myMembership) {
      alert("Gabung dulu ke grup arisan untuk bisa mengirim pesan.");
      return;
    }
    const text = newMessage.trim();
    if (!text) return;
    if (group.is_archived) {
      alert("Grup sudah diarsipkan. Chat baru dinonaktifkan.");
      return;
    }

    try {
      setSendingMessage(true);
      const { data, error } = await supabase
        .from("arisan_group_messages")
        .insert({
          group_id: group.id,
          user_id: user.id,
          user_email: user.email,
          message: text,
        })
        .select(
          "id, group_id, user_id, user_email, message, created_at"
        )
        .single();

      if (error) {
        console.error("Send message error:", error.message);
        alert("Gagal mengirim pesan.");
        return;
      }

      setNewMessage("");
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error("Send message error:", err);
      alert("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setSendingMessage(false);
    }
  };

  // ====== RENDER ======

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat detail arisan...</p>
        </div>
      </main>
    );
  }

  if (notFound || !group) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">
              Grup arisan tidak ditemukan. Pastikan menggunakan ID grup yang
              benar atau minta ulang dari pemilik grup.
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              style={{ marginTop: "0.9rem" }}
              onClick={() => router.push("/arisan")}
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
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Detail grup arisan · ID {group.group_code}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {isOwner && !group.is_archived && (
              <button
                type="button"
                className="nanad-dashboard-logout"
                disabled={archiving}
                onClick={handleArchiveGroup}
              >
                {archiving ? "Mengarsipkan..." : "Arsipkan grup"}
              </button>
            )}
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/arisan")}
            >
              Kembali ke daftar arisan
            </button>
          </div>
        </header>

        {/* INFO GRUP */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">
            Grup arisan {group.is_archived ? "· Diarsipkan" : ""}
          </p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            ID Grup: <strong>{group.group_code}</strong> · Iuran per putaran{" "}
            <strong>{formatCurrency(group.monthly_amount)}</strong> · Total
            putaran <strong>{group.total_rounds}</strong>
            {group.start_date && (
              <>
                {" "}
                · Mulai <strong>{formatDate(group.start_date)}</strong>
              </>
            )}
          </p>

          <p className="nanad-dashboard-body" style={{ marginTop: "0.3rem" }}>
            Posisi kamu di grup ini:{" "}
            <strong>
              {myMembership
                ? myMembership.role === "OWNER"
                  ? "Owner"
                  : "Member"
                : "belum terdaftar (viewer)"}
            </strong>
            .
          </p>

          {!myMembership && !group.is_archived && (
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              style={{ marginTop: "0.7rem" }}
              onClick={handleJoinGroup}
              disabled={joining}
            >
              {joining ? "Memproses..." : "Gabung sebagai peserta arisan"}
            </button>
          )}

          {/* Aturan grup */}
          {group.rules_note && (
            <div
              style={{
                marginTop: "1rem",
                borderRadius: "1.3rem",
                padding: "0.9rem 1rem",
                border: "1px solid rgba(148,163,184,0.6)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                fontSize: "0.8rem",
                color: "#e5e7eb",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#facc15",
                }}
              >
                Aturan & perjanjian grup
              </p>
              <p style={{ marginTop: "0.4rem", whiteSpace: "pre-wrap" }}>
                {group.rules_note}
              </p>
            </div>
          )}

          {/* Ringkasan wallet */}
          <div className="nanad-dashboard-stat-grid" style={{ marginTop: "1rem" }}>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet kamu</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Wallet belum aktif"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem" }}
              >
                Setoran iuran arisan bisa langsung mengurangi saldo dompet Nanad
                Invest kamu dan tercatat sebagai transaksi{" "}
                <strong>WITHDRAW</strong>.
              </p>
            </div>
          </div>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.4rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* JADWAL & ANGGOTA + CHAT */}
        <section className="nanad-dashboard-table-section">
          {/* KIRI: Putaran & iuran */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran &amp; setoran iuran</h3>
              <p>
                Lihat jadwal putaran, penerima, serta status iuran setiap
                anggota. Kamu bisa mencatat setoran iuran langsung dari saldo
                wallet.
              </p>
            </div>

            {rounds.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada data putaran.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((r) => {
                  const myPay =
                    myMembership &&
                    r.payments.find(
                      (p) =>
                        p.membership_id === myMembership.id &&
                        p.status === "PAID"
                    );

                  return (
                    <div key={r.id} className="nanad-dashboard-deposits-row">
                      <div>
                        Putaran ke-{r.number}
                        <br />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          Jadwal:{" "}
                          {r.scheduledDate
                            ? formatDate(r.scheduledDate)
                            : "-"}
                        </span>
                        <br />
                        <span
                          style={{
                            fontSize: "0.74rem",
                            color:
                              r.status === "RECEIVED"
                                ? "#4ade80"
                                : "#facc15",
                          }}
                        >
                          Status putaran:{" "}
                          {r.status === "RECEIVED"
                            ? "Sudah cair"
                            : "Direncanakan"}
                        </span>
                      </div>

                      <div>
                        {/* Penerima */}
                        <div>
                          Penerima:
                          <br />
                          {isOwner && !group.is_archived ? (
                            <select
                              value={r.recipient?.id || ""}
                              onChange={(e) =>
                                handleChangeRecipient(
                                  r.id,
                                  e.target.value || null
                                )
                              }
                              disabled={savingRecipient === r.id}
                              style={{
                                marginTop: "0.25rem",
                                width: "100%",
                                borderRadius: "999px",
                                border:
                                  "1px solid rgba(148,163,184,0.65)",
                                background:
                                  "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                                padding: "0.3rem 0.7rem",
                                fontSize: "0.76rem",
                                color: "#e5e7eb",
                              }}
                            >
                              <option value="">
                                (Belum ditentukan)
                              </option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.display_name ||
                                    m.user_email ||
                                    "Tanpa nama"}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p
                              style={{
                                margin: "0.25rem 0 0",
                                fontSize: "0.8rem",
                              }}
                            >
                              {r.recipient
                                ? r.recipient.display_name ||
                                  r.recipient.user_email
                                : "Belum ditentukan"}
                            </p>
                          )}
                        </div>

                        {/* Status iuran anggota */}
                        <div
                          style={{
                            marginTop: "0.45rem",
                            fontSize: "0.76rem",
                            color: "#9ca3af",
                          }}
                        >
                          Status iuran anggota:
                          <ul
                            style={{
                              margin: "0.3rem 0 0",
                              paddingLeft: "1.1rem",
                            }}
                          >
                            {members.map((m) => {
                              const pay = r.payments.find(
                                (p) => p.membership_id === m.id
                              );
                              const label = pay
                                ? pay.status === "PAID"
                                  ? "Lunas"
                                  : pay.status === "LATE"
                                  ? "Telat"
                                  : "Belum"
                                : "Belum";
                              const color = pay
                                ? pay.status === "PAID"
                                  ? "#4ade80"
                                  : pay.status === "LATE"
                                  ? "#fb923c"
                                  : "#facc15"
                                : "#facc15";
                              return (
                                <li key={m.id}>
                                  {m.display_name ||
                                    m.user_email ||
                                    "Tanpa nama"}{" "}
                                  ·{" "}
                                  <span style={{ color }}>
                                    {label}
                                  </span>
                                  {pay?.paid_at && (
                                    <>
                                      {" "}
                                      (
                                      {new Date(
                                        pay.paid_at
                                      ).toLocaleDateString("id-ID")}
                                      )
                                    </>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>

                      <div style={{ justifyContent: "flex-end" }}>
                        {group.is_archived ? (
                          <span>{formatCurrency(group.monthly_amount)}</span>
                        ) : myMembership ? (
                          myPay ? (
                            <span>{formatCurrency(group.monthly_amount)}</span>
                          ) : (
                            <button
                              type="button"
                              className="nanad-dashboard-deposit-submit"
                              disabled={processingRound === r.id}
                              onClick={() => handlePayRound(r)}
                            >
                              {processingRound === r.id
                                ? "Memproses..."
                                : "Setor dari wallet"}
                            </button>
                          )
                        ) : (
                          <span
                            style={{
                              fontSize: "0.74rem",
                              color: "#fecaca",
                              textAlign: "right",
                            }}
                          >
                            Gabung sebagai member untuk menyetor iuran.
                          </span>
                        )}

                        {isOwner && !group.is_archived && (
                          <button
                            type="button"
                            className="nanad-dashboard-logout"
                            style={{ marginTop: "0.4rem" }}
                            onClick={() => handleMarkReceived(r.id)}
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

          {/* KANAN: anggota + chat grup */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup &amp; chat arisan</h3>
              <p>
                Daftar semua peserta arisan dan ruang chat sederhana untuk
                koordinasi jadwal dan informasi.
              </p>
            </div>

            {/* Daftar anggota */}
            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota terdaftar. Jika kamu pemilik grup, kamu bisa
                membagikan ID Grup {group.group_code} ke peserta lain.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {members.map((m) => (
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>
                      {m.display_name || m.user_email || "Tanpa nama"}
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                        }}
                      >
                        {m.user_email}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.76rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            m.role === "OWNER" ? "#facc15" : "#e5e7eb",
                        }}
                      >
                        {m.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <div />
                  </div>
                ))}
              </div>
            )}

            {/* Link undangan */}
            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.78rem" }}
            >
              <strong>Link undangan cepat:</strong>
              <br />
              <code
                style={{
                  fontSize: "0.78rem",
                  background: "rgba(15,23,42,0.9)",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(148,163,184,0.5)",
                  display: "inline-block",
                  marginTop: "0.2rem",
                }}
              >
                {typeof window !== "undefined"
                  ? `${window.location.origin}/arisan/${group.group_code}`
                  : `/arisan/${group.group_code}`}
              </code>
              <br />
              Peserta cukup membuka link tersebut, lalu klik{" "}
              <em>“Gabung sebagai peserta arisan”</em>.
            </div>

            {/* CHAT GRUP */}
            <hr
              style={{
                margin: "1rem 0 0.8rem",
                borderColor: "rgba(148,163,184,0.35)",
              }}
            />

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "#9ca3af",
                }}
              >
                <strong>Chat grup arisan</strong> – untuk koordinasi ringan,
                bukan pengganti bukti transaksi resmi.
              </p>

              <div
                style={{
                  marginTop: "0.6rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(30,64,175,0.4)",
                  background:
                    "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.94))",
                  padding: "0.6rem 0.7rem",
                  maxHeight: "260px",
                  overflowY: "auto",
                  fontSize: "0.78rem",
                }}
              >
                {loadingMessages && messages.length === 0 ? (
                  <p className="nanad-dashboard-body">
                    Memuat pesan chat...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="nanad-dashboard-body">
                    Belum ada pesan. Mulai obrolan pertama untuk menyapa
                    anggota grup.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const member =
                      members.find((m) => m.user_id === msg.user_id) || null;
                    const name =
                      member?.display_name ||
                      member?.user_email ||
                      msg.user_email ||
                      "Anggota";

                    const isMe = user && msg.user_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          marginBottom: "0.35rem",
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-block",
                            maxWidth: "90%",
                            padding: "0.35rem 0.55rem",
                            borderRadius: "0.8rem",
                            background: isMe
                              ? "linear-gradient(135deg,#f5d17a,#d4a63f)"
                              : "rgba(15,23,42,0.9)",
                            color: isMe ? "#020617" : "#e5e7eb",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.7rem",
                              opacity: 0.9,
                              marginBottom: "0.15rem",
                            }}
                          >
                            {name}
                          </div>
                          <div>{msg.message}</div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.65rem",
                            color: "#9ca3af",
                            marginTop: "0.1rem",
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Form kirim chat */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  marginTop: "0.6rem",
                  display: "flex",
                  gap: "0.45rem",
                }}
              >
                <input
                  type="text"
                  placeholder={
                    group.is_archived
                      ? "Grup diarsipkan, chat dinonaktifkan."
                      : myMembership
                      ? "Ketik pesan untuk grup..."
                      : "Gabung dulu ke grup untuk mengirim pesan."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={
                    sendingMessage || group.is_archived || !myMembership
                  }
                  style={{
                    flex: 1,
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.7)",
                    background:
                      "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                    padding: "0.45rem 0.8rem",
                    fontSize: "0.78rem",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  className="nanad-dashboard-deposit-submit"
                  disabled={
                    sendingMessage ||
                    !newMessage.trim() ||
                    group.is_archived ||
                    !myMembership
                  }
                >
                  {sendingMessage ? "Kirim..." : "Kirim"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan &amp; chat ini bersifat pencatatan dan komunikasi
            ringan. Pengelolaan dana nyata tetap mengikuti kesepakatan dan
            regulasi di luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
