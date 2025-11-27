// app/about/page.js
"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        {/* Header mini */}
        <header className="nanad-landing-header">
          <div className="nanad-landing-brand">
            <div className="nanad-landing-logo">N</div>
            <div>
              <p className="nanad-landing-brand-title">Nanad Invest</p>
              <p className="nanad-landing-brand-sub">
                Personal Planning &amp; Simulation Space
              </p>
            </div>
          </div>

          <nav className="nanad-landing-nav">
            <Link href="/landing" className="nanad-landing-nav-link">
              Beranda
            </Link>
            <Link href="/legal" className="nanad-landing-nav-link">
              Legal &amp; Disclaimer
            </Link>
            <div className="nanad-landing-nav-cta">
              <Link href="/login" className="nanad-landing-nav-ghost">
                Masuk
              </Link>
              <Link href="/register" className="nanad-landing-nav-primary">
                Buat akun
              </Link>
            </div>
          </nav>
        </header>

        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">About</p>
            <h2>Tentang Nanad Invest</h2>
          </div>

          <div style={{ marginTop: "0.9rem", fontSize: "0.85rem", lineHeight: 1.7 }}>
            <p style={{ marginBottom: "0.7rem" }}>
              <strong>Nanad Invest</strong> adalah ruang digital untuk menyusun rencana
              keuangan pribadi dengan cara yang sederhana, terstruktur, dan mudah dipahami.
              Fokus utama kami adalah membantu pengguna melihat gambaran besar: berapa banyak
              yang ingin dicapai, berapa yang sudah ditabung, dan berapa lama lagi target itu
              realistis tercapai.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Nanad Invest tidak menjual produk investasi dan tidak menerima titipan dana
              dari pengguna. Semua transaksi uang tetap terjadi di rekening bank, e-wallet,
              atau platform investasi yang pengguna pilih sendiri. Dashboard Nanad Invest
              digunakan untuk <em>mencatat, mensimulasikan, dan memvisualisasikan</em> rencana
              tersebut.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Kami percaya bahwa sebelum memilih produk keuangan apa pun, setiap orang
              berhak memiliki ruang yang tenang untuk berpikir: apa tujuan keuangannya,
              seberapa besar kemampuannya saat ini, dan seperti apa prioritas hidupnya.
              Nanad Invest dirancang sebagai ruang refleksi tersebut.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Pengembangan Nanad Invest masih berjalan dan akan terus berevolusi:
              mulai dari tampilan progres rencana, catatan emosi saat mengambil keputusan
              finansial, hingga insight sederhana yang membantu pengguna tetap konsisten
              pada rencananya.
            </p>

            <p style={{ marginBottom: "0.4rem" }}>
              Untuk saran kolaborasi, umpan balik, atau pertanyaan terkait penggunaan,
              silakan hubungi kami melalui email:
              <br />
              <strong>support@nanadinvest.app</strong> (contoh, silakan ganti dengan email resmi).
            </p>
          </div>
        </section>

        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>© {new Date().getFullYear()} Nanad Invest. All rights reserved.</span>
            <span>
              Nanad Invest adalah ruang simulasi &amp; perencanaan keuangan pribadi, bukan
              platform penitipan dana maupun penyedia produk investasi.
            </span>
          </div>
          <div className="nanad-landing-footer-links">
            <Link href="/about">Tentang</Link>
            <Link href="/legal">Legal &amp; Disclaimer</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
