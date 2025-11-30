// app/page.js
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            {/* Logo N elegan */}
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Dompet pintar · personal planning &amp; wealth space
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
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
            <p className="nanad-dashboard-eyebrow">Dompet Nadnad</p>
            <h1 className="nanad-dashboard-heading">
              Satu dompet pintar elegan untuk mencatat, merencanakan, dan
              merapikan alur dana pribadimu.
            </h1>
            <p className="nanad-dashboard-body">
              Dompet Nadnad membantu kamu menyusun rencana simpanan, mencatat
              pengajuan setoran dan penarikan, mengelola arisan, dan memantau
              alur dana dengan rapi. Semua dirancang dengan nuansa
              white–gold–silver yang tenang, mewah, dan mudah diingat.
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
                Masuk ke Dompet Nadnad
              </Link>
              <Link href="/register" className="nanad-dashboard-logout">
                Mulai dari akun baru
              </Link>
            </div>

            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.78rem", marginTop: "0.9rem" }}
            >
              Catatan: Dompet Nadnad berfungsi sebagai{" "}
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
                Pantau saldo Dompet Nadnad, ajukan deposit, penarikan, dan
                simpan bukti transfer secara rapi. Admin dapat menyetujui atau
                menolak pengajuan melalui panel khusus.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Approval terkontrol
              </p>
              <p className="nanad-dashboard-stat-number">
                Manual check, transparan, terdokumentasi
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.4rem" }}
              >
                Setiap perubahan saldo tercatat sebagai transaksi dengan jejak
                sebelum–sesudah, sehingga alur administrasi tetap jelas dan
                dapat ditelusuri layaknya dompet pintar yang tertib.
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
                pengalaman menggunakan Dompet Nadnad yang terasa eksklusif,
                hangat, dan fokus.
              </p>
            </div>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Dompet Nadnad tidak memberikan janji imbal hasil tertentu dan tidak
            bertindak sebagai penasihat keuangan. Gunakan sesuai kebutuhan dan
            pertimbangan pribadi.
          </span>
        </footer>
      </div>
    </main>
  );
}
