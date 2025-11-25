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

      {/* efek navbar saat scroll */}
      <NavbarScroll />

      <main>
        {/* HERO SECTION */}
        <section className="container hero animate-fade-up animate-delay-1">
          <div className="hero-grid">
            {/* Kiri: teks */}
            <section>
              <div className="hero-badge">
                <span>✨</span>
                <span>Distraction-free financial planning</span>
              </div>
              <h1 className="hero-title">
                Where Intelligent Planning
                <span> Meets Timeless Elegance.</span>
              </h1>
              <p className="hero-sub">
                Nadnad Invest adalah platform perencanaan keuangan modern yang
                mengubah cara Anda merancang masa depan—lebih tenang, lebih
                terukur, dan lebih elegan. Bukan ruang spekulasi, tetapi ruang
                latihan untuk pola pikir finansial yang dewasa.
              </p>

              <div className="hero-actions">
                <button className="btn-main">Start Your Intelligent Journey</button>
                <a href="#paket" className="btn-ghost">
                  Experience the Simulation
                </a>
              </div>

              <div className="hero-meta">
                <span>
                  <strong>Designed for those who value clarity over noise.</strong>
                </span>
              </div>
            </section>

            {/* Kanan: kartu simulasi */}
            <aside className="hero-card animate-fade-up animate-delay-2">
              <div className="hero-card-header">
                <div className="hero-card-title">
                  Simulation: “Stabil Elegan”
                </div>
                <span className="pill-safe">Conservative precision</span>
              </div>

              <div className="hero-card-amount">Rp 185.000.000</div>
              <p className="hero-card-caption">
                Ilustrasi nilai rencana dengan setoran konsisten dan asumsi
                pertumbuhan stabil. Bukan proyeksi resmi atau janji hasil—hanya
                visual yang membantu Anda melihat gambaran besar.
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
                  <div style={{ color: "#9ca3af" }}>Monthly simulated deposit</div>
                  <div style={{ fontWeight: 600 }}>Rp 750.000</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Plan horizon</div>
                  <div style={{ fontWeight: 600 }}>8 years</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Risk profile</div>
                  <div style={{ fontWeight: 600 }}>Conservative · stability first</div>
                </div>
                <div>
                  <div style={{ color: "#9ca3af" }}>Visual theme</div>
                  <div style={{ fontWeight: 600 }}>
                    Gold · Black · Silver · White
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ================================
           SECTION: Paket Simulasi (versi premium)
        ================================= */}
        <section
          id="paket"
          className="container section animate-fade-up animate-delay-1"
        >
          <div className="section-header">
            <div className="section-eyebrow">Simulation packages</div>
            <h2 className="section-title">Choose your simulation style</h2>
            <p className="section-subtitle">
              Setiap paket dirancang untuk mewakili karakter berbeda: stabil,
              seimbang, hingga agresif elegan. Semuanya masih berupa simulasi—
              ruang aman untuk belajar sebelum memasuki instrumen nyata.
            </p>
          </div>

          <div className="package-grid">
            {/* Paket 1 */}
            <article className="card animate-fade-up animate-delay-1">
              <div className="chip">Conservative</div>
              <h3 className="card-title">Stabil Elegan</h3>
              <p className="card-text">
                Stabilitas adalah bentuk kemewahan tertinggi. Paket ini cocok
                untuk Anda yang mengutamakan rasa aman dan kestabilan nilai.
              </p>

              <ul className="card-bullets">
                <li>Pergerakan simulasi yang halus dan terkendali</li>
                <li>Cocok untuk dana darurat dan rencana jangka pendek</li>
                <li>Membangun fondasi kebiasaan menabung yang konsisten</li>
              </ul>

              <div className="card-meta">
                Minimal simulated plan: <strong>Rp 100.000</strong>
                <br />
                Recommended horizon: 1–3 years
              </div>

              <div className="package-footer">
                <div className="price">Rp 100.000+</div>
                <button className="btn-small">View details</button>
              </div>
            </article>

            {/* Paket 2 (paling populer) */}
            <article className="card card-highlight animate-fade-up animate-delay-2">
              <div className="card-ribbon">Most selected</div>
              <div className="chip">Moderate</div>
              <h3 className="card-title">Rencana Pendidikan</h3>
              <p className="card-text">
                Seimbang antara pertumbuhan dan ketenangan. Cocok untuk orang
                tua dan keluarga yang ingin menyiapkan masa depan anak dengan
                ritme yang realistis.
              </p>

              <ul className="card-bullets">
                <li>Pertumbuhan simulasi yang terukur namun tetap stabil</li>
                <li>Mudah dijadikan bahan diskusi dengan pasangan & keluarga</li>
                <li>Ideal untuk rencana 5–10 tahun</li>
              </ul>

              <div className="card-meta">
                Minimal simulated plan: <strong>Rp 250.000</strong>
                <br />
                Recommended horizon: 5–10 years
              </div>

              <div className="package-footer">
                <div className="price">Rp 250.000+</div>
                <button className="btn-small btn-main-small">
                  View details
                </button>
              </div>
            </article>

            {/* Paket 3 */}
            <article className="card animate-fade-up animate-delay-3">
              <div className="chip">Elegant aggressive</div>
              <h3 className="card-title">Pensiun Mandiri</h3>
              <p className="card-text">
                Untuk Anda yang melihat jauh ke depan. Simulasi dengan potensi
                pertumbuhan lebih besar, disajikan dengan visual yang tetap
                tenang dan elegan.
              </p>

              <ul className="card-bullets">
                <li>Fokus pada horizon panjang dan akumulasi bertahap</li>
                <li>Cocok untuk rencana pensiun dan legacy planning</li>
                <li>Membiasakan diri dengan dinamika naik-turun yang sehat</li>
              </ul>

              <div className="card-meta">
                Minimal simulated plan: <strong>Rp 500.000</strong>
                <br />
                Recommended horizon: 10+ years
              </div>

              <div className="package-footer">
                <div className="price">Rp 500.000+</div>
                <button className="btn-small">View details</button>
              </div>
            </article>
          </div>
        </section>

        {/* ================================
           SECTION: Cara Kerja (premium)
        ================================= */}
        <section
          id="cara-kerja"
          className="container section animate-fade-up animate-delay-1"
        >
          <div className="section-header">
            <div className="section-eyebrow">How it works</div>
            <h2 className="section-title">A calm, structured way to plan</h2>
            <p className="section-subtitle">
              Prosesnya dibuat sesederhana mungkin. Fokusnya bukan pada “cepat
              kaya”, melainkan pada membangun ritme dan pola pikir yang dewasa.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "1.2rem",
            }}
          >
            <div className="card animate-fade-up animate-delay-1">
              <div className="chip">Step 1</div>
              <h3 className="card-title">Define your destination</h3>
              <p className="card-text">
                Tentukan apakah fokusmu dana darurat, pendidikan, pensiun, atau
                kebebasan finansial. Arah yang jelas adalah separuh keputusan.
              </p>
            </div>

            <div className="card animate-fade-up animate-delay-2">
              <div className="chip">Step 2</div>
              <h3 className="card-title">Choose your simulation style</h3>
              <p className="card-text">
                Pilih paket simulasi yang paling sesuai dengan karakter dan
                horizon waktu yang kamu inginkan—konservatif, seimbang, atau
                agresif elegan.
              </p>
            </div>

            <div className="card animate-fade-up animate-delay-3">
              <div className="chip">Step 3</div>
              <h3 className="card-title">Observe, reflect, refine</h3>
              <p className="card-text">
                Amati pola, evaluasi ulang, dan perbaiki rencana. Di sini,
                tujuan utamanya adalah memperhalus cara berpikirmu sebelum
                masuk ke dunia finansial sesungguhnya.
              </p>
            </div>
          </div>
        </section>

        {/* ================================
           SECTION: Testimoni
        ================================= */}
        <section
          id="testimoni"
          className="container section animate-fade-up animate-delay-1"
        >
          <div className="section-header">
            <div className="section-eyebrow">Testimonials</div>
            <h2 className="section-title">Trusted by thoughtful planners</h2>
            <p className="section-subtitle">
              Mereka tidak mengejar sensasi. Mereka mengejar kejelasan, ritme,
              dan hubungan yang lebih dewasa dengan uang.
            </p>
          </div>

          <div className="testimonials">
            <article className="testimonial-card animate-fade-up animate-delay-1">
              <p className="testimonial-text">
                “A rare platform that respects my pace. Tidak memaksa, tidak
                mengiming-imingi. Justru karena itu aku merasa lebih percaya.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Adit</div>
                  <div className="testimonial-role">
                    Consultant, fokus jangka panjang
                  </div>
                </div>
              </div>
            </article>

            <article className="testimonial-card animate-fade-up animate-delay-2">
              <p className="testimonial-text">
                “Feels like having a private financial planner. Elegan, tenang,
                dan tidak bising. Aku bisa berpikir jernih tanpa merasa dikejar
                pasar.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Hana</div>
                  <div className="testimonial-role">Entrepreneur</div>
                </div>
              </div>
            </article>

            <article className="testimonial-card animate-fade-up animate-delay-3">
              <p className="testimonial-text">
                “The design alone changes the way I think about money. Sederhana
                tapi terasa mahal. Nadnad Invest lebih mirip ruang refleksi
                daripada aplikasi trading.”
              </p>
              <div className="testimonial-footer">
                <div>
                  <div className="testimonial-name">Rangga</div>
                  <div className="testimonial-role">34, creative professional</div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ================================
           SECTION: CTA
        ================================= */}
        <section className="container section">
          <div className="cta animate-fade-up animate-delay-1">
            <div>
              <div className="cta-title">
                Craft your financial tomorrow with calm, clarity, and class.
              </div>
              <div className="cta-sub">
                Tidak ada setoran, tidak ada janji palsu. Nadnad Invest memberi
                Anda ruang untuk berlatih—sebelum benar-benar berkomitmen pada
                instrumen keuangan apa pun.
              </div>
            </div>
            <div className="cta-actions">
              <button className="btn-main">Start Your Intelligent Journey</button>
              <a href="/dashboard" className="btn-ghost">
                See the Dashboard Experience
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
            <a href="/about">Tentang Nadnad Invest</a>
          </div>
        </div>
      </footer>
    </>
  );
}
