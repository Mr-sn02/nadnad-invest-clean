// app/promo/balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

const TIERS = [
  {
    id: "BRONZE",
    name: "Bronze",
    rangeLabel: "Rp 100.000 – < Rp 1.000.000",
    min: 100_000,
    max: 999_999,
    winners: 30,
    bonusPercent: 1,
    bonusCap: 25_000,
  },
  {
    id: "SILVER",
    name: "Silver",
    rangeLabel: "Rp 1.000.000 – < Rp 10.000.000",
    min: 1_000_000,
    max: 9_999_999,
    winners: 20,
    bonusPercent: 2,
    bonusCap: 150_000,
  },
  {
    id: "GOLD",
    name: "Gold",
    rangeLabel: "Rp 10.000.000 – < Rp 50.000.000",
    min: 10_000_000,
    max: 49_999_999,
    winners: 10,
    bonusPercent: 3,
    bonusCap: 600_000,
  },
  {
    id: "DIAMOND",
    name: "Diamond",
    rangeLabel: "≥ Rp 50.000.000",
    min: 50_000_000,
    max: null, // tidak dibatasi
    winners: 5,
    bonusPercent: 5,
    bonusCap: 1_500_000,
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function PromoBalanceBoostPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedTierId, setSelectedTierId] = useState("BRONZE");
  const [amountStr, setAmountStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [myEntries, setMyEntries] = useState([]);

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

        // ambil dompet user
        const { data: walletRow, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Wallet error:", wErr.message);
          setErrorMsg(
            "Gagal memuat dompet utama. Pastikan tabel 'wallets' sudah ada."
          );
          return;
        }

        if (!walletRow) {
          setErrorMsg(
            "Dompet belum tersedia. Buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(walletRow);

        // ambil riwayat keikutsertaan promo user ini
        const { data: entries, error: eErr } = await supabase
          .from("promo_balance_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (eErr) {
          console.error("Load promo entries error:", eErr.message);
        } else {
          setMyEntries(entries || []);
        }
      } catch (err) {
        console.error("Promo init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const selectedTier = TIERS.find((t) => t.id === selectedTierId);

  const handleJoinPromo = async (e) => {
    e.preventDefault();
    if (!user || !wallet || !selectedTier) return;

    setErrorMsg("");

    const amount = Number(amountStr);
    if (!amount || amount <= 0) {
      setErrorMsg("Nominal setor wajib diisi dengan benar.");
      return;
    }

    if (amount < selectedTier.min) {
      setErrorMsg(
        `Nominal minimal untuk tier ${selectedTier.name} adalah ${formatCurrency(
          selectedTier.min
        )}.`
      );
      return;
    }

    if (selectedTier.max && amount > selectedTier.max) {
      setErrorMsg(
        `Nominal maksimal untuk tier ${selectedTier.name} adalah ${formatCurrency(
          selectedTier.max
        )}.`
      );
      return;
    }

    if ((wallet.balance || 0) < amount) {
      setErrorMsg(
        "Saldo dompet Dompet Nadnad kamu tidak cukup untuk setoran event ini."
      );
      return;
    }

    try {
      setSubmitting(true);

      // 1) update saldo dompet (potong setoran promo)
      const newBalance = (wallet.balance || 0) - amount;

      const { error: wUpdateErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (wUpdateErr) {
        console.error("Update wallet for promo error:", wUpdateErr.message);
        alert("Gagal memotong saldo dompet untuk event promo.");
        return;
      }

      // 2) catat transaksi di wallet_transactions
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: user.id,
        user_email: user.email,
        type: "PROMO_DEPOSIT",
        amount,
        status: "COMPLETED",
        note: `Setoran ikut event promo balance boost (${selectedTier.name})`,
        created_at: new Date().toISOString(),
      });

      if (txErr) {
        console.error("Insert wallet transaction (promo) error:", txErr);
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi. Cek manual di database."
        );
        // lanjut tetap buat entry promo supaya tidak berantakan
      }

      // 3) simpan entry promo
      const { error: entryErr } = await supabase
        .from("promo_balance_entries")
        .insert({
          user_id: user.id,
          user_email: user.email,
          wallet_id: wallet.id,
          tier: selectedTier.id,
          total_deposit: amount,
          status: "ACTIVE",
        });

      if (entryErr) {
        console.error("Insert promo entry error:", entryErr);
        alert(
          "Saldo sudah dipotong, tetapi gagal menyimpan keikutsertaan promo. Segera hubungi admin."
        );
      } else {
        alert(
          "Kamu berhasil ikut event promo. Setoran sudah dipotong dari dompet, dan admin dapat melihat datanya di panel promo."
        );
      }

      // refresh data wallet & entries
      setWallet((prev) => (prev ? { ...prev, balance: newBalance } : prev));

      const { data: entriesAfter, error: reloadErr } = await supabase
        .from("promo_balance_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!reloadErr) {
        setMyEntries(entriesAfter || []);
      }

      setAmountStr("");
    } catch (err) {
      console.error("Join promo error:", err);
      alert("Terjadi kesalahan saat memproses keikutsertaan promo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman promo Dompet Nadnad...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg && !wallet) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Promo error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal membuka halaman promo.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg}
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

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Event Promo · Balance Boost 30 Hari
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

        {/* Intro & saldo */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo 3 Bulan</p>
          <h1 className="nanad-dashboard-heading">
            Ikut event, setor dari Dompet Nadnad, dan nikmati peluang bonus harian.
          </h1>
          <p className="nanad-dashboard-body">
            Selama periode promo, kamu bisa setor dana dari Dompet Nadnad ke event
            ini. Dana tersebut akan dikembalikan bertahap ke dompet selama{" "}
            <strong>30 hari</strong>. Admin akan memilih pemenang bonus tiap tier,
            dan bonus tersebut juga dikembalikan ke dompet bersama cicilan harian.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun</p>
              <p className="nanad-dashboard-stat-number">{user?.email}</p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Saldo Dompet Nadnad (saat ini)
              </p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            </div>
          </div>
        </section>

        {/* Form ikut promo + tabel tier */}
        <section className="nanad-dashboard-table-section">
          {/* Kiri: form setor */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ikut event promo</h3>
              <p>
                Pilih tier sesuai nominal setoran, lalu setor menggunakan saldo
                Dompet Nadnad kamu.
              </p>
            </div>

            <form
              onSubmit={handleJoinPromo}
              className="nanad-dashboard-deposit-form"
            >
              <div className="nanad-dashboard-deposit-row">
                <label>
                  Pilih tier
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                  >
                    {TIERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.rangeLabel}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Nominal setoran event
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="contoh: 250000"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                  />
                </label>
              </div>

              {selectedTier && (
                <p
                  className="nanad-dashboard-body"
                  style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}
                >
                  Batas tier {selectedTier.name}:{" "}
                  <strong>{selectedTier.rangeLabel}</strong>. Bonus akan diundi
                  untuk peserta tier ini, dengan bonus maksimal{" "}
                  <strong>
                    {formatCurrency(selectedTier.bonusCap)} ({selectedTier.bonusPercent}
                    %)
                  </strong>{" "}
                  per pemenang.
                </p>
              )}

              {errorMsg && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.8rem" }}
                >
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Setor & Ikut Event"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Dana akan dipotong dari saldo Dompet Nadnad dan akan dikembalikan
                bertahap ke dompet selama 30 hari, bersama bonus (jika kamu terpilih
                sebagai pemenang di tier-mu). Semua pengembalian dilakukan{" "}
                <strong>oleh admin secara manual</strong> demi menghindari kecurangan.
              </p>
            </form>
          </div>

          {/* Kanan: info tier & riwayat ikut promo */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Struktur tier & peluang bonus</h3>
              <p>
                Bonus tidak dijanjikan ke semua peserta. Admin akan memilih pemenang
                tiap bulan, sehingga promo ini tetap berbentuk hadiah/undian internal.
              </p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {TIERS.map((t) => (
                <div key={t.id} className="nanad-dashboard-deposits-row">
                  <div>
                    <strong>{t.name}</strong>
                    <br />
                    <span style={{ fontSize: "0.78rem" }}>{t.rangeLabel}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem" }}>
                   
