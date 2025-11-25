"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/login";
      } else {
        setUser(data.user);
        setChecking(false);
      }
    }
    checkUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (checking) {
    return (
      <main className="dashboard-shell">
        <div className="container">
          <p className="dash-sub">Checking session...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <div className="container">
        <header className="dash-header">
          <div>
            <div className="dash-eyebrow">
              Nadnad Invest · Personal dashboard
            </div>
            <h1 className="dash-title">Gambaran rencana investasimu</h1>
            <p className="dash-sub">
              Semua angka di halaman ini masih berupa simulasi ilustratif. Tujuannya
              untuk membantumu merasa tenang, terarah, dan terbiasa melihat pola
              pergerakan nilai dalam jangka panjang.
            </p>
          </div>
          <div className="dash-header-right">
            <div className="dash-user-pill">
              <span className="dot-online" />
              <span>{user?.email}</span>
            </div>
            <button className="btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dash-cards">
          <article className="dash-card">
            <div className="dash-card-label">
              Total nilai rencana (simulasi)
            </div>
            <div className="dash-card-value">Rp 185.000.000</div>
            <div className="dash-card-hint">
              Dengan setoran konsisten setiap bulan · profil konservatif
            </div>
          </article>

          <article className="dash-card">
            <div className="dash-card-label">Setoran bulanan simulasi</div>
            <div className="dash-card-value">Rp 750.000</div>
            <div className="dash-card-hint">
              Angka ini bisa kamu sesuaikan di versi produk berikutnya.
            </div>
          </article>

          <article className="dash-card">
            <div className="dash-card-label">Horizon rencana</div>
            <div className="dash-card-value">8 tahun</div>
            <div className="dash-card-hint">
              Waktu cukup untuk membangun kebiasaan dan melihat pola.
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
