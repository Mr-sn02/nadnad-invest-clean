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
    depositTotal: 1200000, // Rp 100.000 x 12 hari (disetarakan 1 bulan)
    durationLabel: "1 bulan (12× setoran Rp 100.000)",
    returnPercent: 20, // hanya asumsi contoh
    durationMonths: 1,
    monthlyAmount: 1200000,
    planNameSuggestion: "Simulasi harian 12×100k",
  },
  {
    id: "weekly-8",
    name: "Paket Mingguan Contoh",
    description:
      "Ilustrasi tabungan mingguan selama 3 bulan untuk tujuan jangka pendek.",
    depositTotal: 600000, // 3 bulan × 200.000
    durationLabel: "3 bulan (setoran Rp 200.000 per bulan)",
    returnPercent: 8,
    durationMonths: 3,
    monthlyAmount: 200000,
    planNameSuggestion: "Tabungan 3 bulan · 200k/bulan",
  },
  {
    id: "monthly-10",
    name: "Paket Bulanan Contoh",
    description: "Contoh target tahunan dengan setoran bulanan tetap.",
    depositTotal: 2400000, // 12 bulan × 200.000
    durationLabel: "12 bulan (setoran Rp 200.000 per bulan)",
    returnPercent: 10,
    durationMonths: 12,
    monthlyAmount: 200000,
    planNameSuggestion: "Rencana 1 tahun · 200k/bulan",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  // ==== STATE ==== //
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // form bikin rencana
  const [planName, setPlanName] = useState("");
  const [planDuration, setPlanDuration] = useState("");
  const [planMonthly, setPlanMonthly] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  // tabungan / setoran
  const [depositTotals, setDepositTotals] = useState({});
  const [deposits, setDeposits] = useState([]); // riwayat setoran
  const [depositPlanId, setDepositPlanId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [depositError, setDepositError] = useState("");

  // filter riwayat
  const [historyFilterPlanId, setHistoryFilterPlanId] = useState("");

  // ==== RINGKASAN TOTAL ==== //
  const totalSaved = Object.values(depositTotals).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );

  const totalTarget = plans.reduce(
    (acc, plan) => acc + (Number(plan.final_estimate) || 0),
    0
  );

  // ==== CEK USER & LOAD DATA ==== //
  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user || error) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");
      setUserId(user.id);
      setLoadingUser(false);

      await loadPlansAndDeposits(user.id);
    };

    checkUserAndLoad();
  }, [router]);

  async function loadPlansAndDeposits(uid) {
    setLoadingPlans(true);

    // rencana
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select("id, name, duration_months, monthly_amount, final_estimate")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (planError) {
      console.error("Error loading plans:", planError);
      setPlans([]);
    } else {
      setPlans(planData || []);
    }

    // setoran
    const { data: depositRows, error: depError } = await supabase
      .from("plan_deposits")
      .select("id, plan_id, amount, note, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (depError) {
      console.error("Error loading deposits:", depError);
      setDepositTotals({});
      setDeposits([]);
    } else {
      const totals = {};
      (depositRows || []).forEach((row) => {
        const amt = Number(row.amount) || 0;
        totals[row.plan_id] = (totals[row.plan_id] || 0) + amt;
      });
      setDepositTotals(totals);
      setDeposits(depositRows || []);
    }

    setLoadingPlans(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // tambah rencana
  async function handleAddPlan(e) {
    e.preventDefault();
    if (!userId) return;

    setPlanError("");

    if (!planName || !planDuration || !planMonthly) {
      setPlanError("Lengkapi nama rencana, durasi, dan setoran bulanan.");
      return;
    }

    const duration = parseInt(planDuration, 10);
    const monthly = parseFloat(
      planMonthly.replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(duration) || isNaN(monthly)) {
      setPlanError("Durasi & setoran bulanan harus berupa angka.");
      return;
    }

    const finalEstimate = duration * monthly;

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
    await loadPlansAndDeposits(userId);
  }

  // hapus rencana
  async function handleDeletePlan(id) {
    if (!userId) return;

    const confirmDelete = window.confirm(
      "Hapus rencana ini dari Nanad Invest?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("plans").delete().eq("id", id);

    if (error) {
      console.error("Error deleting plan:", error);
      return;
    }

    await loadPlansAndDeposits(userId);
  }

  // catat setoran
  async function handleAddDeposit(e) {
    e.preventDefault();
    if (!userId) return;

    setDepositError("");

    if (!depositPlanId || !depositAmount) {
      setDepositError("Pilih rencana & isi nominal setoran.");
      return;
    }

    const amount = parseFloat(
      depositAmount.replace(/\./g, "").replace(",", ".")
    );

    if (isNaN(amount) || amount <= 0) {
      setDepositError("Nominal setoran harus berupa angka positif.");
      return;
    }

    setSavingDeposit(true);

    const { error } = await supabase.from("plan_deposits").insert({
      user_id: userId,
      plan_id: depositPlanId,
      amount,
      note: depositNote || null,
    });

    setSavingDeposit(false);

    if (error) {
      console.error("Error adding deposit:", error);
      setDepositError(error.message || "Gagal mencatat setoran.");
      return;
    }

    setDepositAmount("");
    setDepositNote("");
    await loadPlansAndDeposits(userId);
  }

  // hapus setoran (riwayat)
  async function handleDeleteDeposit(id) {
    if (!userId) return;

    const ok = window.confirm("Hapus setoran ini dari riwayat?");
    if (!ok) return;

    const { error } = await supabase
      .from("plan_deposits")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting deposit:", error);
      return;
    }

    await loadPlansAndDeposits(userId);
  }

  // isi form rencana dari paket simulasi
  function handleUsePackage(pkg) {
    if (!pkg) return;
    setPlanName(pkg.planNameSuggestion || pkg.name);
    setPlanDuration(String(pkg.durationMonths || ""));
    setPlanMonthly(String(pkg.monthlyAmount || ""));
  }

  // klik "Setor" dari tabel rencana → pilih rencana & scroll ke form
  function handleQuickDeposit(planId) {
    setDepositPlanId(planId);
    setDepositError("");
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const el = document.getElementById("nanad-deposit-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    }
  }

  // export riwayat ke CSV (pakai filter yang aktif)
  function handleExportHistoryCsv(filtered) {
    const rows = filtered || [];

    if (!rows.length) {
      alert("Belum ada data setoran untuk diekspor.");
      return;
    }

    const csvRows = [];
    csvRows.push(["Tanggal", "Rencana", "Nominal", "Catatan"]);

    rows.forEach((dep) => {
      const planNameLabel =
        plans.find((p) => p.id === dep.plan_id)?.name ||
        "Rencana dihapus";

      const dateLabel = dep.created_at
        ? new Date(dep.created_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-";

      csvRows.push([
        dateLabel,
        planNameLabel,
        Number(dep.amount).toLocaleString("id-ID", {
          maximumFractionDigits: 0,
        }),
        dep.note || "",
      ]);
    });

    const csvContent = csvRows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      "nanad-invest-riwayat-setoran.csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // filter riwayat yang ditampilkan
  const filteredHistory = historyFilterPlanId
    ? deposits.filter((d) => d.plan_id === historyFilterPlanId)
    : deposits;

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
              Uangmu tetap berada di rekening atau e-wallet milikmu — Nanad
              Invest hanya membantu mencatat dan memvisualisasikan rencana.
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
                Rp{" "}
                {totalSaved.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="nanad-dashboard-stat-label">
                Total ditabung (semua rencana)
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-number">
                Rp{" "}
                {totalTarget.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="nanad-dashboard-stat-label">
                Total target (perkiraan)
              </p>
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
              Versi selanjutnya dapat menghadirkan grafik pertumbuhan, catatan
              emosi saat berinvestasi, insight berkala, serta pengelompokan
              rencana berdasarkan prioritas.
            </p>
          </article>
        </section>

        {/* KARTU RENCANA + FORM + TABUNGAN */}
        <section className="nanad-dashboard-plan">
          <div className="nanad-dashboard-plan-header">
            <div>
              <p className="nanad-dashboard-eyebrow">
                Rencana simpanan &amp; investasi
              </p>
              <h2>Rencana yang kamu susun di Nanad Invest</h2>
              <p>
                Rencana di bawah ini tersimpan untuk akunmu. Uang fisik tetap
                berada di rekening/ewallet kamu; Nanad Invest hanya mencatat
                dan menampilkan progres tabunganmu.
              </p>
            </div>
          </div>

          {/* TABEL RENCANA */}
          <div className="nanad-dashboard-table">
            <div className="nanad-dashboard-table-header">
              <div>Nama rencana</div>
              <div>Durasi</div>
              <div>Setoran bulanan</div>
              <div>Progres tabungan</div>
              <div>Aksi</div>
            </div>

            {loadingPlans ? (
              <div className="nanad-dashboard-table-row">
                <div>Memuat rencana...</div>
                <div></div>
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
                <div>-</div>
              </div>
            ) : (
              plans.map((plan) => {
                const saved = depositTotals[plan.id] || 0;
                const target = Number(plan.final_estimate) || 0;
                const pct =
                  target > 0 ? Math.min(100, (saved / target) * 100) : 0;

                return (
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
                      <div>
                        Rp{" "}
                        {saved.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        / ± Rp{" "}
                        {target.toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="nanad-dashboard-progress-bar">
                        <div
                          className="nanad-dashboard-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="nanad-dashboard-plan-actions">
                        <button
                          type="button"
                          className="nanad-dashboard-plan-quick"
                          onClick={() => handleQuickDeposit(plan.id)}
                        >
                          Setor
                        </button>
                        <button
                          type="button"
                          className="nanad-dashboard-plan-delete"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="nanad-dashboard-plan-footnote">
            Estimasi target saat ini masih perhitungan kasar (durasi × setoran
            bulanan). Kedepan bisa disesuaikan dengan asumsi imbal hasil dan
            profil risiko yang lebih detail.
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

          {/* FORM CATAT SETORAN */}
          <form
            id="nanad-deposit-section"
            className="nanad-dashboard-deposit-form"
            onSubmit={handleAddDeposit}
          >
            <h3>Catat setoran tabungan</h3>
            <p className="nanad-dashboard-deposit-caption">
              Uang tetap berada di rekening atau e-wallet kamu. Fitur ini hanya
              membantu mencatat setoran supaya progres rencana terlihat rapi.
            </p>
            <div className="nanad-dashboard-deposit-grid">
              <div className="nanad-dashboard-deposit-field">
                <label>Pilih rencana</label>
                <select
                  value={depositPlanId}
                  onChange={(e) => setDepositPlanId(e.target.value)}
                >
                  <option value="">Pilih salah satu</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="nanad-dashboard-deposit-field">
                <label>Nominal setoran (Rp)</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Misal: 100000"
                />
              </div>
              <div className="nanad-dashboard-deposit-field">
                <label>Catatan (opsional)</label>
                <input
                  type="text"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  placeholder="Misal: dari gaji bulan ini"
                />
              </div>
            </div>

            {depositError && (
              <p className="nanad-dashboard-deposit-error">
                {depositError}
              </p>
            )}

            <button
              type="submit"
              className="nanad-dashboard-deposit-submit"
              disabled={savingDeposit || plans.length === 0}
            >
              {savingDeposit ? "Mencatat..." : "Catat setoran"}
            </button>
          </form>

          {/* RIWAYAT SETORAN TERBARU */}
          {deposits.length > 0 && (
            <div className="nanad-dashboard-deposits-history">
              <h3>Riwayat setoran terbaru</h3>

              <div className="nanad-dashboard-deposits-filter">
                <span>Filter rencana:</span>
                <select
                  value={historyFilterPlanId}
                  onChange={(e) =>
                    setHistoryFilterPlanId(e.target.value)
                  }
                >
                  <option value="">Semua rencana</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="nanad-dashboard-deposits-export"
                  onClick={() => handleExportHistoryCsv(filteredHistory)}
                >
                  Export CSV
                </button>
              </div>

              <div className="nanad-dashboard-deposits-table">
                <div className="nanad-dashboard-deposits-header">
                  <div>Tanggal</div>
                  <div>Rencana</div>
                  <div>Nominal</div>
                  <div>Catatan</div>
                  <div>Aksi</div>
                </div>
                {filteredHistory.slice(0, 10).map((dep) => {
                  const planNameLabel =
                    plans.find((p) => p.id === dep.plan_id)?.name ||
                    "Rencana dihapus";

                  const dateLabel = dep.created_at
                    ? new Date(dep.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-";

                  return (
                    <div
                      key={dep.id}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>{dateLabel}</div>
                      <div>{planNameLabel}</div>
                      <div>
                        Rp{" "}
                        {Number(dep.amount).toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div>{dep.note || "-"}</div>
                      <div>
                        <button
                          type="button"
                          className="nanad-dashboard-deposit-delete"
                          onClick={() => handleDeleteDeposit(dep.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="nanad-dashboard-deposits-footnote">
                Hanya menampilkan beberapa setoran terakhir. Riwayat lengkap
                bisa dikembangkan pada versi berikutnya.
              </p>
            </div>
          )}
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

                  <button
                    type="button"
                    className="nanad-dashboard-package-use"
                    onClick={() => handleUsePackage(pkg)}
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
      </div>
    </main>
  );
}
