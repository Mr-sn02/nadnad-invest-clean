// app/admin/promo-balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../../../lib/supabaseClient";

// email admin
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

export default function PromoBalanceBoostAdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [entries, setEntries] = useState([]);
  const [bonusInput, setBonusInput] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [savingId, setSavingId] = useState(null);

  // 🔁 load semua entry
  const loadEntries = async () => {
    const { data, error } = await supabase
      .from("promo_balance_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load promo entries error:", error.message);
      setLoadError("Gagal memuat data promo.");
      return;
    }

    setEntries(data || []);
  };

  const refreshEntries = loadEntries;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError("");

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

        const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
        if (!isAdmin) {
          router.push("/dashboard");
          return;
        }

        setAdmin(user);
        await loadEntries();
      } catch (err) {
        console.error("Promo admin init error:", err);
        setLoadError("Gagal memuat panel admin promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // 💾 Simpan total bonus (admin_bonus_amount)
  const handleSaveTotalBonus = async (entry) => {
    const raw = bonusInput[entry.id];
    const total = Number(raw);

    if (!total || total <= 0) {
      alert("Nominal bonus total harus lebih dari 0.");
      return;
    }

    try {
      setSavingId(entry.id);
      const { error } = await supabase
        .from("promo_balance_entries")
        .update({
          admin_bonus_amount: total,
          admin_note:
            entry.admin_note ||
            "Bonus promo Balance Boost akan dicairkan ke saldo dompet (cicilan harian).",
        })
        .eq("id", entry.id);

      if (error) {
        console.error("Update bonus error:", error.message);
        alert("Gagal menyimpan nominal bonus.");
        return;
      }

      await refreshEntries();
    } catch (err) {
      console.error("Save bonus error:", err);
      alert("Terjadi kesalahan saat menyimpan bonus.");
    } finally {
      setSavingId(null);
    }
  };

  // 🧮 Buat jadwal cicilan 30 hari
  const handleCreateSchedule30 = async (entry) => {
    const total = Number(entry.admin_bonus_amount || 0);
    if (!total || total <= 0) {
      alert("Set dulu total bonus (admin_bonus_amount) sebelum membuat jadwal.");
      return;
    }

    if ((entry.total_bonus_days || 0) > 0) {
      alert("Jadwal sudah pernah dibuat untuk entry ini.");
      return;
    }

    // Kita pakai integer rupiah
    const daily = Math.floor(total / 30);
    if (daily <= 0) {
      alert(
        "Total bonus terlalu kecil untuk dibagi 30 hari. Naikkan total bonus dulu."
      );
      return;
    }

    try {
      setSavingId(entry.id);
      const { error } = await supabase
        .from("promo_balance_entries")
        .update({
          daily_bonus_amount: daily,
          total_bonus_days: 30,
          days_sent: entry.days_sent || 0, // biasanya 0
          status: "PENDING", // masih jalan
        })
        .eq("id", entry.id);

      if (error) {
        console.error("Create schedule error:", error.message);
        alert("Gagal membuat jadwal 30 hari.");
        return;
      }

      await refreshEntries();
    } catch (err) {
      console.error("Create schedule error:", err);
      alert("Terjadi kesalahan saat membuat jadwal.");
    } finally {
      setSavingId(null);
    }
  };

  // 📤 Kirim cicilan hari ini (1x dari 30)
  const handleSendDaily = async (entry) => {
    const total = Number(entry.admin_bonus_amount || 0);
    const daily = Number(entry.daily_bonus_amount || 0);
    const totalDays = entry.total_bonus_days || 0;
    const daysSent = entry.days_sent || 0;

    if (!total || total <= 0 || !daily || daily <= 0 || totalDays <= 0) {
      alert("Jadwal 30 hari belum lengkap. Buat jadwal dulu.");
      return;
    }

    if (daysSent >= totalDays) {
      alert("Semua cicilan sudah dikirim (complete).");
      return;
    }

    // Ambil dompet
    try {
      setSavingId(entry.id);

      const { data: wallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", entry.wallet_id)
        .maybeSingle();

      if (wErr || !wallet) {
        console.error("Wallet for bonus error:", wErr?.message);
        alert("Dompet tidak ditemukan. Tidak bisa mengirim cicilan bonus.");
        setSavingId(null);
        return;
      }

      // Hitung nominal hari ini
      // Kalau ini hari terakhir, sesuaikan supaya total cocok dengan total bonus
      let todayAmount = daily;
      if (daysSent + 1 === totalDays) {
        const paidSoFar = daily * daysSent;
        todayAmount = total - paidSoFar;
      }

      if (todayAmount <= 0) {
        alert("Nominal cicilan hari ini tidak valid.");
        setSavingId(null);
        return;
      }

      const newBalance = (wallet.balance || 0) + todayAmount;

      // 1) update saldo dompet
      const { error: updErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (updErr) {
        console.error("Update wallet balance error:", updErr.message);
        alert("Gagal memperbarui saldo dompet.");
        setSavingId(null);
        return;
      }

      // 2) catat transaksi ADJUST (bonus harian)
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ADJUST",
          status: "COMPLETED",
          amount: todayAmount,
          user_email: entry.user_email || null,
          user_id: entry.user_id,
          note: `Bonus harian Promo Balance Boost (hari ke-${daysSent + 1} dari ${totalDays}).`,
          admin_note: `Bonus harian Balance Boost untuk tier ${entry.tier} periode ${entry.period_label}.`,
          created_at: new Date().toISOString(),
        });

      if (txErr) {
        console.error("Insert wallet transaction error:", txErr.message);
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi. Cek manual di database."
        );
        // tetap lanjut update entry supaya tidak dobel
      }

      // 3) update entry: tambah days_sent, kalau sudah habis → status PAID
      const newDaysSent = daysSent + 1;
      const status =
        newDaysSent >= totalDays ? "PAID" : entry.status || "PENDING";

      const { error: promoErr } = await supabase
        .from("promo_balance_entries")
        .update({
          days_sent: newDaysSent,
          status,
          paid_at:
            status === "PAID"
              ? new Date().toISOString()
              : entry.paid_at || null,
        })
        .eq("id", entry.id);

      if (promoErr) {
        console.error("Update promo entry status error:", promoErr.message);
        alert(
          "Bonus harian sudah dikirim, tetapi gagal mengubah data entry. Update manual jika perlu."
        );
        setSavingId(null);
        return;
      }

      await refreshEntries();
      alert(
        `Cicilan bonus hari ke-${newDaysSent} berhasil dikirim ke saldo dompet pengguna.`
      );
    } catch (err) {
      console.error("Send daily bonus error:", err);
      alert("Terjadi kesalahan saat mengirim bonus harian.");
    } finally {
      setSavingId(null);
    }
  };

  // (opsional) Cairkan seluruh bonus sekaligus (tidak dicicil)
  const handlePayAllOnce = async (entry) => {
    if ((entry.total_bonus_days || 0) > 0 && (entry.days_sent || 0) > 0) {
      alert(
        "Jadwal cicilan sudah berjalan. Sebaiknya selesaikan lewat tombol 'Kirim cicilan hari ini'."
      );
      return;
    }

    const total = Number(entry.admin_bonus_amount || 0);
    if (!total || total <= 0) {
      alert("Total bonus belum diisi.");
      return;
    }

    const ok = confirm(
      `Cairkan seluruh bonus ${formatCurrency(
        total
      )} sekaligus ke saldo dompet user ini?`
    );
    if (!ok) return;

    try {
      setSavingId(entry.id);

      // 1) ambil dompet
      const { data: wallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", entry.wallet_id)
        .maybeSingle();

      if (wErr || !wallet) {
        console.error("Wallet for bonus error:", wErr?.message);
        alert("Dompet tidak ditemukan. Tidak bisa mencairkan bonus.");
        setSavingId(null);
        return;
      }

      const newBalance = (wallet.balance || 0) + total;

      // 2) update saldo dompet
      const { error: updErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (updErr) {
        console.error("Update wallet balance error:", updErr.message);
        alert("Gagal memperbarui saldo dompet.");
        setSavingId(null);
        return;
      }

      // 3) catat transaksi ADJUST
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ADJUST",
          status: "COMPLETED",
          amount: total,
          user_email: entry.user_email || null,
          user_id: entry.user_id,
          note: "Bonus penuh Promo Balance Boost (sekali bayar).",
          admin_note: `Bonus penuh Balance Boost untuk tier ${entry.tier} periode ${entry.period_label}.`,
          created_at: new Date().toISOString(),
        });

      if (txErr) {
        console.error("Insert wallet transaction error:", txErr.message);
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi. Cek manual di database."
        );
      }

      // 4) tandai PAID
      const { error: promoErr } = await supabase
        .from("promo_balance_entries")
        .update({
          status: "PAID",
          days_sent: 30,
          total_bonus_days: 30,
          daily_bonus_amount: Math.floor(total / 30),
          paid_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (promoErr) {
        console.error("Update promo entry status error:", promoErr.message);
        alert(
          "Bonus sudah dikirim, tetapi gagal mengubah status entry. Update manual jika perlu."
        );
        setSavingId(null);
        return;
      }

      await refreshEntries();
      alert("Bonus penuh berhasil dicairkan ke saldo dompet pengguna.");
    } catch (err) {
      console.error("Pay all bonus error:", err);
      alert("Terjadi kesalahan saat mencairkan bonus penuh.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat panel admin promo Balance Boost...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Promo admin error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat panel admin promo.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {loadError}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/dashboard")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke dashboard
            </button>
          </section>
        </div>
      </main>
    );
  }

  const filteredEntries =
    statusFilter === "ALL"
      ? entries
      : entries.filter((e) => e.status === statusFilter);

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">
                Dompet Nadnad · Admin Promo
              </p>
              <p className="nanad-dashboard-brand-sub">
                Panel Balance Boost · {admin?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/dashboard")}
          >
            Kembali ke dashboard
          </button>
        </header>

        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Admin promo</p>
          <h1 className="nanad-dashboard-heading">
            Kelola peserta dan bonus Balance Boost (cicilan 30 hari).
          </h1>
          <p className="nanad-dashboard-body">
            Alur: isi total bonus → buat jadwal 30 hari → setiap hari (atau
            sesuai kebijakan) klik <strong>kirim cicilan hari ini</strong> untuk
            menambah saldo dompet pengguna sedikit demi sedikit. Bisa juga
            cairkan penuh sekali bayar jika diperlukan.
          </p>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <label
              className="nanad-dashboard-body"
              style={{ fontSize: "0.82rem" }}
            >
              Filter status:{" "}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  marginLeft: "0.35rem",
                  background: "rgba(15,23,42,0.9)",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.7)",
                  padding: "0.2rem 0.7rem",
                  fontSize: "0.8rem",
                  color: "#e5e7eb",
                }}
              >
                <option value="ALL">SEMUA</option>
                <option value="PENDING">PENDING / BERJALAN</option>
                <option value="PAID">PAID (SELESAI)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
          </div>
        </section>

        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Daftar partisipasi Balance Boost</h3>
            <p>
              Perhatikan kolom jadwal: {`"hari terkirim / total hari"`}. Untuk
              skema cicilan harian, pastikan kamu klik tombol kirim cicilan
              maksimal sekali per hari per peserta (kalau mau bener-bener 30
              hari).
            </p>
          </div>

          {filteredEntries.length === 0 ? (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem" }}
            >
              Belum ada data untuk filter yang dipilih.
            </p>
          ) : (
            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {filteredEntries.map((e) => {
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
                const paidLabel = e.paid_at
                  ? new Date(e.paid_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-";

                const totalDays = e.total_bonus_days || 0;
                const daysSent = e.days_sent || 0;

                const scheduleInfo =
                  totalDays > 0
                    ? `${daysSent} / ${totalDays} hari terkirim`
                    : "Belum ada jadwal";

                const hasSchedule = totalDays > 0;

                return (
                  <div key={e.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <strong>{tierLabel(e.tier)}</strong>
                      <br />
                      <small>{e.user_email || e.user_id}</small>
                      <br />
                      <small>{created}</small>
                      <br />
                      <small>Periode: {e.period_label}</small>
                    </div>

                    <div>
                      <p style={{ marginBottom: "0.2rem" }}>
                        Nominal promo:
                        <br />
                        <strong>{formatCurrency(e.amount)}</strong>
                      </p>
                      <p style={{ marginBottom: "0.2rem" }}>
                        Total bonus (target):
                        <br />
                        <strong>
                          {e.admin_bonus_amount
                            ? formatCurrency(e.admin_bonus_amount)
                            : "Belum diisi"}
                        </strong>
                      </p>
                      <p style={{ fontSize: "0.78rem", marginTop: "0.35rem" }}>
                        Status: <strong>{e.status}</strong>
                        <br />
                        Dibayar penuh pada: {paidLabel}
                        <br />
                        Jadwal: {scheduleInfo}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.35rem",
                        alignItems: "flex-end",
                        minWidth: "240px",
                      }}
                    >
                      {/* Input total bonus */}
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        placeholder="Total bonus (Rp)"
                        value={bonusInput[e.id] ?? (e.admin_bonus_amount || "")}
                        onChange={(ev) =>
                          setBonusInput((prev) => ({
                            ...prev,
                            [e.id]: ev.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          borderRadius: "999px",
                          border:
                            "1px solid rgba(148,163,184,0.7)",
                          background:
                            "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                          padding: "0.35rem 0.8rem",
                          fontSize: "0.78rem",
                          color: "#e5e7eb",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        className="nanad-dashboard-logout"
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.9rem" }}
                        disabled={savingId === e.id}
                        onClick={() => handleSaveTotalBonus(e)}
                      >
                        {savingId === e.id
                          ? "Menyimpan..."
                          : "Simpan total bonus"}
                      </button>

                      {/* Buat jadwal 30 hari */}
                      <button
                        type="button"
                        className="nanad-dashboard-logout"
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.4rem 0.9rem",
                          opacity: hasSchedule ? 0.7 : 1,
                        }}
                        disabled={savingId === e.id || hasSchedule}
                        onClick={() => handleCreateSchedule30(e)}
                      >
                        {hasSchedule
                          ? "Jadwal 30 hari sudah ada"
                          : "Buat jadwal 30 hari"}
                      </button>

                      {/* Kirim cicilan hari ini */}
                      <button
                        type="button"
                        className="nanad-dashboard-deposit-submit"
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.9rem" }}
                        disabled={
                          savingId === e.id ||
                          e.status === "PAID" ||
                          !hasSchedule ||
                          daysSent >= totalDays
                        }
                        onClick={() => handleSendDaily(e)}
                      >
                        {savingId === e.id
                          ? "Memproses..."
                          : e.status === "PAID"
                          ? "Selesai (PAID)"
                          : !hasSchedule
                          ? "Buat jadwal dulu"
                          : daysSent >= totalDays
                          ? "Semua cicilan sudah dikirim"
                          : "Kirim cicilan hari ini"}
                      </button>

                      {/* Opsional: cairkan semua sekaligus */}
                      <button
                        type="button"
                        className="nanad-dashboard-logout"
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.3rem 0.8rem",
                          opacity:
                            hasSchedule && daysSent > 0 && e.status !== "PAID"
                              ? 0.6
                              : 1,
                        }}
                        disabled={
                          savingId === e.id ||
                          e.status === "PAID" ||
                          (hasSchedule && daysSent > 0)
                        }
                        onClick={() => handlePayAllOnce(e)}
                      >
                        Cairkan penuh (sekali bayar)
                      </button>
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
            Untuk skema cicilan 30 hari, jalankan tombol kirim cicilan per hari
            sesuai kebijakan internal. Semua bonus tetap bersifat hadiah, bukan
            janji imbal hasil tetap.
          </span>
        </footer>
      </div>
    </main>
  );
}
