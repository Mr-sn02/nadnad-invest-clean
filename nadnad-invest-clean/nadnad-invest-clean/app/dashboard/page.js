"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoadingUser(false);
    }
    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loadingUser || !user) {
    return (
      <main className="dashboard-shell">
        <div className="dashboard-loading">Memuat dashboard…</div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      {/* Header dashboard */}
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Selamat datang, <strong>{user.email}</strong>
          </p>
          <p className="dashboard-tagline">
            Elegance Powered by Intelligence — pantau simulasi Nadnad Invest di
            satu tempat yang rapi.
          </p>
        </div>

        <button className="btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Ringkasan singkat */}
      <section className="dashboard-grid">
        <article className="card">
          <div className="chip">Profil</div>
          <h2 className="card-title">Akun kamu</h2>
          <p className="card-text">
            Email yang sedang aktif: <strong>{user.email}</strong>. Di versi
            pengembangan berikutnya, kamu bisa mengatur preferensi profil,
            tujuan finansial, dan level risiko favoritmu.
          </p>
        </article>

        <article className="card">
          <div className="chip">Status</div>
          <h2 className="card-title">Mode simulasi</h2>
          <p className="card-text">
            Saat ini Nadnad Invest masih mode{" "}
            <strong>simulasi &amp; edukasi</strong>. Tidak ada dana sungguhan
            yang disimpan di platform ini. Cocok untuk belajar menyusun pola
            investasi dengan aman.
          </p>
        </article>

        <article className="card">
          <div className="chip">Roadmap</div>
          <h2 className="card-title">Langkah berikutnya</h2>
          <p className="card-text">
            Rencananya: integrasi grafik pertumbuhan, histori simulasi, dan
            template rencana (dana darurat, pendidikan, pensiun). Dashboard ini
            jadi pusat kontrol elegan untuk semua itu.
          </p>
        </article>
      </section>

      {/* Paket simulasi (teks edukatif) */}
      <section className="section">
        <div className="section-header">
          <div className="section-eyebrow">Paket simulasi</div>
          <h2 className="section-title">Gaya rencana yang bisa kamu mainkan</h2>
          <p className="section-subtitle">
            Di versi produksi, data di bawah akan tersambung ke mesin simulasi.
            Untuk sekarang, ini jadi panduan referensi sebelum kamu menyusun
            angka sendiri.
          </p>
        </div>

        <div className="package-grid">
          <article className="card">
            <div>
              <div className="chip">Konservatif</div>
              <h3 className="card-title">Stabil Elegan</h3>
              <p className="card-text">
                Fokus stabilitas. Cocok sebagai bayangan dana darurat atau
                kebutuhan 1–3 tahun dengan fluktuasi rendah.
              </p>
              <div className="card-meta">
                Minimal simulasi: <strong>Rp 100.000</strong>
                <br />
                Horizon waktu: 1–3 tahun
              </div>
            </div>
          </article>

          <article className="card">
            <div>
              <div className="chip">Moderate</div>
              <h3 className="card-title">Rencana Pendidikan</h3>
              <p className="card-text">
                Menyeimbangkan pertumbuhan dan risiko. Cocok untuk biaya
                sekolah atau kuliah beberapa tahun lagi.
              </p>
              <div className="card-meta">
                Minimal simulasi: <strong>Rp 250.000</strong>
                <br />
                Horizon waktu: 5–10 tahun
              </div>
            </div>
          </article>

          <article className="card">
            <div>
              <div className="chip">Agresif elegan</div>
              <h3 className="card-title">Pensiun Mandiri</h3>
              <p className="card-text">
                Untuk kamu yang siap dengan naik-turun nilai lebih besar demi
                potensi pertumbuhan jangka panjang.
              </p>
              <div className="card-meta">
                Minimal simulasi: <strong>Rp 500.000</strong>
                <br />
                Horizon waktu: 10+ tahun
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
