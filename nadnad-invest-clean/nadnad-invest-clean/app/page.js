"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient"; // ganti kalau path berbeda

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
      depositTotal: 600000, // misal Rp 150.000 x 4 minggu
      durationLabel: "3 bulan (setoran Rp 150.000 per minggu)",
      returnPercent: 8,
    },
    {
      id: "monthly-10",
      name: "Paket Bulanan Contoh",
      description:
        "Contoh target tahunan dengan setoran bulanan tetap.",
      depositTotal: 2400000, // Rp 200.000 x 12 bulan
      durationLabel: "12 bulan (setoran Rp 200.000 per bulan)",
      returnPercent: 10,
    },
  ];

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Ambil user dari Supabase, kalau tidak ada redirect ke /login
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");
      setLoading(false);
    };

    checkUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    // tampilan loading singkat biar nggak blank
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
          {/* Badge demo mode */}
          <span className="nanad-dashboard-demo-badge">Demo mode</span>

          <div className="nanad-dashboard-account">
            <span className="nanad-dashboard-account-label">Akun aktif</span>
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
              <p className="nanad-dashboard-stat-number">3</p>
              <p className="nanad-dashboard-stat-label">Rencana contoh aktif</p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-number">2</p>
              <p className="nanad-dashboard-stat-label">Kategori tujuan</p>
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

        {/* KARTU CONTOH RENCANA */}
        <section className="nanad-dashboard-plan">
          <div className="nanad-dashboard-plan-header">
            <div>
              <p className="nanad-dashboard-eyebrow">Sample plan preview</p>
              <h2>Contoh rencana yang sedang disusun</h2>
              <p>
                Ini hanya ilustrasi. Di tahap berikutnya, rencana milikmu
                sendiri akan muncul di sini setelah kamu mengisi form
                perencanaan bersama Nanad Invest.
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

            <div className="nanad-dashboard-table-row">
              <div>Dana Darurat 6× Pengeluaran</div>
              <div>36 bulan</div>
              <div>Rp 750.000</div>
              <div>± Rp 28.000.000</div>
            </div>

            <div className="nanad-dashboard-table-row">
              <div>DP Rumah 20%</div>
              <div>60 bulan</div>
              <div>Rp 2.000.000</div>
              <div>± Rp 140.000.000</div>
            </div>

            <div className="nanad-dashboard-table-row">
              <div>Pendidikan Anak</div>
              <div>120 bulan</div>
              <div>Rp 1.500.000</div>
              <div>± Rp 260.000.000</div>
            </div>
          </div>

          <p className="nanad-dashboard-plan-footnote">
            Angka di atas hanyalah ilustrasi kasar. Perhitungan riil akan
            menyesuaikan profil risiko, asumsi imbal hasil, dan data yang kamu
            isi saat sesi perencanaan bersama Nanad Invest.
          </p>
        </section>
      </div>
    </main>
  );
}
