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

      <main className="container hero">
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
              rencana keuangan.
            </p>

            <div className="hero-actions">
              <button className="btn-main">Mulai simulasi</button>
              <a href="/dashboard" className="btn-ghost">
                Lihat tampilan dashboard
              </a>
            </div>

            <div className="hero-meta">
              <span>
                <strong>Gold</strong> · fokus pada nilai jangka panjang
              </span>
              <span>
                <strong>Black</strong> · ketenangan &amp; kontrol penuh
              </span>
              <span>
                <strong>Silver</strong> · data rapi &amp; modern
              </span>
            </div>
          </section>

          {/* Kanan: kartu simulasi */}
          <aside className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-title">Simulasi paket “Stabil Elegan”</div>
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
      </main>
    </>
  );
}
