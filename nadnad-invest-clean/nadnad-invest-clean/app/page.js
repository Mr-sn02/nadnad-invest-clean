"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

// === Paket simulasi contoh ===
const examplePackages = [
  {
    id: "daily-20",
    name: "Paket Harian Contoh",
    description:
      "Setoran harian kecil untuk melihat pola pertumbuhan jangka sangat pendek.",
    depositTotal: 1200000, // Rp 100.000 x 12 hari
    durationLabel: "12 hari (setoran Rp 100.000 per hari)",
    returnPercent: 20, // asumsi 20% total, hanya contoh
  },
  {
    id: "weekly-8",
    name: "Paket Mingguan Contoh",
    description:
      "Ilustrasi tabungan mingguan selama 3 bulan untuk tujuan jangka pendek.",
    depositTotal: 600000, // contoh: Rp 150.000 x 4 minggu (bisa diubah)
    durationLabel: "3 bulan (setoran Rp 150.000 per minggu)",
    returnPercent: 8,
  },
  {
    id: "monthly-10",
    name: "Paket Bulanan Contoh",
    description: "Contoh target tahunan dengan setoran bulanan tetap.",
    depositTotal: 2400000, // Rp 200.000 x 12 bulan
    durationLabel: "12 bulan (setoran Rp 200.000 per bulan)",
    returnPercent: 10,
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [planName, setPlanName] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planMonthly, setPlanMonthly] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  // cek user + load rencana
  useEffect(() => {
    const checkUserAndLoadPlans = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user || error) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");
      setUserId(user.id);
      setLoadingUser(false);

      await loadPlans(user.id);
    };

    checkUserAndLoadPlans();
  }, [router]);

  async function loadPlans(uid) {
    setLoadingPlans(true);

    const { data, error } = await supabase
      .from("plans")
      .select("id, name, duration_months, monthly_amount, final_estimate")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading plans:", error);
      setPlans([]);
    } else {
      setPlans(data || []);
    }

    setLoadingPlans(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleAddPlan(e) {
    e.preventDefault();
    if (!userId) return;

    setPlanError("");

    if (!planName || !planDuration || !planMonthly) {
      setPlanError("Lengkapi nama rencana, durasi, dan setoran bulanan.");
      return;
    }

    const duration = parseInt(planDuration, 10);
    // boleh tulis 750000 atau 750.000
    const monthly = parseFloat(
      planMonthly.replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(duration) || isNaN(monthly)) {
      setPlanError("Durasi & setoran bulanan harus berupa angka.");
      return;
    }

    const finalEstimate = duration * monthly; // perhitungan kasar dulu

    setSavingPlan(true);

    const { error } = await supabase.from("plans").insert({
      user_id: userId,
      name: planName,
      duration_months: duration,
      monthly_amount: monthly,
      final_estimate: finalEstimate,
    });

    setSavingPlan(false);

    if (error) {
      console.error("Error adding plan:", error);
      setPlanError(error.message || "Gagal menyimpan rencana.");
      return;
    }

    setPlanName("");
    setPlanDuration("");
    setPlanMonthly("");
    await loadPlans(userId);
  }

  if (loadingUser) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
            Memuat dashboard Nanad Invest...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER ATAS */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-header-left">
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
              <span className="nanad-dashboard-account-label">
                Akun aktif
              </span>
              <span className="nanad-dashboard-account-email">
                {userEmail || "-"}
              </span>
            </div>

            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* RINGKASAN SELAMAT DATANG */}
        <section className="nanad-dashboard-welcome">
          <div>
            <p className="nanad-dashboard-eyebrow">
              Welcome to your plan space
            </p>
            <h1 className="nanad-dashboard-heading">
              Selamat datang di ruang rencana finansial yang rapi.
            </h1>
            <p className="nanad-dashboard-text">
              Satu dasbor untuk menyusun tujuan, mensimulasikan setoran, dan
              memantau progresmu tanpa pusing lihat angka di banyak tempat.
              Data rencana disimpan rapi, bisa kamu ubah kapan saja, dan tidak
              langsung terhubung ke instrumen — aman untuk eksplorasi bersama
              Nanad Invest.
            </p>
          </div>

          <div className="nanad-dashboard-stats">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-number">
                {plans.length || 0}
              </p>
              <p className="nanad-dashboard-stat-label">
                Rencana tersimpan
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-number">
                {plans.length > 0 ? 2 : 0}
              </p>
              <p className="nanad-dashboard-stat-label">
                Kategori (contoh)
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-number">Demo</p>
              <p className="nanad-dashboard-stat-label">Mode saat ini</p>
            </div>
          </div>
        </section>

        {/* TIGA KARTU PENJELASAN */}
        <section className="nanad-dashboard-grid">
          <article className="nanad-dashboard-card">
            <h2>Identitas kamu</h2>
            <p>
              Email ini akan dipakai untuk menyimpan preferensi default, lokasi
              rencana, dan riwayat perjalanan finansialmu di Nanad Invest versi
              berikutnya. Di tahap ini, kamu masih berada di mode demo yang
              fokus ke simulasi dan perapian rencana.
            </p>
          </article>

          <article className="nanad-dashboard-card">
            <h2>Target dana &amp; unggahan</h2>
            <p>
              Nantinya kamu bisa menetapkan target dana untuk berbagai tujuan:
              dana darurat, pendidikan, rumah, atau pensiun. Dashboard akan
              membantu menghitung kisaran setoran bulanan, timeline, dan
              progres yang perlu kamu kejar untuk tiap tujuan tersebut.
            </p>
          </article>

          <article className="nanad-dashboard-card">
            <h2>Kenapa dashboard ini akan berkembang?</h2>
            <p>
              Versi selanjutnya akan menghadirkan grafik pertumbuhan, catatan
              emosi saat berinvestasi, insight berkala, serta pengelompokan
              rencana berdasarkan prioritas. Tujuannya: membantumu mengambil
              keputusan finansial dengan lebih tenang dan terukur.
            </p>
          </article>
        </section>

        {/* KARTU RENCANA + FORM */}
        <section className="nanad-dashboard-plan">
          <div className="nanad-dashboard-plan-header">
            <div>
              <p className="nanad-dashboard-eyebrow">
                Rencana simpanan &amp; investasi
              </p>
              <h2>Rencana yang kamu susun di Nanad Invest</h2>
              <p>
                Rencana di bawah ini tersimpan untuk akunmu. Kamu bisa menambah
                rencana baru kapan saja, misalnya dana darurat, DP rumah, atau
                pendidikan anak.
              </p>
            </div>
          </div>

          <div className="nanad-dashboard-table">
            <div className="nanad-dashboard-table-header">
              <div>Nama rencana</div>
              <div>Durasi</div>
              <div>Setoran bulanan</div>
              <div>Estimasi dana akhir</div>
            </div>

            {loadingPlans ? (
              <div className="nanad-dashboard-table-row">
                <div>Memuat rencana...</div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : plans.length === 0 ? (
              <div className="nanad-dashboard-table-row">
                <div>Belum ada rencana</div>
                <div>-</div>
                <div>-</div>
                <div>-</div>
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  className="nanad-dashboard-table-row"
                  key={plan.id}
                >
                  <div>{plan.name}</div>
                  <div>{plan.duration_months} bulan</div>
                  <div>
                    Rp{" "}
                    {Number(plan.monthly_amount).toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div>
                    ± Rp{" "}
                    {Number(plan.final_estimate).toLocaleString("id-ID", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="nanad-dashboard-plan-footnote">
            Estimasi dana akhir saat ini masih perhitungan kasar (durasi ×
            setoran bulanan). Ke depan, rumusnya bisa disesuaikan dengan asumsi
            imbal hasil dan profil risiko.
          </p>

          {/* FORM TAMBAH RENCANA */}
          <form
            className="nanad-dashboard-plan-form"
            onSubmit={handleAddPlan}
          >
            <h3>Tambah rencana baru</h3>
            <div className="nanad-dashboard-plan-form-grid">
              <div className="nanad-dashboard-plan-form-field">
                <label>Nama rencana</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Misal: Dana darurat, DP rumah, Pendidikan anak"
                />
              </div>
              <div className="nanad-dashboard-plan-form-field">
                <label>Durasi (bulan)</label>
                <input
                  type="number"
                  min="1"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value)}
                  placeholder="Misal: 36"
                />
              </div>
              <div className="nanad-dashboard-plan-form-field">
                <label>Setoran bulanan (Rp)</label>
                <input
                  type="text"
                  value={planMonthly}
                  onChange={(e) => setPlanMonthly(e.target.value)}
                  placeholder="Misal: 750000"
                />
              </div>
            </div>

            {planError && (
              <p className="nanad-dashboard-plan-error">{planError}</p>
            )}

            <button
              type="submit"
              className="nanad-dashboard-plan-submit"
              disabled={savingPlan}
            >
              {savingPlan ? "Menyimpan..." : "Simpan rencana"}
            </button>
          </form>
        </section>

        {/* SIMULASI PAKET */}
        <section className="nanad-dashboard-packages">
          <div className="nanad-dashboard-packages-header">
            <p className="nanad-dashboard-eyebrow">
              Simulasi paket setoran rutin
            </p>
            <h2>Paket contoh untuk memahami pola setoran &amp; hasil</h2>
            <p>
              Angka di bawah hanyalah perumpamaan. Kamu bisa memakai paket ini
              untuk membayangkan skenario, bukan sebagai janji keuntungan atau
              rekomendasi produk investasi tertentu.
            </p>
          </div>

          <div className="nanad-dashboard-packages-grid">
            {examplePackages.map((pkg) => {
              const profit =
                (pkg.depositTotal * pkg.returnPercent) / 100;
              const total = pkg.depositTotal + profit;

              return (
                <article
                  key={pkg.id}
                  className="nanad-dashboard-package-card"
                >
                  <div className="nanad-dashboard-package-card-header">
                    <h3 className="nanad-dashboard-package-name">
                      {pkg.name}
                    </h3>
                    <span className="nanad-dashboard-package-badge">
                      Asumsi {pkg.returnPercent}% total
                    </span>
                  </div>

                  <p className="nanad-dashboard-package-desc">
                    {pkg.description}
                  </p>

                  <dl className="nanad-dashboard-package-rows">
                    <div className="nanad-dashboard-package-row">
                      <dt>Durasi simulasi</dt>
                      <dd>{pkg.durationLabel}</dd>
                    </div>
                    <div className="nanad-dashboard-package-row">
                      <dt>Total setoran</dt>
                      <dd>
                        Rp{" "}
                        {pkg.depositTotal.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </dd>
                    </div>
                    <div className="nanad-dashboard-package-row">
                      <dt>Perkiraan hasil tambahan</dt>
                      <dd>
                        Rp{" "}
                        {profit.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </dd>
                    </div>
                    <div className="nanad-dashboard-package-row">
                      <dt>Perkiraan total nilai akhir</dt>
                      <dd>
                        Rp{" "}
                        {total.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </dd>
                    </div>
                  </dl>

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
      </div>
    </main>
  );
}
