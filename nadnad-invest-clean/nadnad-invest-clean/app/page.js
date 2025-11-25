import NavbarScroll from "./navbar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          {/* Brand + tagline */}
          <div className="brand-block">
            <div className="brand">
              <div className="brand-icon">Ni</div>
              <div>
                <div className="brand-text">Nadnad Invest</div>
              </div>
            </div>
            <div className="brand-tagline">
              Elegance Powered by Intelligence.
            </div>
          </div>

          {/* Tombol kanan */}
          <div>
            <a href="/dashboard" className="btn-ghost">
              Demo Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Script kecil untuk efek navbar saat scroll */}
      <NavbarScroll />

      <main>
        {/* HERO SECTION */}
        <section className="container hero">
          <div className="hero-grid">
            {/* Kiri: teks */}
            <section>
              <div className="hero-badge">
                <span>✨</span>
                <span>Simulasi investasi dengan nuansa elegan</span>
              </div>
              <h1 className="hero-title">
                Rancang masa depanmu
                <span> dengan sentuhan Nadnad Invest.</span>
              </h1>
              <p className="hero-sub">
                Platform simulasi yang tenang, rapi, dan terasa mewah. Nuansa
                gold–black–silver–white untuk menemani perjalananmu merapikan
                rencana keuangan sebelum benar-benar menaruh dana.
              </p>

              <div className="hero-actions">
                <button className="btn-main">Mulai simulasi</button>
                <a href="#paket" className="btn-ghost">
                  Lihat paket simulasi
                </a>
              </div>

              <div className="hero-meta">
                <span>
                  <strong>Elegance Powered by Intelligence.</strong>
                </span>
              </div>
            </section>

            {/* Kanan: kartu simulasi */}
            <aside className="hero-card">
              <div className="hero-card-header">
                <div className="hero-card-title">
                  Simulasi paket “Stabil Elegan”
                </div>
                <span className="pill-safe">Profil konservatif</span>
              </div>

              <div className="hero-card-amount">Rp 185.000.000</div>
              <p className="hero-card-caption">
                Contoh ilustrasi nilai rencana dengan setoran rutin dan asumsi
                pertumbuhan stabil. Bukan janji hasil, hanya contoh visual yang
                rapi.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.2fr",
                  gap: "0.75rem",
                  fontSize: "0.8rem",
                }}
              >
                <div>
                  <div style={{ color: "#9ca3af" }}>Setoran bulanan</div>
                  <div style={{ fontWeight: 600 }}>Rp 750.000</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Durasi rencana</div>
                  <div style={{ fontWeight: 600 }}>8 tahun</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Profil risiko</div>
                  <div style={{ fontWeight: 600 }}>Konservatif</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Tema</div>
                  <div style={{ fontWeight: 600 }}>
                    Elegance Powered by Intelligence
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ================================
           SECTION: Paket Simulasi
        ================================= */}
        <section id="paket" className="container section">
          <div className="section-header">
            <div className="section-eyebrow">Paket simulasi</div>
            <h2 className="section-title">Pilih gaya investasimu</h2>
            <p className="section-subtitle">
              Semua paket di bawah ini masih berbentuk simulasi. Cocok untuk
              belajar menyusun rencana sebelum masuk instrumen nyata.
            </p>
          </div>

          <div className="package-grid">
            <article className="card">
              <div>
                <div className="chip">Konservatif</div>
                <h3 className="card-title">Stabil Elegan</h3>
                <p className="card-text">
                  Fokus kestabilan nilai. Cocok dana darurat / rencana 1–3 tahun
                  dengan fluktuasi relatif kecil.
                </p>
                <div className="card-meta">
                  Minimal simulasi: <strong>Rp 100.000</strong>
                  <br />
                  Horizon waktu: 1–3 tahun
                </div>
              </div>
              <div className="package-footer">
                <div className="price">Rp 100.000+</div>
                <button className="btn-small">Lihat detail</button>
              </div>
            </article>

            <article className="card">
              <div>
                <div className="chip">Moderate</div>
                <h3 className="card-title">Rencana Pendidikan</h3>
                <p className="card-text">
                  Seimbang antara pertumbuhan & risiko. Cocok biaya sekolah /
                  kuliah beberapa tahun lagi.
                </p>
                <div className="card-meta">
                  Minimal simulasi: <strong>Rp 250.000</strong>
                  <br />
                  Horizon waktu: 5–10 tahun
                </div>
              </div>
              <div className="package-footer">
                <div className="price">Rp 250.000+</div>
                <button className="btn-small">Lihat detail</button>
              </div>
            </article>

            <article className="card">
              <div>
                <div className="chip">Agresif elegan</div>
                <h3 className="card-title">Pensiun Mandiri</h3>
                <p className="card-text">
                  Untuk kamu yang siap fluktuasi lebih besar demi potensi
                  pertumbuhan jangka panjang.
                </p>
                <div className="card-meta">
                  Minimal simulasi: <strong>Rp 500.000</strong>
                  <br />
                  Horizon waktu: 10+ tahun
                </div>
              </div>
              <div className="package-footer">
                <div className="price">Rp 500.000+</div>
                <button className="btn-small">Lihat detail</button>
              </div>
            </article>
          </div>
        </section>

        {/* ================================
           SECTION: Cara Kerja
        ================================= */}
        <section id="cara-kerja" className="container section">
          <div className="section-header">
            <div className="section-eyebrow">Cara kerja</div>
            <h2 className="section-title">Bagaimana Nadnad Invest membantumu</h2>
            <p className="section-subtitle">
              Dibuat sederhana agar kamu bisa fokus membangun kebiasaan sehat,
              bukan pusing dengan istilah teknis.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "1.2rem",
            }}
          >
            <div className="card">
              <div className="chip">Langkah 1</div>
              <h3 className="card-title">Tentukan tujuanmu</h3>
              <p className="card-text">
                Pilih fokus: dana darurat, pendidikan, atau pensiun sebagai dasar
                gaya simulasi.
              </p>
            </div>

            <div className="card">
              <div className="chip">Langkah 2</div>
              <h3 className="card-title">Pilih paket simulasi</h3>
              <p className="card-text">
                Sesuaikan paket dengan horizon waktu dan profil risiko yang kamu
                rasa paling nyaman.
              </p>
            </div>

            <div className="card">
              <div className="chip">Langkah 3</div>
              <h3 className="card-title">Bangun kebiasaan</h3>
              <p className="card-text">
                Gunakan simulasi untuk memahami pola. Setelah nyaman, terapkan
                pola yang sama di instrumen keuangan nyata.
              </p>
            </div>
          </div>
        </section>

        {/* ================================
           SECTION: Testimoni
        ================================= */}
        <section id="testimoni" className="container section">
          <div className="section-header">
            <div className="section-eyebrow">Testimoni</div>
            <h2 className="section-title">Suara dari para pengguna awal</h2>
            <p className="section-subtitle">
              Mereka bukan mencari “cepat kaya”, tapi ingin hubungan yang lebih
              sehat dengan uang dan rencana keuangan.
            </p>
          </div>

          <div className="testimonials">
            <article className="testimonial-card">
              <p className="testimonial-text">
                “Sebelumnya aku selalu panik kalau bicara soal investasi. Di
                Nadnad Invest, semuanya terasa pelan, elegan, dan masuk akal.
                Aku jadi sadar kalau kuncinya adalah konsistensi, bukan kejar
                angka instan.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Dita</div>
                  <div className="testimonial-role">
                    Karyawan swasta, 28 tahun
                  </div>
                </div>
              </div>
            </article>

            <article className="testimonial-card">
              <p className="testimonial-text">
                “Tampilan Nadnad Invest bikin aku betah ngulik. Rasanya seperti
                lihat dashboard butik finansial, bukan aplikasi trading yang
                bising.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Rendy</div>
                  <div className="testimonial-role">Freelancer, 32 tahun</div>
                </div>
              </div>
            </article>

            <article className="testimonial-card">
              <p className="testimonial-text">
                “Sebagai orang yang visual, aku suka cara Nadnad menyajikan
                rencana. Tenang, rapi, tapi tetap tegas. Rasanya kayak diajak
                mikir bareng, bukan disuruh spekulasi.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Maya</div>
                  <div className="testimonial-role">
                    Wirausaha kecil, 30 tahun
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ================================
           SECTION: CTA
        ================================= */}
        <section className="container section">
          <div className="cta">
            <div>
              <div className="cta-title">
                Siap memulai perjalanan investasimu dengan lebih elegan?
              </div>
              <div className="cta-sub">
                Buat akun, pilih paket simulasi, lalu lihat bagaimana kebiasaan
                kecil yang konsisten bisa mengubah arah keuanganmu.
              </div>
            </div>
            <div className="cta-actions">
              <button className="btn-main">Daftar sekarang</button>
              <a href="/dashboard" className="btn-ghost">
                Lihat demo dashboard
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            © {new Date().getFullYear()} Nadnad Invest. All rights reserved.
          </div>
          <div className="footer-links">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat &amp; Ketentuan</a>
            <a href="#">Kontak</a>
          </div>
        </div>
      </footer>
    </>
  );
}
