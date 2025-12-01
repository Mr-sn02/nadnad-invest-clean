// app/promo/balance-boost/page.js
"use client";

import Link from "next/link";

export default function BalanceBoostPromoPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        {/* HEADER MINI */}
        <header className="nanad-landing-header">
          <div className="nanad-landing-brand">
            <div className="nanad-landing-logo">D</div>
            <div>
              <p className="nanad-landing-brand-title">Dompet Nadnad</p>
              <p className="nanad-landing-brand-sub">
                Dompet perencanaan &amp; simulasi dana
              </p>
            </div>
          </div>

          <nav className="nanad-landing-nav">
            <Link href="/landing" className="nanad-landing-nav-link">
              Beranda
            </Link>
            <Link href="/about" className="nanad-landing-nav-link">
              Tentang
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

        {/* HERO PROMO */}
        <section className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Promo · Balance Boost</p>
            <h1>Program Promo Balance Boost Dompet Nadnad</h1>
          </div>

          <div
            style={{
              marginTop: "0.9rem",
              fontSize: "0.88rem",
              lineHeight: 1.7,
              maxWidth: "760px",
            }}
          >
            <p style={{ marginBottom: "0.6rem" }}>
              <strong>Balance Boost</strong> adalah program promo terbatas dari{" "}
              <strong>Dompet Nadnad</strong> selama kurang lebih{" "}
              <strong>3 bulan periode kampanye</strong>. Di program ini, sebagian
              pengguna yang aktif mencatat setoran di Dompet Nadnad berkesempatan
              mendapatkan <strong>hadiah tambahan saldo</strong> di dompet Nadnad
              mereka.
            </p>

            <p style={{ marginBottom: "0.6rem" }}>
              Hadiah ini sifatnya{" "}
              <strong>bonus promo &amp; undian</strong>, bukan janji imbal hasil
              tetap. <u>Tidak semua peserta akan mendapatkan hadiah</u>, dan
              besaran hadiah maksimal mengikuti batas masing-masing tier di bawah.
            </p>

            <p style={{ marginBottom: "0.6rem" }}>
              Dana nyata tetap berada di{" "}
              <strong>rekening bank / e-wallet resmi</strong> milik pengguna.
              Dompet Nadnad hanya mencatat dan mensimulasikan alur dana, serta
              memberikan hadiah promo ke sebagian pengguna terpilih.
            </p>

            <div
              style={{
                marginTop: "0.8rem",
                padding: "0.8rem 1rem",
                borderRadius: "18px",
                border: "1px solid rgba(250,204,21,0.4)",
                background:
                  "radial-gradient(circle at top, rgba(250,204,21,0.08), rgba(15,23,42,1))",
                fontSize: "0.8rem",
              }}
            >
              <p style={{ margin: 0 }}>
                ⚠️ <strong>Catatan penting:</strong> ini adalah{" "}
                <strong>program promo &amp; hadiah</strong>, bukan produk
                investasi, bukan skema bagi hasil, dan bukan janji keuntungan
                berkelanjutan. Program dapat dihentikan atau diubah sewaktu-waktu
                sesuai kebijakan pengelola.
              </p>
            </div>
          </div>
        </section>

        {/* CARA KERJA SINGKAT */}
        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Cara kerja</p>
            <h2>Bagaimana Balance Boost berjalan?</h2>
          </div>

          <ol
            className="nanad-landing-steps"
            style={{ fontSize: "0.88rem", lineHeight: 1.7 }}
          >
            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">01</span>
              <div>
                <h3>Catat setoran seperti biasa</h3>
                <p>
                  Kamu mencatat setoran ke Dompet Nadnad melalui fitur{" "}
                  <strong>Deposit</strong>. Biasanya, admin akan memverifikasi
                  dan mengubah status menjadi <strong>APPROVED</strong> jika
                  bukti setoran valid.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">02</span>
              <div>
                <h3>Rekap total setoran bulanan</h3>
                <p>
                  Di akhir bulan, tim akan menghitung total setoran bersih yang
                  berstatus <strong>APPROVED</strong> di Dompet Nadnad selama
                  bulan tersebut, lalu mengelompokkan pengguna ke dalam{" "}
                  <strong>tier nominal</strong>.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">03</span>
              <div>
                <h3>Pemilihan pemenang per tier</h3>
                <p>
                  Dari setiap tier, akan dipilih sejumlah pengguna sebagai{" "}
                  <strong>penerima hadiah promo</strong>. Pemilihan dilakukan
                  secara terbatas &amp; fair sesuai mekanisme internal (misalnya
                  undian / random draw / kriteria tertentu yang transparan).
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">04</span>
              <div>
                <h3>Hadiah masuk ke Dompet Nadnad</h3>
                <p>
                  Pengguna yang terpilih akan menerima{" "}
                  <strong>bonus saldo</strong> di Dompet Nadnad, dengan besaran{" "}
                  <strong>maksimal</strong> sesuai ketentuan tier (persentase dan
                  batas rupiah). Bonus ini akan tercatat sebagai transaksi
                  promo/hadiah.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* TABEL TIER PROMO */}
        <section className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Struktur hadiah</p>
            <h2>Tier Balance Boost &amp; batas hadiah per bulan</h2>
          </div>

          <div className="nanad-landing-value-grid">
            {/* Bronze */}
            <article className="nanad-landing-value-card">
              <h3>Tier Bronze</h3>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
                <strong>Nominal setoran:</strong> Rp 100.000 s.d. &lt; Rp 1.000.000{" "}
                (total setoran <em>bulan itu</em>).
                <br />
                <strong>Kuota pemenang (contoh):</strong> ± 30 orang per bulan.
                <br />
                <strong>Bonus promo:</strong> hingga{" "}
                <strong>1% dari total setoran</strong> bulan itu.
                <br />
                <strong>Batas maksimum:</strong> Rp 25.000 per user per bulan.
              </p>
            </article>

            {/* Silver */}
            <article className="nanad-landing-value-card">
              <h3>Tier Silver</h3>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
                <strong>Nominal setoran:</strong> Rp 1.000.000 s.d. &lt; Rp
                10.000.000.
                <br />
                <strong>Kuota pemenang (contoh):</strong> ± 20 orang per bulan.
                <br />
                <strong>Bonus promo:</strong> hingga{" "}
                <strong>2% dari total setoran</strong>.
                <br />
                <strong>Batas maksimum:</strong> Rp 150.000 per user per bulan.
              </p>
            </article>

            {/* Gold */}
            <article className="nanad-landing-value-card">
              <h3>Tier Gold</h3>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
                <strong>Nominal setoran:</strong> Rp 10.000.000 s.d. &lt; Rp
                50.000.000.
                <br />
                <strong>Kuota pemenang (contoh):</strong> ± 10 orang per bulan.
                <br />
                <strong>Bonus promo:</strong> hingga{" "}
                <strong>3% dari total setoran</strong>.
                <br />
                <strong>Batas maksimum:</strong> Rp 600.000 per user per bulan.
              </p>
            </article>

            {/* Diamond */}
            <article className="nanad-landing-value-card">
              <h3>Tier Diamond</h3>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
                <strong>Nominal setoran:</strong> Rp 50.000.000 ke atas.
                <br />
                <strong>Kuota pemenang (contoh):</strong> ± 5 orang per bulan.
                <br />
                <strong>Bonus promo:</strong> hingga{" "}
                <strong>5% dari total setoran</strong>.
                <br />
                <strong>Batas maksimum:</strong> Rp 1.500.000 per user per bulan.
              </p>
            </article>
          </div>

          <p
            className="nanad-dashboard-body"
            style={{
              marginTop: "0.8rem",
              fontSize: "0.8rem",
              maxWidth: "760px",
            }}
          >
            Angka kuota dan persentase di atas adalah contoh struktur promo yang
            bisa disesuaikan sewaktu-waktu oleh pengelola Dompet Nadnad. Jika
            ada perubahan, informasi resmi akan disampaikan melalui kanal
            komunikasi yang disepakati (misalnya WhatsApp atau pengumuman di
            aplikasi).
          </p>
        </section>

        {/* CONTOH PERHITUNGAN (BUKAN JANJI) */}
        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Contoh simulasi</p>
            <h2>Ilustrasi sederhana (bukan janji hasil)</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr)",
              gap: "0.8rem",
              fontSize: "0.84rem",
              lineHeight: 1.7,
              maxWidth: "760px",
            }}
          >
            <div
              style={{
                borderRadius: "18px",
                padding: "0.9rem 1rem",
                border: "1px solid rgba(148,163,184,0.6)",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
              }}
            >
              <strong>Contoh 1 – Bronze</strong>
              <p style={{ marginTop: "0.35rem" }}>
                Kamu mencatat total setoran sebesar{" "}
                <strong>Rp 500.000</strong> dalam 1 bulan dan masuk ke tier{" "}
                <strong>Bronze</strong>.
                <br />
                Jika kamu terpilih sebagai pemenang promo, hadiah maksimal
                adalah <strong>1% × 500.000 = Rp 5.000</strong> (masih di bawah
                batas maksimum Rp 25.000).
              </p>
            </div>

            <div
              style={{
                borderRadius: "18px",
                padding: "0.9rem 1rem",
                border: "1px solid rgba(148,163,184,0.6)",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
              }}
            >
              <strong>Contoh 2 – Gold</strong>
              <p style={{ marginTop: "0.35rem" }}>
                Kamu mencatat total setoran sebesar{" "}
                <strong>Rp 20.000.000</strong> dan masuk ke tier{" "}
                <strong>Gold</strong>.
                <br />
                Jika terpilih sebagai penerima promo, hadiah maksimal adalah{" "}
                <strong>3% × 20.000.000 = Rp 600.000</strong> (pas dengan batas
                maksimum Rp 600.000).
              </p>
            </div>

            <div
              style={{
                borderRadius: "18px",
                padding: "0.9rem 1rem",
                border: "1px solid rgba(148,163,184,0.6)",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
              }}
            >
              <strong>Penting:</strong>
              <p style={{ marginTop: "0.35rem" }}>
                Contoh di atas <strong>hanya ilustrasi</strong>. Tidak semua
                pengguna akan terpilih sebagai pemenang. Besaran hadiah promo
                aktual akan mengikuti keputusan akhir pengelola dan bisa lebih
                kecil dari nilai maksimal.
              </p>
            </div>
          </div>
        </section>

        {/* SYARAT RINGKAS & CTA */}
        <section className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Ketentuan singkat</p>
            <h2>Syarat ringkas program Balance Boost</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr)",
              maxWidth: "780px",
              gap: "0.75rem",
              fontSize: "0.84rem",
              lineHeight: 1.7,
            }}
          >
            <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
              <li>
                Berlaku untuk setoran yang tercatat dan berstatus{" "}
                <strong>APPROVED</strong> di Dompet Nadnad pada bulan berjalan.
              </li>
              <li>
                Akun tidak dalam status diblokir, diputus, atau melanggar
                ketentuan penggunaan Dompet Nadnad.
              </li>
              <li>
                Pemenang dan besaran hadiah promo ditentukan sepenuhnya oleh
                pengelola sesuai mekanisme internal yang wajar &amp; terukur.
              </li>
              <li>
                Program dapat dihentikan atau diubah sewaktu-waktu. Versi
                ketentuan terbaru akan diumumkan melalui kanal resmi.
              </li>
              <li>
                Balance Boost tidak mengubah fakta bahwa Dompet Nadnad{" "}
                <strong>bukan lembaga keuangan berizin</strong> dan{" "}
                <strong>tidak menjanjikan imbal hasil investasi</strong>.
              </li>
            </ul>

            <div
              style={{
                borderRadius: "18px",
                padding: "0.9rem 1rem",
                border: "1px solid rgba(148,163,184,0.4)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
              }}
            >
              <p style={{ marginBottom: "0.6rem" }}>
                Untuk penjelasan lebih rinci, silakan lihat juga halaman{" "}
                <Link
                  href="/legal"
                  style={{ color: "#f5d17a", textDecoration: "underline" }}
                >
                  Legal &amp; Disclaimer
                </Link>{" "}
                dan{" "}
                <Link
                  href="/terms"
                  style={{ color: "#f5d17a", textDecoration: "underline" }}
                >
                  Syarat &amp; Ketentuan
                </Link>
                .
              </p>

              <div className="nanad-landing-bottom-cta-actions">
                <Link
                  href="/login"
                  className="nanad-landing-cta-secondary"
                  style={{ marginRight: "0.4rem" }}
                >
                  Masuk ke Dompet Nadnad
                </Link>
                <Link href="/wallet" className="nanad-landing-cta-primary">
                  Buka halaman dompet
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
            <Link href="/about">Tentang</Link>
            <Link href="/legal">Legal &amp; Disclaimer</Link>
            <Link href="/promo/balance-boost">Promo Balance Boost</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
