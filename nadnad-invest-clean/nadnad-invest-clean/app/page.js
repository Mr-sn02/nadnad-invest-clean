// app/page.js
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Personal planning &amp; wealth space
              </p>
            </div>
          </div>

          {/* 👉 Bagian kanan header, sekarang ada 3 tombol */}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            {/* Profil & Keamanan – akan redirect ke login kalau belum login */}
            <Link href="/profile" className="nanad-dashboard-logout">
              Profil &amp; Keamanan
            </Link>

            <Link href="/login" className="nanad-dashboard-logout">
              Masuk
            </Link>
            <Link href="/register" className="nanad-dashboard-deposit-submit">
              Daftar akun
            </Link>
          </div>
        </header>

        <section className="nanad-landing-main">
          {/* Kiri: Hero text */}
          <div className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Nanad Invest</p>
            <h1 className="nanad-dashboard-heading">
              Satu ruang elegan untuk mencatat, merencanakan, dan merapikan
              alur dana pribadi kamu.
            </h1>
            <p className="nanad-dashboard-body">
              Nanad Invest membantu kamu menyusun rencana simpanan, mencatat
              pengajuan setoran dan penarikan, serta memberi visibilitas yang
              rapi pada perjalanan finansialmu. Semua dirancang dengan nuansa
              white–gold–silver yang tenang dan berkelas.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginTop: "0.9rem",
              }}
            >
              <Link href="/login" className="nanad-dashboard-deposit-submit">
                Masuk ke ruang pribadi
              </Link>
              <Link href="/register" className="nanad-dashboard-logout">
                Mulai dari akun baru
              </Link>

              {/* 👉 CTA tambahan ke Profil (kalau sudah login) */}
              <Link href="/profile" className="nanad-dashboard-logout">
                Lihat Profil &amp; Keamanan
              </Link>
            </div>

            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.78rem", marginTop: "0.9rem" }}
            >
              Catatan: Nanad Invest berfungsi sebagai{" "}
              <strong>alat bantu pencatatan &amp; perencanaan</strong>. Dana
              nyata tetap dikelola di rekening resmi masing-masing pengguna
              sesuai ketentuan dan regulasi yang berlaku.
            </p>
          </div>

          {/* Kanan: Highlight cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "0.9rem",
            }}
          >
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Dompet &amp; riwayat transaksi
              </p>
              <p className="nanad-dashboard-stat-number">
                Satu layar untuk setoran &amp; penarikan
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.4rem" }}
              >
                Pantau saldo dompet, ajukan deposit, penarikan, dan simpan
                bukti transfer secara rapi. Admin dapat menyetujui atau
                menolak pengajuan melalui panel khusus.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Approval terkontrol</p>
              <p className="nanad-dashboard-stat-number">
                Manual check, transparan, terdokumentasi
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.4rem" }}
              >
                Setiap perubahan saldo tercatat sebagai transaksi dengan jejak
                sebelum–sesudah, sehingga alur administrasi tetap jelas dan
                dapat ditelusuri.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Nuansa white–gold</p>
              <p className="nanad-dashboard-stat-number">
                Tampilan premium, tetap tenang
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.4rem" }}
              >
                Antarmuka minimalis dengan aksen putih, emas, dan perak untuk
                pengalaman menggunakan platform yang terasa eksklusif dan
                fokus.
              </p>
            </div>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. All rights reserved.
          </span>
          <span>
            Nanad Invest tidak memberikan janji imbal hasil tertentu dan tidak
            bertindak sebagai penasihat keuangan. Gunakan sesuai kebutuhan dan
            pertimbangan pribadi.
          </span>
        </footer>
      </div>
    </main>
  );
}
