export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <div className="container">
        {/* Breadcrumb / judul atas */}
        <header className="dash-header animate-fade-up animate-delay-1">
          <div>
            <div className="dash-eyebrow">Nadnad Invest · Demo Dashboard</div>
            <h1 className="dash-title">Gambaran rencana investasimu</h1>
            <p className="dash-sub">
              Semua angka di halaman ini masih berupa simulasi ilustratif. Tujuannya
              untuk membantumu merasa tenang, terarah, dan terbiasa melihat pola
              pergerakan nilai dalam jangka panjang.
            </p>
          </div>
          <div className="dash-badge">
            Mode simulasi · <span>Tanpa dana sungguhan</span>
          </div>
        </header>

        {/* Kartu ringkasan utama */}
        <section className="dash-cards">
          <article className="dash-card animate-fade-up animate-delay-1">
            <div className="dash-card-label">Total nilai rencana (simulasi)</div>
            <div className="dash-card-value">Rp 185.000.000</div>
            <div className="dash-card-hint">Dengan setoran konsisten setiap bulan</div>
          </article>

          <article className="dash-card animate-fade-up animate-delay-2">
            <div className="dash-card-label">Setoran bulanan simulasi</div>
            <div className="dash-card-value">Rp 750.000</div>
            <div className="dash-card-hint">
              Bisa diubah sesuai kemampuan dan kenyamananmu.
            </div>
          </article>

          <article className="dash-card animate-fade-up animate-delay-3">
            <div className="dash-card-label">Horisontal waktu simulasi</div>
            <div className="dash-card-value">8 tahun</div>
            <div className="dash-card-hint">
              Cocok untuk rencana jangka menengah hingga panjang.
            </div>
          </article>
        </section>

        {/* Grid utama: grafik + profil */}
        <section className="dash-main-grid">
          {/* “Grafik” perjalanan nilai (ilustrasi visual) */}
          <div className="dash-panel animate-fade-up animate-delay-1">
            <div className="dash-panel-header">
              <div>
                <div className="dash-panel-title">Perjalanan nilai rencana</div>
                <div className="dash-panel-sub">
                  Visualisasi sederhana agar kamu terbiasa dengan konsep naik-turun
                  yang tetap bergerak naik dalam jangka panjang.
                </div>
              </div>
              <div className="dash-chip">Simulasi stabil elegan</div>
            </div>

            <div className="dash-chart">
              <div className="dash-chart-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="dash-chart-line" />
                ))}
              </div>
              <div className="dash-chart-bars">
                <div className="bar bar-1" />
                <div className="bar bar-2" />
                <div className="bar bar-3" />
                <div className="bar bar-4" />
                <div className="bar bar-5" />
                <div className="bar bar-6" />
                <div className="bar bar-7" />
                <div className="bar bar-8" />
              </div>
              <div className="dash-chart-caption">
                Ilustrasi pertumbuhan nilai dengan fluktuasi halus dari waktu ke
                waktu. Bukan data asli, hanya contoh visual.
              </div>
            </div>
          </div>

          {/* Panel profil rencana */}
          <div className="dash-panel animate-fade-up animate-delay-2">
            <div className="dash-panel-header">
              <div className="dash-panel-title">Profil rencana simulasi</div>
              <div className="dash-panel-sub">
                Ringkasan karakter rencana agar kamu selalu ingat tujuan awal.
              </div>
            </div>

            <dl className="dash-profile">
              <div className="dash-profile-row">
                <dt>Nama paket simulasi</dt>
                <dd>Stabil Elegan</dd>
              </div>
              <div className="dash-profile-row">
                <dt>Tujuan utama</dt>
                <dd>Dana darurat & ketenangan finansial</dd>
              </div>
              <div className="dash-profile-row">
                <dt>Profil risiko</dt>
                <dd>Konservatif · fokus kestabilan</dd>
              </div>
              <div className="dash-profile-row">
                <dt>Frekuensi setoran simulasi</dt>
                <dd>Bulanan</dd>
              </div>
              <div className="dash-profile-row">
                <dt>Nuansa antarmuka</dt>
                <dd>Gold · Black · Silver · White</dd>
              </div>
            </dl>

            <div className="dash-progress-block">
              <div className="dash-progress-header">
                <span>Perkiraan progres menuju target moral</span>
                <span className="dash-progress-value">60%</span>
              </div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill" />
              </div>
              <div className="dash-progress-note">
                “Target moral” di sini bukan angka pasti, tapi patokan pribadi
                tentang rasa cukup dan tenang.
              </div>
            </div>
          </div>
        </section>

        {/* Tabel riwayat simulasi */}
        <section className="dash-table-section animate-fade-up animate-delay-1">
          <div className="dash-table-header">
            <div>
              <div className="dash-panel-title">Ringkasan riwayat simulasi</div>
              <div className="dash-panel-sub">
                Contoh bagaimana setoran rutin dan pertumbuhan simulasi bisa
                membentuk pola dari waktu ke waktu.
              </div>
            </div>
          </div>

          <div className="dash-table-wrapper">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Setoran simulasi</th>
                  <th>Perkiraan pertumbuhan</th>
                  <th>Nilai rencana (simulasi)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tahun 1</td>
                  <td>Rp 9.000.000</td>
                  <td>+3,2%</td>
                  <td>Rp 9.288.000</td>
                </tr>
                <tr>
                  <td>Tahun 2</td>
                  <td>Rp 18.000.000</td>
                  <td>+3,5%</td>
                  <td>Rp 18.630.000</td>
                </tr>
                <tr>
                  <td>Tahun 3</td>
                  <td>Rp 27.000.000</td>
                  <td>+4,0%</td>
                  <td>Rp 28.080.000</td>
                </tr>
                <tr>
                  <td>Tahun 4</td>
                  <td>Rp 36.000.000</td>
                  <td>+4,3%</td>
                  <td>Rp 37.548.000</td>
                </tr>
                <tr>
                  <td>Tahun 5</td>
                  <td>Rp 45.000.000</td>
                  <td>+4,5%</td>
                  <td>Rp 47.025.000</td>
                </tr>
                <tr>
                  <td>Tahun 6</td>
                  <td>Rp 54.000.000</td>
                  <td>+4,8%</td>
                  <td>Rp 56.592.000</td>
                </tr>
                <tr>
                  <td>Tahun 7</td>
                  <td>Rp 63.000.000</td>
                  <td>+5,0%</td>
                  <td>Rp 66.150.000</td>
                </tr>
                <tr>
                  <td>Tahun 8</td>
                  <td>Rp 72.000.000</td>
                  <td>+5,2%</td>
                  <td>Rp 76.000.000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="dash-table-note">
            Angka di atas hanya ilustrasi kasar, bukan perhitungan keuangan yang
            akurat. Tujuan utamanya adalah membantumu terbiasa melihat gambaran
            besar, bukan terpaku pada satu angka.
          </p>
        </section>
      </div>
    </main>
  );
}
