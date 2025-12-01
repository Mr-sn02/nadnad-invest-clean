// app/promo/balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function tierFromAmount(amount) {
  if (amount >= 100000 && amount < 1000000) return "BRONZE";      // 100k – <1M
  if (amount >= 1000000 && amount < 10000000) return "SILVER";     // 1M – <10M
  if (amount >= 10000000 && amount < 50000000) return "GOLD";      // 10M – <50M
  if (amount >= 50000000) return "DIAMOND";                        // ≥50M
  return null;
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

export default function BalanceBoostPromoPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [amountInput, setAmountInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [entries, setEntries] = useState([]);

  const periodLabel = "Gelombang 1 · Promo 3 bulan Balance Boost";

  const loadEntries = async (uid) => {
    const { data, error } = await supabase
      .from("promo_balance_entries")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load promo entries error:", error.message);
      return;
    }

    setEntries(data || []);
  };

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

        setUser(user);

        // cari dompet user
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Wallet load error:", walletErr.message);
          setErrorMsg(
            "Gagal memuat dompet utama. Buka halaman Wallet dulu agar dompet dibuat otomatis."
          );
          return;
        }

        if (!existing) {
          setErrorMsg(
            "Dompet belum tersedia. Buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(existing);
        await loadEntries(user.id);
      } catch (err) {
        console.error("Promo init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleJoinPromo = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!user || !wallet) {
      setErrorMsg("Dompet belum siap. Coba buka halaman Wallet lebih dulu.");
      return;
    }

    const amount = Number(amountInput);
    if (!amount || amount < 100000) {
      setErrorMsg("Minimal nominal event adalah Rp 100.000.");
      return;
    }

    const tier = tierFromAmount(amount);
    if (!tier) {
      setErrorMsg(
        "Nominal tidak masuk ke salah satu tier. Sesuaikan dengan batas minimal & maksimal tier."
      );
      return;
    }

    if (amount > (wallet.balance || 0)) {
      setErrorMsg(
        "Saldo Dompet Nadnad tidak cukup untuk ikut event dengan nominal tersebut."
      );
      return;
    }

    try {
      setJoinLoading(true);

      // Ambil saldo dompet terbaru (biar lebih aman)
      const { data: freshWallet, error: freshErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", wallet.id)
        .maybeSingle();

      if (freshErr || !freshWallet) {
        console.error("Refresh wallet error:", freshErr?.message);
        setErrorMsg("Gagal memuat dompet terbaru. Coba lagi.");
        setJoinLoading(false);
        return;
      }

      if (amount > (freshWallet.balance || 0)) {
        setErrorMsg(
          "Saldo Dompet Nadnad tidak cukup (setelah update terakhir). Coba kurangi nominalnya."
        );
        setJoinLoading(false);
        return;
      }

      const newBalance = (freshWallet.balance || 0) - amount;

      // 1) Potong saldo dompet (LOCK dana event)
      const { error: updErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", freshWallet.id);

      if (updErr) {
        console.error("Update wallet balance error:", updErr.message);
        setErrorMsg("Gagal memotong saldo dompet untuk event.");
        setJoinLoading(false);
        return;
      }

      // 2) Catat transaksi kunci dana event
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: freshWallet.id,
        type: "PROMO_LOCK",
        status: "COMPLETED",
        amount: amount,
        user_email: user.email,
        user_id: user.id,
        note: `Ikut Promo Balance Boost tier ${tier}. Dana dikunci dan akan dikembalikan harian selama 30 hari.`,
        admin_note:
          "Promo Balance Boost - dana dikunci untuk event (principal akan dikembalikan bertahap 30 hari, plus bonus bila terpilih).",
        created_at: new Date().toISOString(),
      });

      if (txErr) {
        console.error("Insert wallet transaction error:", txErr.message);
        // saldo sudah terpotong, tapi kita lanjut catat promo entry
      }

      // 3) Catat keikutsertaan di tabel promo_balance_entries
      const { error: promoErr } = await supabase
        .from("promo_balance_entries")
        .insert({
          user_id: user.id,
          user_email: user.email,
          wallet_id: freshWallet.id,
          amount: amount,
          tier,
          period_label: periodLabel,
          status: "PENDING", // artinya: sedang berjalan, menunggu jadwal & pencairan dari admin
        });

      if (promoErr) {
        console.error("Insert promo entry error:", promoErr.message);
        setErrorMsg(
          "Saldo sudah terpotong, tapi gagal mencatat keikutsertaan promo. Segera hubungi admin agar dicek manual."
        );
        setJoinLoading(false);
        return;
      }

      setWallet({ ...freshWallet, balance: newBalance });
      setAmountInput("");
      setSuccessMsg(
        "Kamu berhasil ikut event Balance Boost. Dana sudah dikunci dan akan dikembalikan harian selama 30 hari oleh admin, lengkap dengan bonus jika kamu terpilih."
      );
      await loadEntries(user.id);
    } catch (err) {
      console.error("Join promo error:", err);
      setErrorMsg("Terjadi kesalahan saat mendaftarkan ke event.");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman promo Balance Boost...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg && !user) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Promo error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat halaman promo Balance Boost.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const amountNumber = Number(amountInput) || 0;
  const detectedTier = tierFromAmount(amountNumber);

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
                Promo Balance Boost · Event 3 Bulan
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Kembali ke Dompet
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

        {/* INTRO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo spesial</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost · kunci dana 30 hari, dikembalikan harian + peluang bonus.
          </h1>
          <p className="nanad-dashboard-body">
            Kamu bisa mengunci dana dari Dompet Nadnad selama 30 hari di event ini.
            Setiap hari, admin akan mengembalikan sebagian dana (principal) ke dompetmu.
            Jika kamu termasuk peserta yang terpilih, akan ada{" "}
            <strong>bonus tambahan</strong> yang ikut dicicil bersama pengembalian
            principal.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo Dompet Nadnad</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
              >
                Sebagian saldo bisa kamu kunci untuk ikut event, dan akan
                dikembalikan sedikit demi sedikit setiap hari selama 30 hari.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Periode event</p>
              <p className="nanad-dashboard-stat-number">{periodLabel}</p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
              >
                Event ini bersifat <strong>terbatas 3 bulan</strong> sebagai
                promo pembuka Dompet Nadnad. Skema dapat berubah atau dihentikan
                sewaktu-waktu untuk gelombang berikutnya.
              </p>
            </div>
          </div>
        </section>

        {/* FORM IKUT EVENT + INFO TIER */}
        <section className="nanad-dashboard-table-section">
          {/* KIRI: form ikut event */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ikut event Balance Boost</h3>
              <p>
                Masukkan nominal dari Dompet Nadnad yang ingin kamu kunci untuk
                event ini. Sistem akan otomatis menentukan kamu masuk{" "}
                <strong>tier</strong> yang mana.
              </p>
            </div>

            <form
              onSubmit={handleJoinPromo}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal yang ingin dikunci (dari saldo dompet)
                <input
                  type="number"
                  min="100000"
                  step="50000"
                  placeholder="Contoh: 250000, 1000000, 7500000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                />
              </label>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.8rem", marginTop: "0.35rem" }}
              >
                Tier yang terdeteksi:{" "}
                <strong>
                  {detectedTier
                    ? tierLabel(detectedTier)
                    : "Belum memenuhi minimal Rp 100.000"}
                </strong>
              </p>

              {errorMsg && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.8rem" }}
                >
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#bbf7d0", fontSize: "0.8rem" }}
                >
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={joinLoading}
                style={{ marginTop: "0.5rem" }}
              >
                {joinLoading
                  ? "Memproses..."
                  : "Ikut event dengan nominal ini"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.5rem" }}
              >
                Dana akan langsung dipotong dari saldo Dompet Nadnad dan{" "}
                <strong>dikunci 30 hari</strong>. Setiap hari, admin akan
                mengembalikan sebagian dana ke dompetmu. Jika kamu terpilih
                sebagai penerima bonus, jumlah harian yang kembali akan lebih
                besar dari nilai pokok.
              </p>
            </form>
          </div>

          {/* KANAN: info tier + riwayat keikutsertaan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Tier &amp; estimasi bonus</h3>
              <p>
                Perkiraan hadiah promo per tier. Bonus <strong>bukan janji</strong>,
                melainkan hadiah untuk peserta yang terpilih sesuai kuota per
                bulan.
              </p>
            </div>

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem", fontSize: "0.84rem" }}
            >
              <ul style={{ paddingLeft: "1rem", marginBottom: "0.75rem" }}>
                <li>
                  <strong>Bronze</strong> — Rp 100.000 s.d. &lt; Rp 1.000.000
                  <br />
                  Kuota pemenang per bulan (misal): 30 orang.
                  <br />
                  Hadiah promo: hingga ±1% dari total setoran bulan itu
                  (maks. contoh: Rp 25.000 per user).
                </li>
                <li style={{ marginTop: "0.5rem" }}>
                  <strong>Silver</strong> — Rp 1.000.000 s.d. &lt; Rp 10.000.000
                  <br />
                  Kuota pemenang per bulan (misal): 20 orang.
                  <br />
                  Hadiah promo: hingga ±2% (maks. contoh: Rp 150.000 per user).
                </li>
                <li style={{ marginTop: "0.5rem" }}>
                  <strong>Gold</strong> — Rp 10.000.000 s.d. &lt; Rp 50.000.000
                  <br />
                  Kuota pemenang per bulan (misal): 10 orang.
                  <br />
                  Hadiah promo: hingga ±3% (maks. contoh: Rp 600.000 per user).
                </li>
                <li style={{ marginTop: "0.5rem" }}>
                  <strong>Diamond</strong> — Rp 50.000.000 ke atas
                  <br />
                  Kuota pemenang per bulan (misal): 5 orang.
                  <br />
                  Hadiah promo: hingga ±5% (maks. contoh: Rp 1.500.000 per user).
                </li>
              </ul>

              <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                Detail kuota &amp; persentase di atas bisa diubah sewaktu-waktu
                oleh pengelola Dompet Nadnad, namun konsep utamanya tetap:{" "}
                <strong>dana pokok dikembalikan 30 hari</strong>, dan bonus
                hanya untuk sebagian peserta yang beruntung.
              </p>
            </div>
          </div>
        </section>

        {/* RIWAYAT IKUT PROMO USER INI */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Riwayat keikutsertaan promo kamu</h3>
            <p>
              Menampilkan event Balance Boost yang pernah kamu ikuti dari akun
              dan dompet ini.
            </p>
          </div>

          {entries.length === 0 ? (
            <p
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem" }}
            >
              Kamu belum pernah ikut event Balance Boost. Coba ikuti minimal
              satu event untuk melihat pola pengembalian harian ke Dompet
              Nadnad.
            </p>
          ) : (
            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {entries.map((e) => {
                const created = new Date(e.created_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const totalDays = e.total_bonus_days || 0;
                const daysSent = e.days_sent || 0;

                const sched =
                  totalDays > 0
                    ? `${daysSent} / ${totalDays} hari pengembalian`
                    : "Belum dijadwalkan admin";

                return (
                  <div key={e.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <strong>{tierLabel(e.tier)}</strong>
                      <br />
                      <small>{created}</small>
                      <br />
                      <small>{e.period_label || "-"}</small>
                    </div>
                    <div>
                      <p style={{ marginBottom: "0.25rem" }}>
                        Dana dikunci:
                        <br />
                        <strong>{formatCurrency(e.amount)}</strong>
                      </p>
                      <p style={{ fontSize: "0.78rem" }}>
                        Jadwal pengembalian:
                        <br />
                        <strong>{sched}</strong>
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        fontSize: "0.78rem",
                      }}
                    >
                      <span>
                        Status: <strong>{e.status}</strong>
                      </span>
                      <span>
                        Total bonus ditetapkan admin:{" "}
                        <strong>
                          {e.admin_bonus_amount
                            ? formatCurrency(e.admin_bonus_amount)
                            : "Belum ditentukan"}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Promo Balance Boost.
          </span>
          <span>
            Promo ini bersifat hadiah &amp; hiburan, bukan janji imbal hasil
            tetap. Dana pokok selalu dikembalikan ke dompet, sedangkan bonus
            hanya untuk sebagian peserta yang beruntung.
          </span>
        </footer>
      </div>
    </main>
  );
}
