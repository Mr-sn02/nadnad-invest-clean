export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand">
            <div className="brand-icon">Ni</div>
            <div>
              <div className="brand-text">Nadnad Invest</div>
              <div className="brand-sub">Gold · Black · Silver · White</div>
            </div>
          </div>
          <div>
            <a href="/dashboard" className="btn-ghost">
              Demo Dashboard
            </a>
          </div>
        </div>
      </header>

      <main>
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
                rencana keuangan, sebelum benar-benar menaruh dana.
              </p>

              <div className="hero-actions">
                <button className="btn-main">Mulai simulasi</button>
                <a href="#paket" className="btn-ghost">
                  Lihat paket simulasi
                </a>
              </div>

              <div className="hero-meta">
                <span>
                  <strong>Gold</strong> · fokus jangka panjang
                </span>
                <span>
                  <strong>Black</strong> · ketenangan &amp; kontrol
                </span>
                <span>
                  <strong>Silver</strong> · data rapi &amp; modern
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
                Contoh ilustrasi nilai rencana setelah beberapa tahun dengan
                setoran rutin dan asumsi pertumbuhan stabil. Bukan janji hasil,
                hanya contoh visual yang rapi.
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
                  <div style={{ color: "#9ca3af" }}>Nuansa</div>
                  <div style={{ fontWeight: 600 }}>
                    Gold · Black · Silver · White
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* SECTION: Paket simulasi */}
        <section id="paket" className="container section">
          <div className="section-header">
            <div className="section-eyebrow">Paket simulasi</div>
            <h2 className="section-title">Pilih gaya investasimu</h2>
            <p className="section-subtitle">
              Semua paket di bawah ini masih berbentuk simulasi. Cocok untuk
              belajar menyusun rencana sebelum masuk ke instrumen nyata.
            </p>
          </div>

          <div className="package-grid">
            <article className="card">
              <div>
                <div className="chip">Konservatif</div>
                <h3 className="card-title">Stabil Elegan</h3>
                <p className="card-text">
                  Fokus ke kestabilan nilai. Cocok untuk dana darurat dan
                  rencana 1–3 tahun dengan fluktuasi relatif kecil.
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
                  Menjaga keseimbangan antara pertumbuhan dan risiko. Cocok
                  untuk biaya sekolah / kuliah beberapa tahun lagi.
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
                  Untuk kamu yang siap dengan fluktuasi lebih besar demi potensi
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
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>© {new Date().getFullYear()} Nadnad Invest. All rights reserved.</div>
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
