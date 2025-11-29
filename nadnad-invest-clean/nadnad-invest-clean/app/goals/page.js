// app/goals/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

// helper format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function GoalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [goals, setGoals] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // form goal baru
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // penyesuaian nominal per-goal (map id → string)
  const [goalAdjust, setGoalAdjust] = useState({});

  const loadGoals = async (walletId) => {
    const { data, error } = await supabase
      .from("saving_goals")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error load goals:", error.message);
      setErrorMsg("Gagal memuat daftar tabungan / goals.");
      return;
    }

    setGoals(data || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) cek user login
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

        // 2) cari wallet milik user
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setErrorMsg(
            "Gagal memuat dompet utama. Pastikan tabel 'wallets' sudah dibuat."
          );
          return;
        }

        if (!existing) {
          setErrorMsg(
            "Dompet belum tersedia. Silakan buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(existing);
        await loadGoals(existing.id);
      } catch (err) {
        console.error("Goals init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman tabungan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    if (!newName.trim()) {
      alert("Nama tabungan / goal wajib diisi.");
      return;
    }

    const target = Number(newTarget) || 0;
    if (target <= 0) {
      alert("Target nominal sebaiknya lebih dari 0.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("saving_goals").insert({
        wallet_id: wallet.id,
        name: newName.trim(),
        target_amount: target,
        current_amount: 0,
        notes: newNotes.trim() || null,
        due_date: newDueDate || null,
        status: "ACTIVE",
      });

      if (error) {
        console.error("Create goal error:", error.message);
        alert("Gagal membuat tabungan / goal baru.");
        return;
      }

      setNewName("");
      setNewTarget("");
      setNewDueDate("");
      setNewNotes("");

      await loadGoals(wallet.id);
    } catch (err) {
      console.error("Create goal error:", err);
      alert("Terjadi kesalahan saat menyimpan goal.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustGoal = async (goal, mode) => {
    if (!wallet) return;

    const raw = goalAdjust[goal.id];
    const amount = Number(raw);

    if (!amount || amount <= 0) {
      alert("Nominal penyesuaian harus lebih besar dari 0.");
      return;
    }

    let newCurrent = goal.current_amount;

    if (mode === "ADD") {
      newCurrent = goal.current_amount + amount;
    } else if (mode === "SUB") {
      newCurrent = goal.current_amount - amount;
      if (newCurrent < 0) newCurrent = 0;
    }

    try {
      const { error } = await supabase
        .from("saving_goals")
        .update({
          current_amount: newCurrent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) {
        console.error("Update goal error:", error.message);
        alert("Gagal mengubah nominal tabungan.");
        return;
      }

      // kosongkan input untuk goal ini
      setGoalAdjust((prev) => ({ ...prev, [goal.id]: "" }));

      await loadGoals(wallet.id);
    } catch (err) {
      console.error("Adjust goal error:", err);
      alert("Terjadi kesalahan saat mengubah tabungan.");
    }
  };

  const handleMarkCompleted = async (goal) => {
    if (!confirm("Tandai goal ini sebagai selesai?")) return;

    try {
      const { error } = await supabase
        .from("saving_goals")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) {
        console.error("Mark completed error:", error.message);
        alert("Gagal menandai goal sebagai selesai.");
        return;
      }

      await loadGoals(wallet.id);
    } catch (err) {
      console.error("Mark completed error:", err);
      alert("Terjadi kesalahan saat memperbarui status goal.");
    }
  };

  const handleArchive = async (goal) => {
    if (
      !confirm(
        "Arsipkan goal ini? Goal yang diarsipkan tidak dihapus, hanya disembunyikan dari daftar utama."
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("saving_goals")
        .update({
          status: "ARCHIVED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) {
        console.error("Archive goal error:", error.message);
        alert("Gagal mengarsipkan goal.");
        return;
      }

      await loadGoals(wallet.id);
    } catch (err) {
      console.error("Archive goal error:", err);
      alert("Terjadi kesalahan saat mengarsipkan goal.");
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman Tabungan / Goals Nanad Invest...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Goals error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat tabungan &amp; goals.
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

  const activeGoals = goals.filter((g) => g.status !== "ARCHIVED");
  const totalTarget = activeGoals.reduce(
    (sum, g) => sum + (g.target_amount || 0),
    0
  );
  const totalSaved = activeGoals.reduce(
    (sum, g) => sum + (g.current_amount || 0),
    0
  );
  const overallPercent =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

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
                Tabungan &amp; Goals Khusus
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Kembali ke Wallet
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard utama
            </button>
          </div>
        </header>

        {/* Intro & ringkasan */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Saving buckets</p>
          <h1 className="nanad-dashboard-heading">
            Susun tabungan untuk tujuan-tujuan khusus kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Di sini kamu bisa membuat beberapa{" "}
            <strong>kantong tabungan (goals)</strong> seperti dana darurat, DP
            rumah, modal usaha, atau tujuan lain. Nominal di goals ini{" "}
            <strong>bersifat perencanaan</strong> dan tidak otomatis mengunci
            saldo dompet utama.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Saldo dompet utama (saat ini)
              </p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Total target semua goals aktif
              </p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalTarget)}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Total terkumpul (planning)
              </p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(totalSaved)}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.25rem", fontSize: "0.78rem" }}
              >
                Perkiraan progres keseluruhan sekitar{" "}
                <strong>{overallPercent}%</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Form buat goal baru + daftar goals */}
        <section className="nanad-dashboard-table-section">
          {/* Form goal baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Buat tabungan / goal baru</h3>
              <p>
                Misalnya: &quot;Dana Darurat&quot;, &quot;DP Rumah 2026&quot;,
                &quot;Modal Usaha Coffee Cart&quot;, atau tujuan lain yang ingin
                kamu capai.
              </p>
            </div>

            <form
              onSubmit={handleCreateGoal}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nama tabungan / goal
                <input
                  type="text"
                  placeholder="contoh: Dana Darurat 6x pengeluaran"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Target nominal
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    placeholder="contoh: 10000000"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                </label>
                <label>
                  Target waktu (opsional)
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Catatan (opsional)
                <input
                  type="text"
                  placeholder="contoh: Fokus isi 10% dari setiap bonus gaji"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="nanad-dashboard-deposit-submit"
              >
                {saving ? "Menyimpan..." : "Buat goal baru"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Catatan: angka di sini{" "}
                <strong>tidak mengurangi saldo</strong> dompet utama secara
                otomatis. Kamu tetap mengelola transfer nyata di rekening dan
                hanya menjadikan halaman ini sebagai panduan &amp; pencatatan.
              </p>
            </form>
          </div>

          {/* Daftar goals */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar tabungan &amp; goals kamu</h3>
              <p>
                Termasuk goals aktif dan yang sudah selesai. Goal berstatus{" "}
                <strong>ARCHIVED</strong> disembunyikan dari daftar ini.
              </p>
            </div>

            {activeGoals.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada goal tersimpan. Buat satu di panel sebelah kiri untuk
                mulai merencanakan.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {activeGoals.map((g) => {
                  const percent =
                    g.target_amount > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (g.current_amount / g.target_amount) * 100
                          )
                        )
                      : 0;

                  const isCompleted = g.status === "COMPLETED";

                  return (
                    <div key={g.id} className="nanad-dashboard-deposits-row">
                      {/* Kolom 1: info dasar */}
                      <div>
                        <strong>{g.name}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: isCompleted ? "#4ade80" : "#e5e7eb",
                          }}
                        >
                          {isCompleted ? "SELESAI" : "AKTIF"}
                        </span>
                        {g.due_date && (
                          <>
                            <br />
                            <small>
                              Target waktu:{" "}
                              {new Date(g.due_date).toLocaleDateString("id-ID")}
                            </small>
                          </>
                        )}
                        <br />
                        <small>
                          Dibuat:{" "}
                          {new Date(g.created_at).toLocaleString("id-ID")}
                        </small>
                      </div>

                      {/* Kolom 2: progres & catatan */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.78rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          <span>Target: {formatCurrency(g.target_amount)}</span>
                          <span>
                            Terkumpul: {formatCurrency(g.current_amount)} (
                            {percent}%)
                          </span>
                        </div>

                        {/* progress bar */}
                        <div
                          style={{
                            width: "100%",
                            height: "6px",
                            borderRadius: "999px",
                            background: "rgba(15,23,42,0.95)",
                            overflow: "hidden",
                            boxShadow:
                              "inset 0 0 0 1px rgba(30,64,175,0.65)",
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg,#f5d17a,#eab308)",
                              transition: "width 0.2s ease-out",
                            }}
                          />
                        </div>

                        {g.notes && (
                          <p
                            className="nanad-dashboard-body"
                            style={{
                              marginTop: "0.35rem",
                              fontSize: "0.78rem",
                              color: "#e5e7eb",
                            }}
                          >
                            Catatan: {g.notes}
                          </p>
                        )}

                        {/* Penyesuaian nominal */}
                        <div
                          style={{
                            marginTop: "0.55rem",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.45rem",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="50000"
                            placeholder="Nominal"
                            value={goalAdjust[g.id] ?? ""}
                            onChange={(e) =>
                              setGoalAdjust((prev) => ({
                                ...prev,
                                [g.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: "130px",
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
                            style={{ fontSize: "0.72rem", padding: "0.45rem 0.9rem" }}
                            onClick={() => handleAdjustGoal(g, "ADD")}
                          >
                            Tambah
                          </button>
                          <button
                            type="button"
                            className="nanad-dashboard-logout"
                            style={{ fontSize: "0.72rem", padding: "0.45rem 0.9rem" }}
                            onClick={() => handleAdjustGoal(g, "SUB")}
                          >
                            Kurangi
                          </button>
                        </div>
                      </div>

                      {/* Kolom 3: aksi status */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                          alignItems: "flex-end",
                          justifyContent: "center",
                        }}
                      >
                        {!isCompleted && (
                          <button
                            type="button"
                            className="nanad-dashboard-deposit-submit"
                            style={{
                              fontSize: "0.72rem",
                              padding: "0.4rem 0.9rem",
                            }}
                            onClick={() => handleMarkCompleted(g)}
                          >
                            Tandai selesai
                          </button>
                        )}
                        <button
                          type="button"
                          className="nanad-dashboard-logout"
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.4rem 0.9rem",
                            opacity: 0.9,
                          }}
                          onClick={() => handleArchive(g)}
                        >
                          Arsipkan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer kecil */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Saving buckets &amp; goals
            planning.
          </span>
          <span>
            Angka di halaman ini bersifat perencanaan. Untuk saldo resmi, selalu
            rujuk ke mutasi rekening bank atau e-wallet kamu.
          </span>
        </footer>
      </div>
    </main>
  );
}
