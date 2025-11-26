"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

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
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Nadnad Invest · Dashboard</p>
          <h1 className="dashboard-title">Selamat datang</h1>
          <p className="dashboard-subtitle">
            Akun aktif: <strong>{user.email}</strong>
          </p>
          <p className="dashboard-tagline">
            Elegance Powered by Intelligence — satu ruang rapi untuk
            bereksperimen dengan rencana finansialmu sebelum terjun ke instrumen
            nyata.
          </p>
        </div>

        <button className="btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* GRID UTAMA */}
      <section className="dashboard-grid">
        <article className="card">
          <div className="chip">Profil akun</div>
          <h2 className="card-title">Identitas kamu</h2>
          <p className="card-text">
            Email ini digunakan untuk menyimpan preferensi simulasi, histori
            rencana, dan pengaturan profil di versi berikutnya.
          </p>
          <div className="card-meta">
            Status akun: <strong>Aktif</strong>
            <br />
            Mode: <strong>Simulasi &amp; edukasi</strong>
          </div>
        </article>

        <article className="card">
          <div className="chip">Mode simulasi</div>
          <h2 className="card-title">Tanpa dana sungguhan</h2>
          <p className="card-text">
            Semua angka di Nadnad Invest saat ini masih berupa ilustrasi.
            Cocok untuk melatih kebiasaan menyisihkan dana dan memahami efek
            waktu, setoran rutin, dan profil risiko.
          </p>
          <div className="card-meta">
            Cocok untuk:{" "}
            <strong>belajar &amp; eksperimen dengan angka yang aman</strong>.
          </div>
        </article>

        <article className="card">
          <div className="chip">Roadmap</div>
          <h2 className="card-title">Ke mana dashboard ini akan berkembang?</h2>
          <p className="card-text">
            Rencana ke depan: grafik pertumbuhan, template rencana (dana
            darurat, pendidikan, pensiun), dan notifikasi lembut untuk
            mengingatkan setoran rutin.
          </p>
          <div className="card-meta">
            Saat ini: fokus ke desain, alur, dan pengalaman pengguna.
          </div>
        </article>
      </section>

      {/* RINGKASAN SIMULASI DUMMY */}
      <section className="section">
        <div className="section-header">
          <div className="section-eyebrow">Ringkasan simulasi</div>
          <h2 className="section-title">Contoh rencana yang sedang disusun</h2>
          <p className="section-subtitle">
            Data di bawah ini masih contoh. Nanti bisa kita ganti dengan hasil
            simulasi beneran (berdasarkan input kamu).
          </p>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tujuan</th>
                <th>Profil</th>
                <th>Setoran bulanan</th>
                <th>Durasi</th>
                <th>Estimasi nilai akhir</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Stabil Elegan (dana darurat)</td>
                <td>Konservatif</td>
                <td>Rp 750.000</td>
                <td>3 tahun</td>
                <td>Rp 32.000.000</td>
              </tr>
              <tr>
                <td>Rencana Pendidikan</td>
                <td>Moderate</td>
                <td>Rp 500.000</td>
                <td>8 tahun</td>
                <td>Rp 95.000.000</td>
              </tr>
              <tr>
                <td>Pensiun Mandiri</td>
                <td>Agresif elegan</td>
                <td>Rp 1.000.000</td>
                <td>15 tahun</td>
                <td>Rp 420.000.000</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="dashboard-note">
          *Angka di atas hanya ilustrasi kasar. Bukan janji hasil dan tidak
          merepresentasikan instrumen investasi tertentu.
        </p>
      </section>
    </main>
  );
}
