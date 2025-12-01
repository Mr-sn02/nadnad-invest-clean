// app/admin/promo/balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../../../lib/supabaseClient";

// GANTI DENGAN EMAIL ADMINMU
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tierLabel(tier) {
  switch (tier) {
    case "BRONZE":
      return "Bronze";
    case "SILVER":
      return "Silver";
    case "GOLD":
      return "Gold";
    case "DIAMOND":
      return "Diamond";
    default:
      return tier || "-";
  }
}

export default function AdminBalanceBoostPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [entries, setEntries] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [bonusInputs, setBonusInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const init = async () => {
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

        setAdminEmail(user.email || "");

        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          // Bukan admin, lempar ke dashboard
          router.push("/dashboard");
          return;
        }

        const { data, error: eErr } = await supabase
          .from("promo_balance_boost_entries")
          .select(
            "id, user_id, user_email, wallet_id, amount, tier, month_label, status, bonus_amount, bonus_note, bonus_awarded_at, created_at"
          )
          .order("created_at", { ascending: false });

        if (eErr) {
          console.error("Load promo entries error:", eErr.message);
          setErrorMsg("Gagal memuat data setoran promo.");
        } else {
          setEntries(data || []);
        }
      } catch (err) {
        console.error("Admin promo init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman admin.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleSendBonus = async (entry) => {
    if (!confirm("Kirim bonus ke dompet pengguna ini?")) return;

    setErrorMsg("");
    setActionLoadingId(entry.id);

    try {
      const rawBonus =
        bonusInputs[entry.id] != null && bonusInputs[entry.id] !== ""
          ? Number(bonusInputs[entry.id])
          : Number(entry.bonus_amount || 0);

      const bonus = Number(rawBonus);

      if (!bonus || bonus <= 0) {
        alert("Nominal bonus harus lebih besar dari 0.");
        setActionLoadingId(null);
        return;
      }

      // 1) ambil dompet
      const { data: walletRow, error: wErr } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("id", entry.wallet_id)
        .maybeSingle();

      if (wErr || !walletRow) {
        console.error("Get wallet error:", wErr?.message);
        alert("Gagal membaca dompet pengguna. Coba lagi.");
        setActionLoadingId(null);
        return;
      }

      const newBalance = (walletRow.balance || 0) + bonus;

      // 2) update saldo dompet
      const { error: upErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletRow.id);

      if (upErr) {
        console.error("Update wallet error:", upErr.message);
        alert("Gagal memperbarui saldo dompet pengguna.");
        setActionLoadingId(null);
        return;
      }

      const note =
        noteInputs[entry.id] && noteInputs[entry.id].trim().length > 0
          ? noteInputs[entry.id].trim()
          : entry.bonus_note || "Bonus promo Balance Boost";

      // 3) update data entry
      const { data: updated, error: eErr } = await supabase
        .from("promo_balance_boost_entries")
        .update({
          bonus_amount: bonus,
          bonus_note: note,
          status: "BONUS_SENT",
          bonus_awarded_at: new Date().toISOString(),
        })
        .eq("id", entry.id)
        .select()
        .single();

      if (eErr) {
        console.error("Update entry error:", eErr.message);
        alert(
          "Saldo dompet sudah ditambah, tetapi status entry gagal di-update. Mohon cek manual di Supabase."
        );
        setActionLoadingId(null);
        return;
      }

      // 4) update di state
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? updated : e))
      );

      setBonusInputs((prev) => ({ ...prev, [entry.id]: "" }));
      setNoteInputs((prev) => ({ ...prev, [entry.id]: "" }));
    } catch (err) {
      console.error("Send bonus error:", err);
      alert("Terjadi kesalahan saat mengirim bonus.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat panel admin Balance Boost...
          </p>
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
              <p className="nanad-dashboard-brand-title">
                Dompet Nadnad · Admin Panel
              </p>
              <p className="nanad-dashboard-brand-sub">
                Balance Boost – Pengelolaan bonus &amp; setoran promo
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/promo/balance-boost")}
            >
              Halaman promo
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

        {/* INFO ADMIN */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Admin mode</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost – Setoran promo &amp; pengiriman bonus.
          </h1>
          <p className="nanad-dashboard-body">
            Panel ini digunakan untuk melihat semua{" "}
            <strong>setoran promo Balance Boost</strong> dan mengirimkan{" "}
            <strong>bonus saldo</strong> ke Dompet Nadnad pengguna yang
            berhak/beruntung. Bonus ini bersifat{" "}
            <strong>hadiah promosi</strong>, bukan janji keuntungan tetap.
          </p>

          <p
            className="nanad-dashboard-body"
            style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#9ca3af" }}
          >
            Login admin: <strong>{adminEmail || "-"}</strong>
          </p>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.4rem", color: "#fecaca", fontSize: "0.8rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* TABEL SETORAN PROMO */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar setoran promo Balance Boost</h3>
              <p>
                Isi nominal bonus untuk pengguna yang dipilih, lalu klik{" "}
                <strong>Kirim bonus ke dompet</strong>. Sistem akan menambah
                saldo di tabel <code>wallets</code> dan memutakhirkan status
                entry.
              </p>
            </div>

            {entries.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.9rem" }}
              >
                Belum ada setoran promo tercatat.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.9rem" }}
              >
                <div className="nanad-dashboard-deposits-header">
                  <div>Waktu &amp; user</div>
                  <div>Nominal &amp; Tier</div>
                  <div>Periode</div>
                  <div>Bonus &amp; aksi</div>
                </div>

                {entries.map((entry) => {
                  const isSent = entry.status === "BONUS_SENT";
                  const localBonus =
                    bonusInputs[entry.id] ??
                    (entry.bonus_amount ? Number(entry.bonus_amount) : "");

                  const localNote = noteInputs[entry.id] ?? entry.bonus_note ?? "";

                  return (
                    <div
                      key={entry.id}
                      className="nanad-dashboard-deposits-row"
                      style={{ alignItems: "flex-start" }}
                    >
                      {/* kolom 1 */}
                      <div style={{ fontSize: "0.8rem" }}>
                        <strong>{entry.user_email || "Tanpa email"}</strong>
                        <br />
                        <span>{formatDateTime(entry.created_at)}</span>
                        <br />
                        <span style={{ fontSize: "0.75rem" }}>
                          status: <strong>{entry.status}</strong>
                        </span>
                      </div>

                      {/* kolom 2 */}
                      <div style={{ fontSize: "0.8rem" }}>
                        {formatCurrency(entry.amount)}
                        <br />
                        <span>Tier: {tierLabel(entry.tier)}</span>
                      </div>

                      {/* kolom 3 */}
                      <div style={{ fontSize: "0.8rem" }}>
                        {entry.month_label || "-"}
                        {entry.bonus_awarded_at && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.75rem" }}>
                              Bonus at: {formatDateTime(entry.bonus_awarded_at)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* kolom 4 */}
                      <div style={{ fontSize: "0.8rem", minWidth: "220px" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.35rem",
                          }}
                        >
                          Bonus (Rp)
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            value={localBonus}
                            onChange={(e) =>
                              setBonusInputs((prev) => ({
                                ...prev,
                                [entry.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              marginTop: "0.1rem",
                              borderRadius: "999px",
                              border: "1px solid rgba(148,163,184,0.7)",
                              background:
                                "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                              padding: "0.25rem 0.7rem",
                              fontSize: "0.78rem",
                              color: "#e5e7eb",
                              outline: "none",
                            }}
                            disabled={isSent}
                          />
                        </label>

                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.4rem",
                          }}
                        >
                          Catatan bonus
                          <input
                            type="text"
                            value={localNote}
                            onChange={(e) =>
                              setNoteInputs((prev) => ({
                                ...prev,
                                [entry.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              marginTop: "0.1rem",
                              borderRadius: "999px",
                              border: "1px solid rgba(148,163,184,0.4)",
                              background:
                                "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,1))",
                              padding: "0.25rem 0.7rem",
                              fontSize: "0.78rem",
                              color: "#e5e7eb",
                              outline: "none",
                            }}
                            disabled={isSent}
                          />
                        </label>

                        <button
                          type="button"
                          className="nanad-dashboard-deposit-submit"
                          style={{ fontSize: "0.76rem", padding: "0.4rem 1rem" }}
                          disabled={isSent || actionLoadingId === entry.id}
                          onClick={() => handleSendBonus(entry)}
                        >
                          {isSent
                            ? "Bonus sudah dikirim"
                            : actionLoadingId === entry.id
                            ? "Memproses..."
                            : "Kirim bonus ke dompet"}
                        </button>

                        {entry.bonus_amount && (
                          <p
                            style={{
                              marginTop: "0.4rem",
                              fontSize: "0.76rem",
                              color: "#bbf7d0",
                            }}
                          >
                            Bonus tersimpan:{" "}
                            {formatCurrency(entry.bonus_amount)} <br />
                            <span style={{ color: "#e5e7eb" }}>
                              {entry.bonus_note || ""}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Admin Balance Boost.
          </span>
          <span>
            Panel ini hanya untuk pengelola resmi. Bonus yang dikirimkan
            bersifat hadiah promosi, bukan kewajiban imbal hasil tetap kepada
            pengguna.
          </span>
        </footer>
      </div>
    </main>
  );
}
