// app/landing/page.js
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        {/* NAVBAR */}
        <header className="nanad-landing-header">
          <div className="nanad-landing-brand">
            <div className="nanad-landing-logo">N</div>
            <div>
              <p className="nanad-landing-brand-title">Dompet Nadnad</p>
              <p className="nanad-landing-brand-sub">
                Dompet pintar untuk alur dana &amp; arisan
              </p>
            </div>
          </div>

          <nav className="nanad-landing-nav">
            <a href="#value" className="nanad-landing-nav-link">
              Kenapa Nadnad?
            </a>
            <a href="#how-it-works" className="nanad-landing-nav-link">
              Cara kerja
            </a>
            <a href="#safety" className="nanad-landing-nav-link">
              Keamanan
            </a>

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

        {/* HERO */}
        <section className="nanad-landing-hero">
          <div className="nanad-landing-hero-left">
            <p className="nanad-landing-eyebrow">SMART WALLET · CLEAR FLOW</p>
            <h1 className="nanad-landing-heading">
              Satu dompet pintar
              <span> untuk semua alur dana kamu.</span>
            </h1>
            <p className="nanad-landing-hero-text">
              Dompet Nadnad membantumu mencatat setoran, penarikan, tabungan
              khusus, sampai arisan — dengan tampilan yang rapi dan elegan,
              tanpa harus memindahkan uang dari rekening atau e-wallet yang
              kamu gunakan sekarang.
            </p>

            <div className="nanad-landing-hero-cta">
              <Link href="/register" className="nanad-landing-cta-primary">
                Daftar Dompet Nadnad
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dompet
              </Link>
            </div>

            <p className="nanad-landing-hero-note">
              Tidak ada janji imbal hasil. Tidak ada jualan produk. Hanya{" "}
              <strong>dompet pintar</strong> untuk merapikan alur dana dan
              arisanmu.
            </p>
          </div>

          {/* PREVIEW DASHBOARD */}
          <div className="nanad-landing-hero-right">
            <div className="nanad-landing-preview-card">
              <div className="nanad-landing-preview-header">
                <span>Cuplikan Dompet Nadnad</span>
                <span className="nanad-landing-demo-pill">Tampilan contoh</span>
              </div>

              <div className="nanad-landing-preview-stats">
                <div className="nanad-landing-preview-stat">
                  <span>Grup arisan aktif</span>
                  <strong>2</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Saldo tercatat (simulasi)</span>
                  <strong>Rp 12.500.000</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Goals tabungan tercapai</span>
                  <strong>3/5</strong>
                </div>
              </div>

              <div className="nanad-landing-preview-bars">
                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Dompet utama
                    <span>Rp 6 jt · arus masuk/keluar tercatat</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "60%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Tabungan DP rumah
                    <span>Rp 4 jt / target 20 jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "20%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Arisan bulanan
                    <span>iuran Rp 500 rb · 10 anggota</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "50%" }} />
                  </div>
                </div>
              </div>

              <p className="nanad-landing-preview-footnote">
                Tampilan di atas adalah ilustrasi. Angka di dashboard Dompet
                Nadnad hanya berasal dari transaksi &amp; rencana yang kamu
                catat sendiri.
              </p>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION */}
        <section id="value" className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Kenapa Dompet Nadnad?</p>
            <h2>Tiga hal yang bikin alur dana lebih tenang.</h2>
          </div>

          <div className="nanad-landing-value-grid">
            <article className="nanad-landing-value-card">
              <h3>Satu dompet, banyak kantong</h3>
              <p>
                Dompet utama, tabungan khusus, sampai arisan bisa kamu atur
                dalam satu tampilan. Tidak perlu lagi catatan tercecer di chat
                atau spreadsheet terpisah.
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Catatan rapi tanpa sentuh dana</h3>
              <p>
                Dompet Nadnad tidak menahan uangmu. Kamu tetap pakai rekening,
                e-wallet, atau platform favorit. Di sini, kamu hanya mencatat
                setoran, penarikan, dan putaran arisan sebagai simulasi alur
                dana.
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Bahasa dompet sehari-hari</h3>
              <p>
                Semua ditampilkan dengan bahasa sederhana: siapa setor, siapa
                terima, berapa saldo, dan sudah berapa putaran berjalan. Bukan
                bahasa bank yang bikin pusing.
              </p>
            </article>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Cara kerja</p>
            <h2>Dari dompet biasa ke dompet pintar.</h2>
          </div>

          <ol className="nanad-landing-steps">
            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">01</span>
              <div>
                <h3>Buat akun &amp; dompet</h3>
                <p>
                  Daftar gratis, lalu Dompet Nadnad akan membuatkan dompet
                  utama untukmu. Dari sini kamu bisa menambah tabungan khusus
                  dan grup arisan.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">02</span>
              <div>
                <h3>Catat setoran &amp; penarikan</h3>
                <p>
                  Saat ada dana masuk/keluar di rekening nyata, kamu cukup
                  mencatatnya di Dompet Nadnad. Admin (jika ada) bisa menyetujui
                  pengajuan sebelum saldo tercatat.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">03</span>
              <div>
                <h3>Kelola arisan &amp; goals tabungan</h3>
                <p>
                  Atur jadwal arisan, iuran per putaran, dan lihat siapa yang
                  sudah terima atau belum. Sekaligus pantau progres tabungan
                  khusus seperti dana darurat, DP rumah, atau modal usaha.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* SAFETY / DISCLAIMER SHORT */}
        <section
          id="safety"
          className="nanad-landing-section nanad-landing-section-soft"
        >
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Keamanan &amp; catatan penting</p>
            <h2>
              Dompet Nadnad bukan tempat titip dana maupun janji keuntungan.
            </h2>
          </div>

          <div className="nanad-landing-safety-grid">
            <div className="nanad-landing-safety-card">
              <h3>Uangmu tetap di rekeningmu</h3>
              <p>
                Dompet Nadnad tidak menyimpan, memindahkan, atau mengelola
                uangmu. Semua transaksi uang terjadi di bank, e-wallet, atau
                platform investasi yang kamu pilih sendiri.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Simulasi, bukan produk investasi</h3>
              <p>
                Angka imbal hasil atau paket simulasi (jika ada) hanyalah contoh
                perhitungan. Bukan rekomendasi, bukan ajakan, dan tidak bisa
                dijadikan dasar klaim keuntungan.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Kamu pegang kendali penuh</h3>
              <p>
                Kamu bisa menghapus, mengubah, atau menambah dompet, goals, dan
                grup arisan kapan saja. Dompet Nadnad hanya membantu
                memvisualisasikan alur dana agar keputusanmu lebih sadar.
              </p>
            </div>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="nanad-landing-bottom-cta">
          <div className="nanad-landing-bottom-cta-inner">
            <div>
              <h2>Siap upgrade ke dompet pintar?</h2>
              <p>
                Mulai dari satu dompet dan satu tujuan dulu. Rasakan bedanya
                ketika semua arus dana dan arisanmu tercatat rapi dalam satu
                ruang yang tenang.
              </p>
            </div>
            <div className="nanad-landing-bottom-cta-actions">
              <Link href="/register" className="nanad-landing-cta-primary">
                Buat akun Dompet Nadnad
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dompet
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER RESMI */}
        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>
              © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
            </span>
            <span>
              Dompet Nadnad adalah dompet pintar untuk simulasi &amp; pencatatan
              alur dana. Dompet Nadnad tidak menerima titipan dana, tidak
              menyalurkan dana, dan tidak menjanjikan imbal hasil investasi apa
              pun.
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
