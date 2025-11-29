// app/admin/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

const ADMIN_KEY = "Son887799";

// helper rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [adminInput, setAdminInput] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    totalTransactions: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const handleCheckAdmin = (e) => {
    e.preventDefault();
    if (!ADMIN_KEY) {
      alert(
        "NEXT_PUBLIC_NANAD_ADMIN_KEY belum diset di .env.local.\nSet dulu untuk mengamankan halaman admin."
      );
      return;
    }
    if (adminInput === ADMIN_KEY) {
      setAuthorized(true);
      setError("");
    } else {
      setAuthorized(false);
      setError("Admin key salah.");
    }
  };

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      // 1) Ambil semua wallet
      const { data: wallets, error: walletErr } = await supabase
        .from("wallets")
        .select("id,balance");

      if (walletErr) throw walletErr;

      const totalWallets = wallets?.length || 0;
      const totalBalance = (wallets || []).reduce(
        (sum, w) => sum + (w.balance ?? 0),
        0
      );

      // 2) Ambil transaksi (dibatasi 500 dulu)
      const { data: txs, error: txErr } = await supabase
        .from("wallet_transactions")
        .select("id,status,type,amount")
        .order("created_at", { ascending: false })
        .limit(500);

      if (txErr) throw txErr;

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      (txs || []).forEach((tx) => {
        if (tx.status === "PENDING") pending++;
        else if (tx.status === "APPROVED" || tx.status === "COMPLETED")
          approved++;
        else if (tx.status === "REJECTED") rejected++;
      });

      setStats({
        totalWallets,
        totalBalance,
        totalTransactions: txs?.length || 0,
        pending,
        approved,
        rejected,
      });
    } catch (err) {
      console.error("Load admin stats error:", err);
      setError("Gagal memuat ringkasan admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      loadStats();
    }
  }, [authorized]);

  // Belum authorized → minta admin key dulu
  if (!authorized) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Admin area</p>
            <h1 className="nanad-dashboard-heading">
              Masuk ke panel admin Nanad Invest.
            </h1>
            <p className="nanad-dashboard-body">
              Masukkan admin key sementara untuk mengakses ringkasan wallet dan
              transaksi. Hanya untuk penggunaan internal.
            </p>

            <form
              onSubmit={handleCheckAdmin}
              style={{ marginTop: "1rem", maxWidth: "320px" }}
            >
              <label className="nanad-dashboard-deposit-amount">
                Admin key
                <input
                  type="password"
                  value={adminInput}
                  onChange={(e) => setAdminInput(e.target.value)}
                  placeholder="••••••••••"
                />
              </label>
              {error && (
                <p
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#fecaca",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                style={{ marginTop: "0.75rem" }}
              >
                Masuk admin
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  // Sudah authorized → tampilkan dashboard admin
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
                Admin · Ringkasan sistem
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/admin/transactions")}
            >
              Kelola transaksi
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/")}
            >
              Kembali ke dashboard user
            </button>
          </div>
        </header>

        {/* Ringkasan utama */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">System overview</p>
          <h1 className="nanad-dashboard-heading">
            Panorama singkat Nanad Invest.
          </h1>
          <p className="nanad-dashboard-body">
            Lihat total saldo yang tercatat, jumlah wallet yang aktif, dan
            komposisi status transaksi di platform ini.
          </p>

          {loading ? (
            <p className="nanad-dashboard-body">Memuat ringkasan...</p>
          ) : (
            <>
              <div className="nanad-dashboard-stat-grid">
                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">
                    Total saldo tercatat
                  </p>
                  <p className="nanad-dashboard-stat-number">
                    {formatCurrency(stats.totalBalance)}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Akumulasi dari seluruh baris di tabel <code>wallets</code>.
                  </p>
                </div>

                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">
                    Jumlah wallet aktif
                  </p>
                  <p className="nanad-dashboard-stat-number">
                    {stats.totalWallets}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Satu wallet biasanya mewakili satu akun user.
                  </p>
                </div>

                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">
                    Total transaksi (max 500 terakhir)
                  </p>
                  <p className="nanad-dashboard-stat-number">
                    {stats.totalTransactions}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Diambil dari tabel <code>wallet_transactions</code>.
                  </p>
                </div>
              </div>

              {/* Breakdown status */}
              <div
                className="nanad-dashboard-stat-grid"
                style={{ marginTop: "1.25rem" }}
              >
                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">
                    Transaksi PENDING
                  </p>
                  <p className="nanad-dashboard-stat-number">
                    {stats.pending}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Menunggu tindakan admin di halaman{" "}
                    <code>/admin/transactions</code>.
                  </p>
                </div>
                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">
                    Disetujui / selesai
                  </p>
                  <p className="nanad-dashboard-stat-number">
                    {stats.approved}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Berisi status <code>APPROVED</code> atau{" "}
                    <code>COMPLETED</code>.
                  </p>
                </div>
                <div className="nanad-dashboard-stat-card">
                  <p className="nanad-dashboard-stat-label">Ditolak</p>
                  <p className="nanad-dashboard-stat-number">
                    {stats.rejected}
                  </p>
                  <p className="nanad-dashboard-body" style={{ fontSize: 12 }}>
                    Pengajuan yang dibatalkan / tidak lolos verifikasi.
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Catatan legal kecil */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Admin internal view.
          </span>
          <span>
            Data ini bersifat simulasi/pengembangan. Untuk operasi keuangan
            sebenarnya, tetap wajib mengikuti regulasi dan audit resmi.
          </span>
        </footer>
      </div>
    </main>
  );
}
