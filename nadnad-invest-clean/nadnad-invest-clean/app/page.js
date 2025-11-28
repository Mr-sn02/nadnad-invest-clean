// app/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

// === Paket simulasi contoh (ILUSTRASI SAJA) ====================
const examplePackages = [
  {
    id: "daily-20",
    name: "Paket Harian Contoh",
    description:
      "Setoran harian kecil untuk melihat pola pertumbuhan jangka sangat pendek.",
    depositTotal: 1200000, // Rp 100.000 x 12 hari
    durationLabel: "12 hari (setoran Rp 100.000 per hari)",
    returnPercent: 20, // asumsi 20% total, hanya contoh
    note: "Ini hanya contoh asumsi. Imbal hasil nyata akan bergantung instrumen yang kamu pilih dan tidak pernah bisa dijamin.",
    badge: "Asumsi 20% total",
  },
  {
    id: "weekly-8",
    name: "Paket Mingguan Contoh",
    description:
      "Ilustrasi tabungan mingguan selama 3 bulan untuk tujuan jangka pendek.",
    depositTotal: 2400000, // Rp 200.000 x 12 minggu
    durationLabel: "12 minggu (setoran Rp 200.000 per minggu)",
    returnPercent: 8,
    note: "Tujuannya membantu berpikir soal konsistensi setoran, bukan menawarkan produk tertentu.",
    badge: "Asumsi 8% total",
  },
  {
    id: "monthly-10",
    name: "Paket Bulanan Contoh",
    description: "Contoh target tahunan dengan setoran bulanan tetap.",
    depositTotal: 2400000, // Rp 200.000 per bulan x 12 bulan
    durationLabel: "12 bulan (setoran Rp 200.000 per bulan)",
    returnPercent: 10,
    note: "Angka ini tidak mencerminkan produk nyata. Hanya ilustrasi untuk membantumu memetakan rencana.",
    badge: "Asumsi 10% total",
  },
];

// Helper format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function DashboardPage() {
  const router = useRouter();

  // === STATE USER & LOADING ===================================
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // === STATE RENCANA ==========================================
  const [plans, setPlans] = useState([
    {
      id: "emergency",
      name: "Dana darurat",
      category: "Keamanan",
      targetAmount: 10000000,
      savedAmount: 3000000,
      note: "Cadangan minimal 3–6 bulan pengeluaran bulanan.",
    },
    {
      id: "house",
      name: "DP rumah",
      category: "Aset",
      targetAmount: 15000000,
      savedAmount: 3000000,
      note: "Target jangka menengah, bisa dipecah menjadi beberapa sub-target.",
    },
    {
      id: "holiday",
      name: "Liburan keluarga",
      category: "Gaya hidup",
      targetAmount: 5000000,
      savedAmount: 1500000,
      note: "Rencana refreshing tanpa mengganggu dana darurat.",
    },
  ]);

  // === STATE SETORAN / TABUNGAN ===============================
  const [deposits, setDeposits] = useState([
    {
      id: 1,
      date: "2025-11-20",
      planId: "emergency",
      planName: "Dana darurat",
      amount: 250000,
    },
    {
      id: 2,
      date: "2025-11-18",
      planId: "house",
      planName: "DP rumah",
      amount: 500000,
    },
  ]);

  // Form setoran baru
  const [newDepositDate, setNewDepositDate] = useState("");
  theconst [newDepositPlanId, setNewDepositPlanId] = useState("emergency");
  const [newDepositAmount, setNewDepositAmount] = useState("");

  // === STATE SALDO DOMPET (diambil dari tabel wallets) ========
  const [walletBalance, setWalletBalance] = useState(null);

  // === RINGKASAN TOTAL ========================================
  const totalTarget = plans.reduce((sum, p) => sum + (p.targetAmount || 0), 0);
  const totalSaved = plans.reduce((sum, p) => sum + (p.savedAmount || 0), 0);
  const overallProgress = totalTarget
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0;

  // === CEK USER SUPABASE + AMBIL SALDO DOMPET =================
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error getUser:", error.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || "");

        // === ambil saldo wallet dari tabel wallets ===
        try {
          const { data: wallet, error: walletErr } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", user.id)
            .maybeSingle();

          if (walletErr) {
            console.error("Error get wallet balance:", walletErr.message);
          }

          setWalletBalance(wallet?.balance ?? 0);
        } catch (e) {
          console.error("Unexpected wallet fetch error:", e);
        }
      } catch (err) {
        console.error("Unexpected error getUser:", err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signOut:", err);
    } finally {
      router.push("/login");
    }
  };

  // === LOGIC TAMBAH SETORAN ===================================
  const handleAddDeposit = (event) => {
    event.preventDefault();

    if (!newDepositPlanId || !newDepositDate || !newDepositAmount) {
      alert("Lengkapi tanggal, rencana, dan nominal setoran terlebih dahulu.");
      return;
    }

    const amount = Number(
      String(newDepositAmount).replace(/\./g, "").replace(/,/g, ".")
    );

    if (!amount || amount <= 0) {
      alert("Nominal setoran harus lebih besar dari 0.");
      return;
    }

    const plan = plans.find((p) => p.id === newDepositPlanId);
    if (!plan) {
      alert("Rencana tidak ditemukan.");
      return;
    }

    const newDeposit = {
      id: Date.now(),
      date: newDepositDate,
      planId: newDepositPlanId,
      planName: plan.name,
      amount,
    };

    setDeposits((prev) => [newDeposit, ...prev]);
    setPlans((prev) =>
      prev.map((p) =>
        p.id === newDepositPlanId
          ? { ...p, savedAmount: (p.savedAmount || 0) + amount }
          : p
      )
    );

    setNewDepositAmount("");
  };

  // === LOADING STATE ==========================================
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p style={{ fontSize: "0.9rem", color: "#e5e7eb" }}>
            Memuat dashboard Nanad Invest...
          </p>
        </div>
      </main>
    );
  }

  // === DASHBOARD UI ===========================================
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
                Gigana · Personal Planning Dashboard
              </p>
            </div>
          </div>

          <div className="nanad-dashboard-header-right">
            <span className="nanad-dashboard-demo-badge">Demo mode</span>
            <div className="nanad-dashboard-account">
              <span className="nanad-dashboard-account-label">Akun aktif</span>
              <span className="nanad-dashboard-account-email">
                {userEmail || "user@nanadinvest.app"}
              </span>
            </div>

            {/* Tombol Buka Wallet */}
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Buka Wallet
            </button>

            {/* Tombol Logout */}
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* WELCOME BLOCK */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">
            Welcome to your plan space
          </p>
          <h1 className="nanad-dashboard-heading">
            Selamat datang di ruang rencana finansial yang rapi.
          </h1>
          <p className="nanad-dashboard-body">
            Satu dasbor untuk menyusun tujuan, mensimulasikan setoran, dan
            memantau progresmu tanpa pusing lihat angka di banyak tempat. Data
            rencana disimpan rapi, bisa kamu ubah kapan saja. Uangmu tetap
            berada di rekening atau e-wallet milikmu — Nanad Invest hanya
            membantu mencatat dan memvisualisasikan rencana.
          </p>

          {/* STAT RINGKASAN */}
          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Rencana tersimpan</p>
              <p className="nanad-dashboard-stat-number">{plans.length}</p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Total target</p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalTarget)}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Total ditabung (semua rencana)
              </p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalSaved)}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Perkiraan progres</p>
              <p className="nanad-dashboard-stat-number">
                {overallProgress}%
              </p>
            </div>

            {/* Kartu saldo dompet */}
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Saldo dompet (mode dev)
              </p>
              <p className="nanad-dashboard-stat-number">
                {walletBalance == null
                  ? "—"
                  : formatCurrency(walletBalance)}
              </p>
            </div>
          </div>
        </section>

        {/* IDENTITAS / PENJELASAN */}
        <section className="nanad-dashboard-plan">
          <h2 className="nanad-dashboard-section-title">Identitas kamu</h2>
          <p className="nanad-dashboard-body">
            Email ini akan dipakai untuk menyimpan preferensi default, lokasi
            rencana, dan riwayat perencanaan finansialmu di Nanad Invest
            berikutnya. Di mode demo seperti sekarang, datanya hanya fokus ke
            simulasi dan eksplorasi — kamu bebas mencoba menambah rencana,
            mengubah angka, atau menghapus tanpa konsekuensi ke rekening
            sebenarnya.
          </p>
        </section>

        {/* TABEL RENCANA + FORM SETORAN */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-table">
            <div className="nanad-dashboard-table-header">
              <h3>Ringkasan rencana</h3>
              <p>Melihat seberapa jauh progres tiap tujuan yang kamu simpan.</p>
            </div>

            <div className="nanad-dashboard-table-headrow">
              <div>Rencana</div>
              <div>Kategori</div>
              <div>Target</div>
              <div>Sudah ditabung</div>
              <div>Progres</div>
            </div>

            {plans.map((plan) => {
              const progress = plan.targetAmount
                ? Math.round((plan.savedAmount / plan.targetAmount) * 100)
                : 0;

              return (
                <div key={plan.id} className="nanad-dashboard-table-row">
                  <div>
                    <strong>{plan.name}</strong>
                    <p>{plan.note}</p>
                  </div>
                  <div>{plan.category}</div>
                  <div>{formatCurrency(plan.targetAmount)}</div>
                  <div>{formatCurrency(plan.savedAmount)}</div>
                  <div>{progress}%</div>
                </div>
              );
            })}
          </div>

          {/* FORM SETORAN + RIWAYAT */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catat setoran</h3>
              <p>
                Setiap kali menabung di bank/e-wallet, kamu bisa catat di sini
                agar progres rencana tetap terpantau.
              </p>
            </div>

            <form
              onSubmit={handleAddDeposit}
              className="nanad-dashboard-deposit-form"
            >
              <div className="nanad-dashboard-deposit-row">
                <label>
                  Tanggal
                  <input
                    type="date"
                    value={newDepositDate}
                    onChange={(e) => setNewDepositDate(e.target.value)}
                  />
                </label>
                <label>
                  Rencana
                  <select
                    value={newDepositPlanId}
                    onChange={(e) => setNewDepositPlanId(e.target.value)}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Nominal setoran
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="contoh: 100000"
                  value={newDepositAmount}
                  onChange={(e) => setNewDepositAmount(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
              >
                Simpan setoran
              </button>
            </form>

            <div className="nanad-dashboard-deposits-list">
              <h4>Riwayat setoran (contoh)</h4>
              {deposits.length === 0 ? (
                <p className="nanad-dashboard-body">
                  Belum ada setoran tercatat. Mulai dengan satu setoran kecil
                  untuk mencoba alurnya.
                </p>
              ) : (
                <div className="nanad-dashboard-deposits-rows">
                  {deposits.map((d) => (
                    <div
                      key={d.id}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>{d.date}</div>
                      <div>{d.planName}</div>
                      <div>{formatCurrency(d.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PAKET SIMULASI CONTOH */}
        <section className="nanad-dashboard-packages">
          <div className="nanad-dashboard-packages-header">
            <h2>Paket simulasi (contoh ilustrasi)</h2>
            <p>
              Angka berikut bukan penawaran produk investasi. Tujuannya membantu
              kamu membayangkan pola setoran dan pertumbuhan dana, sebelum
              memutuskan akan menggunakan instrumen apa di luar Nanad Invest.
            </p>
          </div>

          <div className="nanad-dashboard-packages-grid">
            {examplePackages.map((pack) => {
              const estimatedReturn =
                (pack.depositTotal * pack.returnPercent) / 100;
              const totalValue = pack.depositTotal + estimatedReturn;

              return (
                <article
                  key={pack.id}
                  className="nanad-dashboard-package-card"
                >
                  <header className="nanad-dashboard-package-header">
                    <div>
                      <h3>{pack.name}</h3>
                      <p>{pack.description}</p>
                    </div>
                    <span className="nanad-dashboard-package-badge">
                      {pack.badge}
                    </span>
                  </header>

                  <dl className="nanad-dashboard-package-meta">
                    <div>
                      <dt>Durasi simulasi</dt>
                      <dd>{pack.durationLabel}</dd>
                    </div>
                    <div>
                      <dt>Total setoran</dt>
                      <dd>{formatCurrency(pack.depositTotal)}</dd>
                    </div>
                    <div>
                      <dt>Perkiraan hasil tambahan</dt>
                      <dd>{formatCurrency(estimatedReturn)}</dd>
                    </div>
                    <div>
                      <dt>Perkiraan total nilai akhir</dt>
                      <dd>{formatCurrency(totalValue)}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    className="nanad-dashboard-package-cta"
                  >
                    Gunakan sebagai rencana
                  </button>

                  <p className="nanad-dashboard-package-note">
                    Catatan: ini hanya contoh asumsi. Imbal hasil nyata akan
                    tergantung instrumen yang kamu pilih dan tidak pernah bisa
                    dijamin.
                  </p>
                </article>
              );
            })}
          </div>

          <p className="nanad-dashboard-package-disclaimer">
            Fitur ini dimaksudkan sebagai alat bantu berpikir dan simulasi.
            Nanad Invest tidak menyalurkan dana dan tidak menjanjikan imbal
            hasil tertentu.
          </p>
        </section>

        {/* FOOTER RESMI DASHBOARD */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. All rights reserved.
          </span>
          <span>
            Dashboard ini digunakan untuk simulasi &amp; pencatatan rencana
            saja. Bukan platform penitipan dana dan bukan penyedia produk
            investasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
