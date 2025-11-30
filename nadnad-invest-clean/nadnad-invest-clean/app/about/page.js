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
            <div className="nanad-landing-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-landing-brand-title">Dompet Nadnad</p>
              <p className="nanad-landing-brand-sub">
                Dompet pintar pelanggan &amp; komunitas
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
            <h2>Tentang Dompet Nadnad</h2>
          </div>

          <div
            style={{
              marginTop: "0.9rem",
              fontSize: "0.85rem",
              lineHeight: 1.7,
            }}
          >
            <p style={{ marginBottom: "0.7rem" }}>
              <strong>Dompet Nadnad</strong> adalah ruang digital untuk
              mengelola <em>dompet pintar</em> bagi pelanggan, komunitas, dan
              kelompok arisan. Fokusnya bukan hanya saldo, tetapi alur
              pencatatan: siapa menyetor, siapa menarik, siapa menang arisan,
              dan bagaimana semuanya terdokumentasi dengan rapi.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Dompet Nadnad tidak menyimpan dana dan tidak menerima titipan
              uang dari pengguna. Seluruh pergerakan dana nyata tetap terjadi di{" "}
              <strong>rekening bank, e-wallet, atau kanal pembayaran resmi</strong>{" "}
              yang disepakati di luar aplikasi. Dompet Nadnad berfungsi sebagai{" "}
              <em>papan kontrol</em> untuk mencatat, mensimulasikan, dan
              merapikan alur transaksi tersebut.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Dengan Dompet Nadnad, pemilik usaha atau pengelola komunitas bisa
              membuat dompet pelanggan, mengatur arisan, dan mengeluarkan bukti
              transaksi (struk) yang mudah diakses. Setiap pengajuan deposit
              dan penarikan tetap melalui persetujuan manual admin, sehingga
              jalur administrasi lebih terkontrol dan transparan.
            </p>

            <p style={{ marginBottom: "0.7rem" }}>
              Pengembangan Dompet Nadnad bersifat bertahap: mulai dari dompet
              dasar, arisan, tabungan/goal, hingga fitur-fitur lanjutan seperti
              integrasi dengan sistem usaha, catatan histori pelanggan, dan
              insight sederhana untuk membantu pengelola mengambil keputusan.
            </p>

            <p style={{ marginBottom: "0.4rem" }}>
              Untuk saran kolaborasi, umpan balik, atau pertanyaan terkait
              penggunaan, kamu dapat menghubungi kami melalui email:
              <br />
              <strong>support@dompetnadnad.app</strong>{" "}
              <span style={{ opacity: 0.8 }}>
                (contoh, silakan ganti dengan email resmi kamu).
              </span>
            </p>
          </div>
        </section>

        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>
              © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
            </span>
            <span>
              Dompet Nadnad adalah ruang pencatatan &amp; simulasi transaksi,
              bukan platform penitipan dana maupun penyedia produk investasi.
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
