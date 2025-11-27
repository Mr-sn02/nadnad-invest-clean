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
              <p className="nanad-landing-brand-title">Nanad Invest</p>
              <p className="nanad-landing-brand-sub">
                Personal Planning &amp; Simulation Space
              </p>
            </div>
          </div>

          <nav className="nanad-landing-nav">
            <a href="#value" className="nanad-landing-nav-link">
              Kenapa Nanad?
            </a>
            <a href="#how-it-works" className="nanad-landing-nav-link">
              Cara kerja
            </a>
            <a href="#safety" className="nanad-landing-nav-link">
              Keamanan &amp; catatan
            </a>

            <div className="nanad-landing-nav-cta">
              <Link href="/login" className="nanad-landing-nav-ghost">
                Masuk
              </Link>
              <Link href="/register" className="nanad-landing-nav-primary">
                Buat akun gratis
              </Link>
            </div>
          </nav>
        </header>

        {/* HERO */}
        <section className="nanad-landing-hero">
          <div className="nanad-landing-hero-left">
            <p className="nanad-landing-eyebrow">PLAN FIRST, INVEST LATER</p>
            <h1 className="nanad-landing-heading">
              Satu ruang rapi untuk
              <span> semua rencana keuanganmu.</span>
            </h1>
            <p className="nanad-landing-hero-text">
              Nanad Invest membantumu menyusun rencana dana darurat, rumah,
              liburan, sampai pensiun — dengan simulasi setoran yang jernih,
              tanpa memindahkan uang dari rekening atau e-wallet yang kamu pakai
              sekarang.
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
              Tidak ada janji imbal hasil. Tidak ada jualan produk. Hanya ruang
              untuk berpikir jernih tentang uangmu.
            </p>
          </div>

          {/* KARTU PRATINJAU DASHBOARD */}
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
                    <span>Rp 6jt / target 10jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "60%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    DP rumah
                    <span>Rp 4jt / target 20jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "20%" }} />
                  </div>
                </div>

                <div className="nanad-landing-preview-row">
                  <div className="nanad-landing-preview-row-title">
                    Liburan keluarga
                    <span>Rp 2,5jt / target 5jt</span>
                  </div>
                  <div className="nanad-landing-preview-progress">
                    <div style={{ width: "50%" }} />
                  </div>
                </div>
              </div>

              <p className="nanad-landing-preview-footnote">
                Tampilan di atas adalah ilustrasi. Angka yang kamu lihat di
                dashboard Nanad Invest hanya berasal dari rencana &amp; setoran
                yang kamu catat sendiri.
              </p>
            </div>
          </div>
        </section>

        {/* VALUE PROPOSITION */}
        <section id="value" className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Kenapa Nanad Invest?</p>
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
                Nanad Invest tidak menahan uangmu. Kamu tetap menabung di bank,
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
            <h2>Dari “bingung mulai dari mana” ke rencana yang jelas.</h2>
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
                <h3>Set setoran &amp; timeline</h3>
                <p>
                  Tentukan berapa yang ingin kamu setor per bulan dan berapa
                  lama durasi rencananya. Nanad Invest akan menghitung total
                  target kasar dan memvisualisasikan progresnya.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">03</span>
              <div>
                <h3>Catat setoran &amp; pantau progres</h3>
                <p>
                  Setiap kali kamu menabung di bank/e-wallet, cukup catat
                  setoran itu ke Nanad Invest. Lihat grafik dan persentase
                  tercapai untuk tiap rencana — semuanya di satu tempat.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* SAFETY / DISCLAIMER */}
        <section id="safety" className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Keamanan &amp; catatan penting</p>
            <h2>Nanad Invest bukan platform titip dana atau janji imbal hasil.</h2>
          </div>

          <div className="nanad-landing-safety-grid">
            <div className="nanad-landing-safety-card">
              <h3>Uangmu tetap di tempat asalnya</h3>
              <p>
                Nanad Invest tidak menyimpan, memindahkan, atau mengelola
                uangmu. Semua transaksi uang terjadi di bank, e-wallet, atau
                platform investasi yang kamu pilih sendiri.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Simulasi, bukan janji keuntungan</h3>
              <p>
                Angka imbal hasil di dalam contoh paket hanyalah ilustrasi untuk
                membantumu berpikir. Bukan rekomendasi, bukan ajakan, dan tidak
                bisa dijadikan dasar klaim keuntungan.
              </p>
            </div>
            <div className="nanad-landing-safety-card">
              <h3>Kamu tetap pegang kendali penuh</h3>
              <p>
                Kamu bisa menghapus, mengubah, atau menambah rencana kapan pun.
                Nanad Invest hanya menyediakan ruang visual untuk membantumu
                mengambil keputusan yang lebih sadar.
              </p>
            </div>
          </div>
        </section>

        {/* CTA AKHIR */}
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
                Buat akun Nanad Invest
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dashboard demo
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-landing-footer">
          <span>© {new Date().getFullYear()} Nanad Invest.</span>
          <span>Dirancang sebagai ruang perencanaan pribadi, bukan produk investasi.</span>
        </footer>
      </div>
    </main>
  );
}
