// app/landing/page.js
"use client";

import Link from "next/link";

const APP_URL = "https://dompet-nadnad.app"; // ganti ke domain final kalau sudah fix

// Link share WhatsApp sederhana
const waShareText = encodeURIComponent(
  `Aku lagi pakai Dompet Nadnad buat rapihin tabungan & rencana dana.\nCek di ${APP_URL}/register kalau mau coba juga.`
);
const waShareLink = `https://wa.me/?text=${waShareText}`;

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
                Dompet pintar &amp; ruang rencana dana
              </p>
            </div>
          </div>

          <nav className="nanad-landing-nav">
            <a href="#value" className="nanad-landing-nav-link">
              Kenapa Dompet Nadnad?
            </a>
            <a href="#how-it-works" className="nanad-landing-nav-link">
              Cara kerja
            </a>
            <a href="#stories" className="nanad-landing-nav-link">
              Cerita pengguna
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
            <p className="nanad-landing-eyebrow">PLAN FIRST, MOVE MONEY LATER</p>
            <h1 className="nanad-landing-heading">
              Satu dompet rapi untuk
              <span> semua rencana keuanganmu.</span>
            </h1>
            <p className="nanad-landing-hero-text">
              Dompet Nadnad membantumu menyusun rencana dana darurat, rumah,
              liburan, sampai pensiun — dengan simulasi setoran yang jernih,
              tanpa harus memindahkan uang dari rekening atau e-wallet yang kamu
              pakai sekarang.
            </p>

            <div className="nanad-landing-hero-cta">
              <Link href="/register" className="nanad-landing-cta-primary">
                Mulai susun rencana
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Lihat dashboard demo
              </Link>
            </div>

            <p className="nanad-landing-hero-note">
              Tidak ada janji imbal hasil. Tidak ada jualan produk. Hanya dompet
              &amp; ruang tenang untuk berpikir jernih tentang uangmu.
            </p>
          </div>

          {/* PREVIEW DASHBOARD */}
          <div className="nanad-landing-hero-right">
            <div className="nanad-landing-preview-card">
              <div className="nanad-landing-preview-header">
                <span>Cuplikan dashboard</span>
                <span className="nanad-landing-demo-pill">Demo mode</span>
              </div>

              <div className="nanad-landing-preview-stats">
                <div className="nanad-landing-preview-stat">
                  <span>Rencana aktif</span>
                  <strong>3</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Total ditabung (simulasi)</span>
                  <strong>Rp 12.500.000</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Persentase tercapai</span>
                  <strong>38%</strong>
                </div>
              </div>

              <div className="nanad-landing-preview-bars">
                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Dana darurat
                    <span>Rp 6 jt / target 10 jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "60%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    DP rumah
                    <span>Rp 4 jt / target 20 jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "20%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Liburan keluarga
                    <span>Rp 2,5 jt / target 5 jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "50%" }} />
                  </div>
                </div>
              </div>

              <p className="nanad-landing-preview-footnote">
                Tampilan di atas adalah ilustrasi. Angka di dashboard Dompet
                Nadnad hanya berasal dari rencana &amp; setoran yang kamu catat
                sendiri.
              </p>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION */}
        <section id="value" className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Kenapa Dompet Nadnad?</p>
            <h2>Tiga hal yang bikin rencana finansialmu lebih tenang.</h2>
          </div>

          <div className="nanad-landing-value-grid">
            <article className="nanad-landing-value-card">
              <h3>Satu ruang, semua tujuan</h3>
              <p>
                Dana darurat, cicilan rumah, upgrade karier, sampai mimpi
                liburan — semua bisa kamu petakan dalam satu dashboard, tanpa
                file yang tercecer di mana-mana.
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Simulasi rapi tanpa sentuh dana</h3>
              <p>
                Dompet Nadnad tidak menahan uangmu. Kamu tetap menabung di bank,
                e-wallet, atau platform favoritmu. Di sini, kamu hanya
                mensimulasikan setoran dan memantau progres.
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Bahasa manusia, bukan bahasa bank</h3>
              <p>
                Angka-angka ditampilkan dengan bahasa yang mudah dipahami:
                berapa yang sudah ditabung, berapa yang perlu ditambah, dan
                berapa lama lagi targetmu realistis tercapai.
              </p>
            </article>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Cara kerja</p>
            <h2>Dari bingung mulai dari mana ke rencana yang jelas.</h2>
          </div>

          <ol className="nanad-landing-steps">
            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">01</span>
              <div>
                <h3>Buat akun &amp; pilih tujuan</h3>
                <p>
                  Daftar gratis, lalu tambahkan beberapa rencana: dana darurat,
                  DP rumah, pendidikan, atau tujuan lain yang penting buatmu.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">02</span>
              <div>
                <h3>Set setoran &amp; durasi</h3>
                <p>
                  Tentukan nominal setoran dan lama waktu rencananya. Dompet
                  Nadnad akan menghitung target kasar dan memvisualisasikan
                  progresnya.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">03</span>
              <div>
                <h3>Catat setoran &amp; pantau progres</h3>
                <p>
                  Setiap kali menabung di bank/e-wallet, cukup catat di Dompet
                  Nadnad. Lihat persentase tercapai untuk tiap rencana, semua di
                  satu tempat.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* USER STORIES */}
        <section
          id="stories"
          className="nanad-landing-section nanad-landing-section-soft"
        >
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Cerita pengguna</p>
            <h2>
              Bukan janji cuan, tapi cerita orang yang lebih tenang sama uangnya.
            </h2>
          </div>

          <div className="nanad-landing-value-grid">
            <article className="nanad-landing-value-card">
              <h3>Pisah uang usaha &amp; uang pribadi</h3>
              <p>
                “Dulu uang orderan &amp; uang jajan nyampur di satu rekening.
                Sekarang aku pakai Dompet Nadnad khusus buat catat arus usaha,
                jadi kelihatan mana yang benar-benar laba.”
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Nabung kecil tapi konsisten</h3>
              <p>
                “Aku bikin rencana dana darurat cuma 300 ribu per bulan. Kecil,
                tapi waktu lihat progresnya jalan, rasanya macam punya teman
                yang rajin ngingetin.”
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Rencana keluarga lebih rapi</h3>
              <p>
                “Aku dan pasangan pakai satu Dompet Nadnad buat rencana sekolah
                anak dan liburan. Semua catatan dan setoran ada di satu ruang,
                nggak hilang di chat.”
              </p>
            </article>
          </div>
        </section>

        {/* SAFETY / DISCLAIMER SHORT */}
        <section
          id="safety"
          className="nanad-landing-section nanad-landing-section-soft"
        >
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Keamanan &amp; catatan penting</p>
            <h2>Dompet Nadnad bukan tempat titip dana atau janji keuntungan.</h2>
          </div>

          <div className="nanad-landing-safety-grid">
            <div className="nanad-landing-safety-card">
              <h3>Uangmu tetap di tempat asalnya</h3>
              <p>
                Dompet Nadnad tidak menyimpan, memindahkan, atau mengelola
                uangmu. Semua transaksi uang terjadi di bank, e-wallet, atau
                platform investasi yang kamu pilih sendiri.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Simulasi, bukan janji imbal hasil</h3>
              <p>
                Angka imbal hasil di dalam contoh paket hanyalah ilustrasi untuk
                membantumu berpikir. Bukan rekomendasi, bukan ajakan, dan tidak
                bisa dijadikan dasar klaim keuntungan.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Kamu pegang kendali penuh</h3>
              <p>
                Kamu bisa menghapus, mengubah, atau menambah rencana kapan pun.
                Dompet Nadnad hanya menyediakan ruang visual untuk membantumu
                mengambil keputusan yang lebih sadar.
              </p>
            </div>
          </div>
        </section>

        {/* SHARE / REFERRAL LIGHT SECTION */}
        <section className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Bagikan Dompet Nadnad</p>
            <h2>
              Biar nyebarnya pelan tapi pasti, dari mulut ke mulut yang saling percaya.
            </h2>
          </div>

          <div className="nanad-landing-value-grid">
            <article className="nanad-landing-value-card">
              <h3>Kode referral Dompet Nadnad</h3>
              <p>
                Setiap akun punya kode unik (misalnya <strong>NAD603A1</strong>).
                Kamu bisa bagikan link pendaftaran, dan nanti ada kesempatan
                hadiah tambahan di event promo tertentu (bukan janji return).
              </p>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Share cepat via WhatsApp</h3>
              <p style={{ marginBottom: "0.6rem" }}>
                Kirim pesan siap pakai ke teman atau keluarga yang lagi pengen
                merapikan keuangan.
              </p>
              <a
                href={waShareLink}
                target="_blank"
                rel="noreferrer"
                className="nanad-landing-cta-secondary"
                style={{ display: "inline-block" }}
              >
                Bagikan lewat WhatsApp
              </a>
            </article>

            <article className="nanad-landing-value-card">
              <h3>Screenshot progres</h3>
              <p>
                Kamu bebas screenshot progres dompetmu dan cerita versi kamu
                sendiri di sosmed. Tidak perlu sebut angka saldo kalau tidak
                nyaman — cukup cerita rasanya lebih tenang.
              </p>
            </article>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="nanad-landing-bottom-cta">
          <div className="nanad-landing-bottom-cta-inner">
            <div>
              <h2>Siap merapikan rencana keuanganmu?</h2>
              <p>
                Mulai dengan satu rencana kecil. Lihat bagaimana rasanya ketika
                semua angka penting terkumpul di satu ruang yang tenang.
              </p>
            </div>
            <div className="nanad-landing-bottom-cta-actions">
              <Link href="/register" className="nanad-landing-cta-primary">
                Buat akun Dompet Nadnad
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dashboard
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
              Dompet Nadnad adalah ruang simulasi &amp; perencanaan keuangan
              pribadi. Dompet Nadnad tidak menerima titipan dana, tidak
              menyalurkan dana, dan tidak menjanjikan imbal hasil investasi apa
              pun.
            </span>
          </div>

          <div className="nanad-landing-footer-links">
            <a href="/about">Tentang</a>
            <a href="/legal">Legal &amp; Disclaimer</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
