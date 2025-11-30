// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const [messages, setMessages] = useState([]);

  const [errorMsg, setErrorMsg] = useState("");

  // chat form
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // join form (kalau user belum jadi member di grup)
  const [joining, setJoining] = useState(false);

  const isMember =
    user &&
    memberships.some((m) => m.user_id === user.id);

  // ---- Load user + data grup ----
  useEffect(() => {
    if (!groupId) return;

    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) pastikan user login
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

        // 2) ambil data grup
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

        // 3) ambil membership
        const { data: memberData, error: mErr } = await supabase
          .from("arisan_memberships")
          .select("*")
          .eq("group_id", groupId)
          .order("joined_at", { ascending: true });

        if (mErr) {
          console.error("load memberships error:", mErr.message);
          setErrorMsg("Gagal memuat daftar anggota.");
        } else {
          setMemberships(memberData || []);
        }

        // 4) ambil chat
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user || !group || !newMessage.trim()) return;

    if (!isMember) {
      alert("Hanya anggota grup yang dapat mengirim pesan.");
      return;
    }

    try {
      setSending(true);

      const me = memberships.find((m) => m.user_id === user.id);

      const { error } = await supabase
        .from("arisan_group_messages")
        .insert({
          group_id: group.id,
          sender_user_id: user.id,
          sender_email: user.email,
          sender_display_name: me?.display_name || user.email,
          content: newMessage.trim(),
        });

      if (error) {
        console.error("send message error:", error.message);
        alert("Gagal mengirim pesan.");
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

      const { error } = await supabase
        .from("arisan_memberships")
        .insert({
          group_id: group.id,
          user_id: user.id,
          user_email: user.email,
          display_name: displayName,
          role: "MEMBER",
        });

      if (error) {
        console.error("join group error:", error.message);
        alert("Gagal bergabung ke grup arisan.");
        return;
      }

      // reload memberships
      const { data: memberData, error: mErr } = await supabase
        .from("arisan_memberships")
        .select("*")
        .eq("group_id", group.id)
        .order("joined_at", { ascending: true });

      if (!mErr) {
        setMemberships(memberData || []);
      }

      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("join group unexpected error:", err);
      alert("Terjadi kesalahan saat bergabung.");
    } finally {
      setJoining(false);
    }
  };

  // ---------- RENDER STATE KHUSUS ----------

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

  // ---------- RENDER HALAMAN NORMAL ----------

  const myMembership = user
    ? memberships.find((m) => m.user_id === user.id)
    : null;

  const owner =
    memberships.find((m) => m.role === "OWNER") || null;

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
                Grup arisan &amp; ruang komunikasi
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
          <h1 className="nanad-dashboard-heading">
            {group.name}
          </h1>
          <p className="nanad-dashboard-body">
            ID Grup:{" "}
            <strong>{group.group_code}</strong>{" "}
            · Iuran per putaran:{" "}
            <strong>{formatCurrency(group.per_round_amount)}</strong>{" "}
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

        {/* Anggota & info singkat */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup</h3>
              <p>
                Semua anggota yang tergabung dalam grup arisan ini.
              </p>
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
            </ul>
          </div>
        </section>

        {/* CHAT GRUP ARISAN */}
        <section className="nanad-dashboard-table-section">
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
                  const mine = user && msg.sender_user_id === user.id;
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
                          <span style={{ opacity: 0.8 }}>{timeStr}</span>
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

          {/* Kolom kanan bisa kamu isi fitur lain nanti */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ruang pengembangan fitur</h3>
              <p>
                Di sini nanti bisa ditambahkan rekap iuran, daftar pemenang
                per putaran, atau tombol cepat untuk mencatat setoran /
                penarikan otomatis ke dompet Nanad.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan di aplikasi ini bersifat pencatatan &amp; simulasi.
            Pengelolaan dana nyata tetap mengikuti kesepakatan dan regulasi
            yang berlaku di luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
