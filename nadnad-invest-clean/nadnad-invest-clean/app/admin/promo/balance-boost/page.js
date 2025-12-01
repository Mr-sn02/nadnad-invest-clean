// app/admin/promo-balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../../../lib/supabaseClient";

// ADMIN EMAIL SEDERHANA
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function tierLabel(tier) {
  switch (tier) {
    case "BRONZE":
      return "Bronze (100k – <1jt)";
    case "SILVER":
      return "Silver (1jt – <10jt)";
    case "GOLD":
      return "Gold (10jt – <50jt)";
    case "DIAMOND":
      return "Diamond (≥50jt)";
    default:
      return "-";
  }
}

export default function AdminBalanceBoostPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // form: set total bonus & jadwal 30 hari
  const [editingId, setEditingId] = useState(null);
  const [bonusInput, setBonusInput] = useState("");

  const loadEntries = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("promo_balance_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load promo entries error:", error.message);
      setErrorMsg("Gagal memuat data promo. Cek koneksi atau schema.");
      setEntries([]);
    } else {
      setEntries(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

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

      const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
      if (!isAdmin) {
        setErrorMsg("Halaman ini hanya untuk admin Dompet Nadnad.");
        setLoading(false);
        return;
      }

      setAdmin(user);
      await loadEntries();
    };

    init();
  }, [router]);

  const handleSetSchedule = async (entry) => {
    // set bonus total + jadwal 30 hari
    const totalBonus = Number(bonusInput) || 0;
    const totalDays = 30;

    const dailyBonus =
      totalBonus > 0 ? Math.floor(totalBonus / totalDays) : 0;

    try {
      const { error } = await supabase
        .from("promo_balance_entries")
        .update({
          admin_bonus_amount: totalBonus,
          total_bonus_days: totalDays,
          daily_bonus_amount: dailyBonus,
          days_sent: 0,
          next_payout_date: new Date().toISOString().slice(0, 10), // hari ini
          status: "SCHEDULED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) {
        console.error("Set schedule error:", error.message);
        alert("Gagal menyimpan jadwal 30 hari. Cek console/log.");
        return;
      }

      setEditingId(null);
      setBonusInput("");
      await loadEntries();
      alert("Jadwal 30 hari & total bonus berhasil disimpan.");
    } catch (err) {
      console.error("Unexpected schedule error:", err);
      alert("Terjadi kesalahan saat menyimpan jadwal.");
    }
  };

  const handleSendDaily = async (entry) => {
    if (!confirm("Kirim cicilan harian (principal + bonus) untuk user ini?"))
      return;

    if (!entry.total_bonus_days || entry.total_bonus_days <= 0) {
      alert("Entry ini belum punya jadwal 30 hari. Set dulu total bonus & jadwal.");
      return;
    }

    const totalDays = entry.total_bonus_days;
    const daysSent = entry.days_sent || 0;

    if (daysSent >= totalDays) {
      alert("Semua cicilan sudah terkirim (hari ke-30 sudah selesai).");
      return;
    }

    try {
      // ambil dompet user
      const { data: wallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", entry.wallet_id)
        .maybeSingle();

      if (wErr || !wallet) {
        console.error("Load wallet error:", wErr?.message);
        alert("Gagal memuat dompet pengguna. Cek dulu di tabel wallets.");
        return;
      }

      // hitung principal harian (dikembalikan 30x)
      const totalPrincipal = Number(entry.amount) || 0;
      const basePrincipal = Math.floor(totalPrincipal / totalDays);
      const remainder = totalPrincipal - basePrincipal * totalDays;

      // hari ke-(daysSent+1)
      const nextDay = daysSent + 1;

      // di beberapa hari pertama kita bisa tambah 1 untuk menutupi remainder
      let principalToday = basePrincipal;
      if (remainder > 0 && nextDay <= remainder) {
        principalToday += 1;
      }

      const dailyBonus = Number(entry.daily_bonus_amount) || 0;
      const payout = principalToday + dailyBonus;

      // update saldo dompet
      const newBalance = (wallet.balance || 0) + payout;

      const { error: updWalletErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (updWalletErr) {
        console.error("Update wallet error:", updWalletErr.message);
        alert("Gagal menambah saldo dompet. Cicilan belum terkirim.");
        return;
      }

      // update entry promo: days_sent & status
      const newDaysSent = daysSent + 1;
      const newStatus =
        newDaysSent >= totalDays ? "PAID" : "SCHEDULED";

      const { error: updEntryErr } = await supabase
        .from("promo_balance_entries")
        .update({
          days_sent: newDaysSent,
          status: newStatus,
          next_payout_date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (updEntryErr) {
        console.error("Update entry error:", updEntryErr.message);
        alert(
          "Saldo sudah bertambah, tapi gagal update status entry. Cek manual di database."
        );
        // tetap lanjut, karena saldo sudah benar
      }

      // CATAT DI WALLET_TRANSACTIONS (tidak bikin alert kalau gagal)
      try {
        const { error: txErr } = await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            type: "PROMO_PAYOUT", // tipe khusus untuk promo
            status: "COMPLETED",
            amount: payout,
            user_email: entry.user_email,
            note: `Cicilan hari ke-${nextDay} promo Balance Boost tier ${entry.tier}. Principal: ${principalToday}, bonus: ${dailyBonus}.`,
            admin_note: `Promo Balance Boost · ${entry.period_label || ""}`,
            created_at: new Date().toISOString(),
          });

        if (txErr) {
          console.error(
            "Gagal mencatat wallet_transactions (tidak fatal):",
            txErr.message
          );
          // ❗ JANGAN alert di sini, cukup log saja
        }
      } catch (logErr) {
        console.error(
          "Unexpected error saat insert wallet_transactions:",
          logErr
        );
      }

      await loadEntries();
      alert(
        `Cicilan hari ini (hari ke-${nextDay}) sebesar ${formatCurrency(
          payout
        )} berhasil dikirim ke Dompet Nadnad user.`
      );
    } catch (err) {
      console.error("Unexpected sendDaily error:", err);
      alert("Terjadi kesalahan saat mengirim cicilan harian.");
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat panel promo admin...</p>
        </div>
      </main>
    );
  }

  if (errorMsg && !admin) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Admin · Promo</p>
            <h1 className="nanad-dashboard-heading">
              Akses panel promo Balance Boost ditolak.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg}
            </p>
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
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Panel Admin · Promo Balance Boost
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/dashboard")}
          >
            Kembali ke Dashboard
          </button>
        </header>

        {/* DAFTAR ENTRY PROMO */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Keikutsertaan promo Balance Boost</h3>
            <p>
              Dari sini admin bisa mengatur total bonus, menjadwalkan 30 hari,
              dan mengirim cicilan harian manual ke Dompet Nadnad pengguna.
            </p>
          </div>

          {entries.length === 0 ? (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem" }}
            >
              Belum ada peserta promo. Setelah user ikut event dari halaman
              promo, data mereka akan muncul di sini.
            </p>
          ) : (
            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {entries.map((e) => {
                const created = new Date(e.created_at).toLocaleString(
                  "id-ID",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                const totalDays = e.total_bonus_days || 0;
                const daysSent = e.days_sent || 0;
                const scheduleLabel =
                  totalDays > 0
                    ? `${daysSent} / ${totalDays} hari terkirim`
                    : "Belum ada jadwal";

                const isEditing = editingId === e.id;

                return (
                  <div key={e.id} className="nanad-dashboard-deposits-row">
                    {/* Kolom info dasar */}
                    <div>
                      <strong>{tierLabel(e.tier)}</strong>
                      <br />
                      <small>{created}</small>
                      <br />
                      <small>{e.user_email}</small>
                      <br />
                      <small>ID dompet: {e.wallet_id}</small>
                    </div>

                    {/* Kolom nominal & jadwal */}
                    <div>
                      <p style={{ marginBottom: "0.2rem" }}>
                        Dana dikunci:
                        <br />
                        <strong>{formatCurrency(e.amount)}</strong>
                      </p>
                      <p style={{ marginBottom: "0.2rem", fontSize: "0.8rem" }}>
                        Total bonus ditetapkan admin:{" "}
                        <strong>
                          {e.admin_bonus_amount
                            ? formatCurrency(e.admin_bonus_amount)
                            : "Belum di-set"}
                        </strong>
                      </p>
                      <p style={{ fontSize: "0.78rem" }}>
                        Jadwal pengembalian:{" "}
                        <strong>{scheduleLabel}</strong>
                      </p>
                      <p style={{ fontSize: "0.78rem" }}>
                        Status: <strong>{e.status}</strong>
                      </p>
                    </div>

                    {/* Kolom aksi admin */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.45rem",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            placeholder="Total bonus untuk 30 hari"
                            value={bonusInput}
                            onChange={(ev) => setBonusInput(ev.target.value)}
                            style={{
                              width: "160px",
                              borderRadius: "999px",
                              border:
                                "1px solid rgba(148,163,184,0.7)",
                              background:
                                "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                              padding: "0.3rem 0.7rem",
                              fontSize: "0.78rem",
                              color: "#e5e7eb",
                              outline: "none",
                            }}
                          />
                          <button
                            type="button"
                            className="nanad-dashboard-deposit-submit"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.4rem 0.9rem",
                            }}
                            onClick={() => handleSetSchedule(e)}
                          >
                            Simpan jadwal 30 hari
                          </button>
                          <button
                            type="button"
                            className="nanad-dashboard-logout"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.4rem 0.9rem",
                            }}
                            onClick={() => {
                              setEditingId(null);
                              setBonusInput("");
                            }}
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="nanad-dashboard-logout"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.4rem 0.9rem",
                            }}
                            onClick={() => {
                              setEditingId(e.id);
                              setBonusInput(
                                e.admin_bonus_amount
                                  ? String(e.admin_bonus_amount)
                                  : ""
                              );
                            }}
                          >
                            Atur total bonus & jadwal
                          </button>

                          <button
                            type="button"
                            className="nanad-dashboard-deposit-submit"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.4rem 0.9rem",
                              opacity:
                                e.status === "PAID" ? 0.4 : 1,
                            }}
                            disabled={e.status === "PAID"}
                            onClick={() => handleSendDaily(e)}
                          >
                            Kirim cicilan hari ini
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Admin promo Balance
            Boost.
          </span>
          <span>
            Admin mengirim cicilan harian secara manual untuk menjaga kontrol &
            mencegah kecurangan. Pastikan nominal dan status sudah dicek sebelum
            konfirmasi ke pengguna.
          </span>
        </footer>
      </div>
    </main>
  );
}
