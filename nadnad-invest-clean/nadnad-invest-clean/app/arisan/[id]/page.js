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

// Format tanggal pendek
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArisanGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params?.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [group, setGroup] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [messages, setMessages] = useState([]);

  const [errorMsg, setErrorMsg] = useState("");

  // join state
  const [joining, setJoining] = useState(false);

  // chat state
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // setor putaran dari dompet
  const [contributingRoundId, setContributingRoundId] = useState(null);

  const isMember =
    !!user && memberships.some((m) => m.user_id === user.id);

  const myMembership = user
    ? memberships.find((m) => m.user_id === user.id)
    : null;

  const owner =
    memberships.find((m) => m.role === "OWNER") || null;

  // ======================= INIT LOAD ==========================
  useEffect(() => {
    if (!groupId) return;

    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) User login
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

        // 2) Data grup
        const { data: groupData, error: groupErr } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (groupErr) {
          console.error("load group error:", groupErr.message);
          setErrorMsg("Gagal memuat grup arisan.");
          setGroup(null);
          return;
        }
        if (!groupData) {
          setErrorMsg("Grup arisan tidak ditemukan.");
          setGroup(null);
          return;
        }
        setGroup(groupData);

        // 3) Memberships
        const { data: memberData, error: mErr } = await supabase
          .from("arisan_memberships")
          .select("*")
          .eq("group_id", groupId)
          .order("joined_at", { ascending: true });

        if (mErr) {
          console.error("load memberships error:", mErr.message);
          setMemberships([]);
        } else {
          setMemberships(memberData || []);
        }

        // 4) Rounds
        const { data: roundsData, error: rErr } = await supabase
          .from("arisan_rounds")
          .select("*")
          .eq("group_id", groupId)
          .order("round_number", { ascending: true });

        if (rErr) {
          console.error("load rounds error:", rErr.message);
          setRounds([]);
        } else {
          setRounds(roundsData || []);
        }

        // 5) Wallet user (kalau ada)
        const { data: walletData, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("load wallet error:", wErr.message);
        } else {
          setWallet(walletData || null);
        }

        // 6) Pembayaran iuran milik user ini
        const { data: payData, error: pErr } = await supabase
          .from("arisan_round_payments")
          .select("*")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (pErr) {
          console.error("load my payments error:", pErr.message);
          setMyPayments([]);
        } else {
          setMyPayments(payData || []);
        }

        // 7) Chat
        await loadMessages(groupId);
      } catch (err) {
        console.error("Unexpected arisan group error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat grup arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [groupId, router]);

  // ======================= LOAD CHAT ==========================

  const loadMessages = async (gid) => {
    const { data, error } = await supabase
      .from("arisan_group_messages")
      .select("*")
      .eq("group_id", gid)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("load messages error:", error.message);
      return;
    }
    setMessages(data || []);
  };

  // ======================= JOIN GROUP =========================

  const handleJoinGroup = async () => {
    if (!user || !group) return;
    if (isMember) return;

    if (!confirm("Gabung ke grup arisan ini?")) return;

    try {
      setJoining(true);

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email;

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
        alert(
          "Gagal bergabung ke grup arisan.\n" + error.message
        );
        return;
      }

      setMemberships((prev) => [...prev, inserted]);
      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("join group unexpected error:", err);
      alert("Terjadi kesalahan saat bergabung.");
    } finally {
      setJoining(false);
    }
  };

  // ======================= SETOR PUTARAN DARI DOMPET =========

  const handleContribute = async (round) => {
    if (!user || !group) return;

    if (!isMember) {
      alert("Hanya anggota grup yang bisa setor iuran.");
      return;
    }

    if (!wallet) {
      alert(
        "Dompet Nanad kamu belum tersedia. Buka halaman Wallet dulu agar dompet otomatis dibuat."
      );
      return;
    }

    const alreadyPaid = myPayments.some(
      (p) => p.round_id === round.id
    );
    if (alreadyPaid) {
      alert("Kamu sudah mencatat setoran untuk putaran ini.");
      return;
    }

    const amount = group.per_round_amount || 0;
    if (!amount || amount <= 0) {
      alert("Nominal iuran per putaran belum diatur.");
      return;
    }

    if (wallet.balance < amount) {
      alert(
        `Saldo dompet kamu ${formatCurrency(
          wallet.balance
        )}. Tidak cukup untuk setoran Rp ${formatCurrency(
          amount
        )}.`
      );
      return;
    }

    if (
      !confirm(
        `Catat setoran arisan putaran ke-${round.round_number} sebesar ${formatCurrency(
          amount
        )} dari dompet Nanad kamu?`
      )
    ) {
      return;
    }

    try {
      setContributingRoundId(round.id);

      // refresh saldo wallet di server
      const { data: freshWallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", wallet.id)
        .maybeSingle();

      if (wErr || !freshWallet) {
        console.error("refresh wallet error:", wErr?.message);
        alert("Gagal membaca saldo dompet dari server.");
        return;
      }

      if (freshWallet.balance < amount) {
        alert(
          `Saldo dompet terbaru ${formatCurrency(
            freshWallet.balance
          )} tidak mencukupi.`
        );
        return;
      }

      const before = freshWallet.balance;
      const after = before - amount;

      // 1) catat pembayaran iuran arisan
      const { data: payment, error: payErr } = await supabase
        .from("arisan_round_payments")
        .insert({
          group_id: group.id,
          round_id: round.id,
          user_id: user.id,
          wallet_id: freshWallet.id,
          amount,
        })
        .select("*")
        .single();

      if (payErr) {
        console.error("insert round payment error:", payErr.message);
        alert(
          "Gagal mencatat setoran arisan.\n" + payErr.message
        );
        return;
      }

      // 2) catat transaksi di wallet
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: freshWallet.id,
          type: "ARISAN_CONTRIB",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Setoran arisan grup ${group.group_code} putaran ke-${round.round_number}`,
          user_email: user.email || null,
        });

      if (txErr) {
        console.error("wallet tx error:", txErr.message);
        alert(
          "Setoran tercatat di arisan, tapi gagal mencatat transaksi dompet.\n" +
            txErr.message
        );
        // lanjut update saldo supaya konsisten
      }

      // 3) update saldo dompet
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", freshWallet.id);

      if (updErr) {
        console.error("update wallet error:", updErr.message);
        alert(
          "Setoran tercatat, tapi gagal memperbarui saldo dompet.\n" +
            updErr.message
        );
      }

      // update state lokal
      setWallet({ ...freshWallet, balance: after });
      setMyPayments((prev) => [...prev, payment]);

      alert("Setoran arisan berhasil dicatat dari dompet.");
    } catch (err) {
      console.error("contribute error:", err);
      alert("Terjadi kesalahan saat mencatat setoran arisan.");
    } finally {
      setContributingRoundId(null);
    }
  };

  // ======================= KIRIM CHAT =========================

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user || !group || !newMessage.trim()) return;

    if (!isMember) {
      alert("Hanya anggota grup yang dapat mengirim pesan.");
      return;
    }

    try {
      setSending(true);

      const display =
        myMembership?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email;

      const { error } = await supabase
        .from("arisan_group_messages")
        .insert({
          group_id: group.id,
          sender_user_id: user.id,
          sender_email: user.email,
          sender_display_name: display,
          content: newMessage.trim(),
        });

      if (error) {
        console.error("send message error:", error.message);
        alert(
          "Gagal mengirim pesan.\n" + error.message
        );
        return;
      }

      setNewMessage("");
      await loadMessages(group.id);
    } catch (err) {
      console.error("send message unexpected error:", err);
      alert("Terjadi kesalahan saat mengirim pesan.");
    } finally {
      setSending(false);
    }
  };

  // ======================= RENDER KHUSUS ======================

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat detail grup arisan...
          </p>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">ARISAN ERROR</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">
              {errorMsg || "Grup arisan tidak ditemukan."}
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

  // ======================= RENDER NORMAL ======================

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">
                Nanad Invest · Arisan
              </p>
              <p className="nanad-dashboard-brand-sub">
                Grup arisan &amp; ruang koordinasi
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
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* Info grup */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Grup arisan</p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            ID Grup: <strong>{group.group_code}</strong> · Iuran per
            putaran:{" "}
            <strong>
              {formatCurrency(group.per_round_amount)}
            </strong>{" "}
            · Total putaran:{" "}
            <strong>{group.total_rounds}</strong>
            <br />
            Mulai:{" "}
            <strong>
              {group.start_date
                ? formatDate(group.start_date)
                : "Belum diatur"}
            </strong>
          </p>

          {!isMember && (
            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.75rem 1rem",
                borderRadius: "1rem",
                border: "1px solid rgba(248, 250, 252, 0.2)",
                background:
                  "radial-gradient(circle at top, rgba(248, 250, 252, 0.04), rgba(15,23,42,1))",
                fontSize: "0.8rem",
              }}
            >
              <p style={{ margin: 0 }}>
                Kamu belum terdaftar sebagai anggota grup ini.{" "}
                <strong>
                  Hanya anggota yang dapat ikut iuran dan mengirim pesan di
                  ruang chat.
                </strong>
              </p>
              <button
                type="button"
                disabled={joining}
                className="nanad-dashboard-deposit-submit"
                style={{ marginTop: "0.6rem" }}
                onClick={handleJoinGroup}
              >
                {joining ? "Memproses..." : "Gabung grup arisan ini"}
              </button>
            </div>
          )}
        </section>

        {/* Anggota & catatan */}
        <section className="nanad-dashboard-table-section">
          {/* Anggota */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup</h3>
              <p>Semua anggota yang tergabung dalam grup arisan ini.</p>
            </div>

            {memberships.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota terdaftar.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {memberships.map((m) => (
                  <div
                    key={m.id}
                    className="nanad-dashboard-deposits-row"
                    style={{ gridTemplateColumns: "160px 1fr" }}
                  >
                    <div>
                      <strong>
                        {m.display_name || m.user_email || "Anggota"}
                      </strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            m.role === "OWNER"
                              ? "#facc15"
                              : "#9ca3af",
                        }}
                      >
                        {m.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <div>
                      <small>
                        Email: {m.user_email || "-"}
                        <br />
                        Bergabung:{" "}
                        {m.joined_at
                          ? new Date(
                              m.joined_at
                            ).toLocaleString("id-ID")
                          : "-"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catatan grup */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catatan grup</h3>
              <p>
                Ringkasan singkat aturan arisan ini. Sesuaikan sesuai
                kesepakatan offline antar anggota.
              </p>
            </div>
            <ul
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem", paddingLeft: "1.1rem" }}
            >
              <li>
                Iuran wajib per putaran:{" "}
                <strong>
                  {formatCurrency(group.per_round_amount)}
                </strong>
                .
              </li>
              <li>
                Total putaran:{" "}
                <strong>{group.total_rounds}</strong>. Urutan pemenang bisa
                disepakati bersama.
              </li>
              <li>
                Semua transfer dana nyata tetap dilakukan via rekening /
                e-wallet masing-masing, lalu dicatat di sistem.
              </li>
              {owner && (
                <li>
                  Penanggung jawab utama (owner):{" "}
                  <strong>
                    {owner.display_name || owner.user_email}
                  </strong>
                  .
                </li>
              )}
              {wallet && (
                <li>
                  Saldo dompet Nanad kamu saat ini:{" "}
                  <strong>{formatCurrency(wallet.balance)}</strong>.
                </li>
              )}
            </ul>
          </div>
        </section>

        {/* Jadwal putaran & iuran */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran &amp; setoran iuran</h3>
              <p>
                Lihat jadwal putaran arisan dan catat setoran iuran langsung
                dari dompet Nanad kamu.
              </p>
            </div>

            {rounds.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada jadwal putaran yang diatur untuk grup ini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((round) => {
                  const paid = myPayments.some(
                    (p) => p.round_id === round.id
                  );

                  return (
                    <div
                      key={round.id}
                      className="nanad-dashboard-deposits-row"
                      style={{
                        gridTemplateColumns:
                          "140px minmax(0,1.5fr) 160px",
                      }}
                    >
                      <div>
                        Putaran ke-{round.round_number}
                        <br />
                        <small>
                          Jatuh tempo:{" "}
                          {round.due_date
                            ? formatDate(round.due_date)
                            : "-"}
                        </small>
                      </div>
                      <div>
                        Iuran:{" "}
                        <strong>
                          {formatCurrency(group.per_round_amount)}
                        </strong>
                        <br />
                        {round.winner_user_id ? (
                          <small>
                            Pemenang sudah ditetapkan (lihat catatan
                            admin).
                          </small>
                        ) : (
                          <small>
                            Pemenang putaran ini belum ditandai.
                          </small>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                          alignItems: "flex-end",
                          justifyContent: "center",
                        }}
                      >
                        {paid ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#4ade80",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            SUDAH SETOR
                          </span>
                        ) : (
                          <>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "#facc15",
                              }}
                            >
                              Belum ada setoran kamu.
                            </span>
                            <button
                              type="button"
                              disabled={
                                !isMember ||
                                contributingRoundId === round.id
                              }
                              className="nanad-dashboard-deposit-submit"
                              onClick={() =>
                                handleContribute(round)
                              }
                            >
                              {contributingRoundId === round.id
                                ? "Memproses..."
                                : "Setor dari dompet"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat grup arisan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Chat grup arisan</h3>
              <p>
                Ruang obrolan sederhana untuk koordinasi iuran, jadwal,
                dan pengumuman. Hanya anggota yang dapat mengirim pesan.
              </p>
            </div>

            <div
              style={{
                marginTop: "0.75rem",
                borderRadius: "1rem",
                padding: "0.6rem 0.75rem",
                maxHeight: "320px",
                overflowY: "auto",
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  "linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.98))",
              }}
            >
              {messages.length === 0 ? (
                <p
                  className="nanad-dashboard-body"
                  style={{ fontSize: "0.8rem" }}
                >
                  Belum ada pesan di grup ini.
                </p>
              ) : (
                messages.map((msg) => {
                  const mine =
                    user && msg.sender_user_id === user.id;
                  const timeStr = new Date(
                    msg.created_at
                  ).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: mine
                          ? "flex-end"
                          : "flex-start",
                        marginBottom: "0.4rem",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "0.4rem 0.65rem",
                          borderRadius: mine
                            ? "1rem 0.25rem 1rem 1rem"
                            : "0.25rem 1rem 1rem 1rem",
                          background: mine
                            ? "linear-gradient(135deg,#facc15,#eab308)"
                            : "rgba(15,23,42,0.95)",
                          color: mine ? "#020617" : "#e5e7eb",
                          fontSize: "0.8rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.9,
                            marginBottom: "0.15rem",
                          }}
                        >
                          {msg.sender_display_name ||
                            msg.sender_email ||
                            "Anggota"}
                          {" · "}
                          <span style={{ opacity: 0.8 }}>
                            {timeStr}
                          </span>
                        </div>
                        <div>{msg.content}</div>
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
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder={
                  isMember
                    ? "Tulis pesan untuk grup…"
                    : "Gabung grup untuk bisa mengirim pesan…"
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!isMember || sending}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.7)",
                  background:
                    "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  color: "#f9fafb",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!isMember || sending || !newMessage.trim()}
                className="nanad-dashboard-deposit-submit"
                style={{ paddingInline: "1rem" }}
              >
                {sending ? "Mengirim..." : "Kirim"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => loadMessages(group.id)}
              className="nanad-dashboard-logout"
              style={{ marginTop: "0.5rem", fontSize: "0.7rem" }}
            >
              Segarkan chat
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module
            (beta).
          </span>
          <span>
            Fitur arisan di aplikasi ini bersifat pencatatan &amp;
            simulasi. Pengelolaan dana nyata tetap mengikuti kesepakatan
            dan regulasi yang berlaku di luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
