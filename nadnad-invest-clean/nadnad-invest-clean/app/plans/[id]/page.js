// app/plans/[id]/page.js  (atau app/plans/page.js jika memang di situ)
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "../../../lib/supabaseClient"; // ✅ sama seperti file lain

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params?.id;

  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState(null);
  const [deposits, setDeposits] = useState([]);

  async function loadData(uid, pid) {
    setLoading(true);

    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select(
        "id, name, duration_months, monthly_amount, final_estimate, created_at"
      )
      .eq("id", pid)
      .eq("user_id", uid)
      .single();

    if (planError) {
      console.error("Error loading plan detail:", planError);
      setPlan(null);
    } else {
      setPlan(planData);
    }

    const { data: depositRows, error: depError } = await supabase
      .from("plan_deposits")
      .select("id, amount, note, created_at")
      .eq("plan_id", pid)
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (depError) {
      console.error("Error loading plan deposits:", depError);
      setDeposits([]);
    } else {
      setDeposits(depositRows || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    const init = async () => {
      if (!planId) return;

      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user || error) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || "");
      await loadData(user.id, planId);
    };

    init();
  }, [planId, router]);

  if (!planId) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p style={{ color: "#e5e7eb" }}>ID rencana tidak valid.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
            Memuat detail rencana...
          </p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
              color: "#9ca3af",
              textDecoration: "underline",
            }}
          >
            ← Kembali ke dashboard
          </button>
          <p style={{ color: "#e5e7eb" }}>
            Rencana tidak ditemukan atau sudah dihapus.
          </p>
        </div>
      </main>
    );
  }

  const totalSaved = deposits.reduce(
    (acc, d) => acc + (Number(d.amount) || 0),
    0
  );
  const target = Number(plan.final_estimate) || 0;
  const remaining = target > totalSaved ? target - totalSaved : 0;
  const pct = target > 0 ? Math.min(100, (totalSaved / target) * 100) : 0;

  const firstDepositDate = deposits[0]?.created_at
    ? new Date(deposits[0].created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const lastDepositDate =
    deposits.length > 0 && deposits[deposits.length - 1]?.created_at
      ? new Date(
          deposits[deposits.length - 1].created_at
        ).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const avgDeposit =
    deposits.length > 0 ? Math.round(totalSaved / deposits.length) : 0;

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-header-left">
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Detail rencana tabungan &amp; setoran
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.75rem", opacity: 0.8 }}
              >
                Akun: {userEmail || "-"}
              </p>
            </div>
          </div>

          <div className="nanad-dashboard-header-right">
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              ← Kembali ke dashboard
            </button>
          </div>
        </header>

        {/* DETAIL RENCANA */}
        <section className="nanad-plan-detail">
          <div className="nanad-plan-detail-main">
            <p className="nanad-dashboard-eyebrow">Rencana aktif</p>
            <h1 className="nanad-plan-detail-title">{plan.name}</h1>
            <p className="nanad-plan-detail-sub">
              Durasi rencana: {plan.duration_months} bulan · Setoran bulanan:{" "}
              Rp{" "}
              {Number(plan.monthly_amount).toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </p>

            <div className="nanad-plan-detail-summary">
              <div className="nanad-plan-detail-summary-item">
                <span>Total target</span>
                <strong>
                  Rp{" "}
                  {target.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
              <div className="nanad-plan-detail-summary-item">
                <span>Sudah disetor</span>
                <strong>
                  Rp{" "}
                  {totalSaved.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
              <div className="nanad-plan-detail-summary-item">
                <span>Sisa perkiraan</span>
                <strong>
                  Rp{" "}
                  {remaining.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </strong>
              </div>
              <div className="nanad-plan-detail-summary-item">
                <span>Progress</span>
                <strong>{pct.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="nanad-dashboard-progress-bar">
              <div
                className="nanad-dashboard-progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="nanad-plan-detail-footnote">
              Angka di atas adalah ringkasan kasar berdasarkan setoran yang
              tercatat di rencana ini. Catatan dompet utama tetap bisa kamu
              lihat di dashboard Dompet Nadnad.
            </p>
          </div>

          <aside className="nanad-plan-detail-side">
            <h2>Statistik setoran</h2>
            <div className="nanad-plan-detail-side-grid">
              <div>
                <span>Jumlah setoran</span>
                <strong>{deposits.length}</strong>
              </div>
              <div>
                <span>Setoran rata-rata</span>
                <strong>
                  {deposits.length > 0
                    ? `Rp ${avgDeposit.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}`
                    : "-"}
                </strong>
              </div>
              <div>
                <span>Setoran pertama</span>
                <strong>{firstDepositDate}</strong>
              </div>
              <div>
                <span>Setoran terakhir</span>
                <strong>{lastDepositDate}</strong>
              </div>
            </div>

            <p className="nanad-plan-detail-side-note">
              Statistik ini membantu kamu menilai ritme menabung: apakah sudah
              konsisten, perlu dinaikkan, atau cukup dipertahankan.
            </p>
          </aside>
        </section>

        {/* RIWAYAT SETORAN KHUSUS RENCANA INI */}
        <section className="nanad-plan-detail-history">
          <h2>Riwayat setoran untuk rencana ini</h2>

          {deposits.length === 0 ? (
            <p className="nanad-plan-detail-empty">
              Belum ada setoran yang tercatat untuk rencana ini. Kamu bisa
              menambahkan setoran dari fitur pencatatan di dashboard Dompet
              Nadnad.
            </p>
          ) : (
            <>
              <div className="nanad-dashboard-deposits-table">
                <div className="nanad-dashboard-deposits-header">
                  <div>Tanggal</div>
                  <div>Nominal</div>
                  <div>Catatan</div>
                </div>
                {deposits.map((dep) => {
                  const dateLabel = dep.created_at
                    ? new Date(dep.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";

                  return (
                    <div
                      key={dep.id}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>{dateLabel}</div>
                      <div>
                        Rp{" "}
                        {Number(dep.amount).toLocaleString("id-ID", {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div>{dep.note || "-"}</div>
                    </div>
                  );
                })}
              </div>
              <p className="nanad-dashboard-deposits-footnote">
                Data di atas hanya menampilkan setoran yang dihubungkan dengan
                rencana ini. Riwayat transaksi dompet secara keseluruhan tetap
                tidak berubah dan bisa dilihat di halaman dompet.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
