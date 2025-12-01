// app/promo/balance-boost/page.js
"use client";

import Link from "next/link";

export default function PromoBalanceBoostPage() {
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
                Promo · Nadnad Balance Boost
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
              Legal
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

        {/* HERO / INTRO */}
        <section className="nanad-landing-hero">
          <div className="nanad-landing-hero-left">
            <p className="nanad-landing-eyebrow">
              Promo 3 Bulan · Nadnad Balance Boost
            </p>
            <h1 className="nanad-landing-heading">
              Catat setoranmu,
              <span> menangkan bonus saldo ke dompet Nadnad.</span>
            </h1>
            <p className="nanad-landing-hero-text">
              Selama periode promo, setiap setoran yang kamu catat di dompet
              Nadnad akan diikutkan dalam{" "}
              <strong>program undian hadiah saldo</strong>. Ini adalah program
              promo terbatas, bukan produk investasi dan{" "}
              <strong>bukan janji imbal hasil tetap</strong>.
            </p>

            <div className="nanad-landing-hero-cta">
              <Link href="/register" className="nanad-landing-cta-primary">
                Daftar &amp; mulai catat setoran
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dompet Nadnad
              </Link>
            </div>

            <p className="nanad-landing-hero-note">
              Catatan: Promo ini bersifat{" "}
              <strong>undian hadiah / reward draw</strong>. Tidak semua
              pengguna akan mendapatkan bonus, dan Nanad Invest tidak
              menjanjikan keuntungan tertentu untuk setiap peserta.
            </p>
          </div>

          {/* KARTU RINGKASAN PROMO */}
          <div className="nanad-landing-hero-right">
            <div className="nanad-landing-preview-card">
              <div className="nanad-landing-preview-header">
                <span>Ringkasan promo</span>
                <span className="nanad-landing-demo-pill">
                  Periode terbatas
                </span>
              </div>

              <div className="nanad-landing-preview-stats">
                <div className="nanad-landing-preview-stat">
                  <span>Durasi promo</span>
                  <strong>3 bulan</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Jenis hadiah</span>
                  <strong>Bonus saldo dompet</strong>
                </div>
                <div className="nanad-landing-preview-stat">
                  <span>Mekanisme</span>
                  <strong>Undian per tier setoran</strong>
                </div>
              </div>

              <p className="nanad-landing-preview-footnote">
                Semakin besar dan konsisten setoran yang kamu catat, semakin
                tinggi tier promo yang kamu masuki. Pemenang dipilih secara
                acak di setiap tier sesuai ketentuan yang berlaku.
              </p>
            </div>
          </div>
        </section>

        {/* CARA KERJA SINGKAT */}
        <section className="nanad-landing-section" id="cara-kerja">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Cara kerja promo</p>
            <h2>
              Tiga langkah sederhana untuk ikut Nadnad Balance Boost Reward Draw.
            </h2>
          </div>

          <ol className="nanad-landing-steps">
            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">01</span>
              <div>
                <h3>Catat setoran ke dompet Nadnad</h3>
                <p>
                  Setiap kali kamu menambah dana di rekening / e-wallet nyata,
                  kamu mencatatnya sebagai setoran di dompet Nadnad. Nominal
                  bulanan yang tercatat akan menentukan tier promo kamu.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">02</span>
              <div>
                <h3>Masuk ke tier berdasarkan total setoran</h3>
                <p>
                  Di akhir bulan promo, sistem akan melihat total setoran yang
                  <strong> tercatat</strong> di dompet Nadnad, lalu
                  mengelompokkanmu ke tier Bronze, Silver, Gold, atau Diamond.
                </p>
              </div>
            </li>

            <li className="nanad-landing-step">
              <span className="nanad-landing-step-number">03</span>
              <div>
                <h3>Undian bonus saldo per tier</h3>
                <p>
                  Setiap tier memiliki jumlah pemenang dan batas maksimal bonus
                  yang berbeda. Pemenang dipilih secara acak di setiap tier,
                  dan akan menerima{" "}
                  <strong>bonus saldo ke dompet Nadnad</strong> sesuai
                  ketentuan.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* DETAIL TIER */}
        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Struktur tier promo</p>
            <h2>
              Tier Bronze, Silver, Gold, dan Diamond dengan peluang hadiah
              yang berbeda.
            </h2>
          </div>

          <div className="nanad-landing-value-grid">
            {/* BRONZE */}
            <article className="nanad-landing-value-card">
              <h3>Tier Bronze</h3>
              <p>
                Untuk total setoran bulanan{" "}
                <strong>Rp 100.000 s.d. &lt; Rp 1.000.000</strong>.
              </p>
              <ul style={{ paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                <li>Jumlah pemenang: sekitar 30 orang per bulan.</li>
                <li>
                  Bonus undian: hingga <strong>1%</strong> dari total setoran
                  bulan itu.
                </li>
                <li>
                  Batas bonus per pemenang:{" "}
                  <strong>maksimal Rp 25.000</strong>.
                </li>
              </ul>
            </article>

            {/* SILVER */}
            <article className="nanad-landing-value-card">
              <h3>Tier Silver</h3>
              <p>
                Untuk total setoran bulanan{" "}
                <strong>Rp 1.000.000 s.d. &lt; Rp 10.000.000</strong>.
              </p>
              <ul style={{ paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                <li>Jumlah pemenang: sekitar 20 orang per bulan.</li>
                <li>
                  Bonus undian: hingga <strong>2%</strong> dari total setoran.
                </li>
                <li>
                  Batas bonus per pemenang:{" "}
                  <strong>maksimal Rp 150.000</strong>.
                </li>
              </ul>
            </article>

            {/* GOLD */}
            <article className="nanad-landing-value-card">
              <h3>Tier Gold</h3>
              <p>
                Untuk total setoran bulanan{" "}
                <strong>Rp 10.000.000 s.d. &lt; Rp 50.000.000</strong>.
              </p>
              <ul style={{ paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                <li>Jumlah pemenang: sekitar 10 orang per bulan.</li>
                <li>
                  Bonus undian: hingga <strong>3%</strong> dari total setoran.
                </li>
                <li>
                  Batas bonus per pemenang:{" "}
                  <strong>maksimal Rp 600.000</strong>.
                </li>
              </ul>
            </article>

            {/* DIAMOND */}
            <article className="nanad-landing-value-card">
              <h3>Tier Diamond</h3>
              <p>
                Untuk total setoran bulanan{" "}
                <strong>Rp 50.000.000 ke atas</strong>.
              </p>
              <ul style={{ paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                <li>Jumlah pemenang: sekitar 5 orang per bulan.</li>
                <li>
                  Bonus undian: hingga <strong>5%</strong> dari total setoran.
                </li>
                <li>
                  Batas bonus per pemenang:{" "}
                  <strong>maksimal Rp 1.500.000</strong>.
                </li>
              </ul>
            </article>
          </div>

          <p className="nanad-landing-hero-note" style={{ marginTop: "1rem" }}>
            Angka jumlah pemenang dan batas maksimum bonus dapat disesuaikan
            oleh pengelola promo dari waktu ke waktu. Informasi terbaru akan
            diumumkan di halaman ini atau kanal resmi lainnya.
          </p>
        </section>

        {/* CONTOH SIMULASI (INFO) */}
        <section className="nanad-landing-section">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Contoh ilustrasi</p>
            <h2>
              Simulasi sederhana untuk membayangkan skenario bonus (bukan janji
              hasil).
            </h2>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{
              marginTop: "0.9rem",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              maxWidth: "720px",
            }}
          >
            <p style={{ marginBottom: "0.6rem" }}>
              Misalnya kamu berada di <strong>Tier Silver</strong> dengan total
              setoran bulan ini sebesar <strong>Rp 3.000.000</strong>. Jika
              kamu terpilih sebagai salah satu pemenang, sistem dapat memberikan
              bonus hingga <strong>2%</strong> dari Rp 3.000.000, yaitu
              Rp 60.000, selama tidak melebihi batas maksimum Rp 150.000 per
              pengguna.
            </p>

            <p style={{ marginBottom: "0.6rem" }}>
              Contoh ini hanyalah ilustrasi. Dalam praktiknya,{" "}
              <strong>tidak semua peserta akan mendapatkan bonus</strong>, dan
              bonus hanya diberikan kepada pengguna yang terpilih sebagai
              pemenang undian di tiap tier.
            </p>

            <p
              style={{
                marginTop: "0.8rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              Ilustrasi di atas bukan rekomendasi keuangan, bukan janji hasil,
              dan tidak boleh dijadikan satu-satunya dasar pengambilan keputusan
              finansial.
            </p>
          </div>
        </section>

        {/* FAQ SINGKAT PROMO */}
        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">FAQ promo</p>
            <h2>Pertanyaan singkat seputar Nadnad Balance Boost.</h2>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{
              marginTop: "0.9rem",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              maxWidth: "720px",
            }}
          >
            <h3 style={{ fontSize: "0.95rem", marginTop: 0 }}>
              1. Apakah promo ini sama dengan investasi?
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Tidak. Promo ini adalah{" "}
              <strong>program undian hadiah saldo</strong> sekaligus kampanye
              pengenalan dompet Nadnad. Promo ini tidak mengubah fakta bahwa
              Nanad Invest hanyalah ruang pencatatan &amp; simulasi, bukan
              lembaga investasi atau penitipan dana.
            </p>

            <h3 style={{ fontSize: "0.95rem" }}>
              2. Apakah semua peserta pasti mendapatkan bonus?
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Tidak. Pemenang dipilih secara acak di tiap tier sesuai kuota yang
              telah ditentukan. Peserta yang tidak terpilih tidak akan menerima
              bonus saldo promo.
            </p>

            <h3 style={{ fontSize: "0.95rem" }}>
              3. Dari mana bonus saldo ini dibayarkan?
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Bonus saldo promo ini berasal dari alokasi dana promosi pengelola,
              bukan dari hasil pengelolaan dana peserta. Promo ini bersifat{" "}
              <strong>jangka pendek dan terbatas</strong>.
            </p>

            <h3 style={{ fontSize: "0.95rem" }}>
              4. Apakah uang saya disimpan di Nadnad?
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Tidak. Uangmu tetap berada di rekening bank, e-wallet, atau akun
              lain milikmu. Dompet Nadnad hanyalah catatan administratif dan
              simulasi, sesuai dengan penjelasan di halaman{" "}
              <Link href="/legal" style={{ color: "#f5d17a" }}>
                Legal &amp; Disclaimer
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CTA BOTTOM */}
        <section className="nanad-landing-bottom-cta">
          <div className="nanad-landing-bottom-cta-inner">
            <div>
              <h2>Mau coba ikut promo Nadnad Balance Boost?</h2>
              <p>
                Mulai dari setoran kecil dulu. Yang penting, kamu punya catatan
                yang rapi dan kesempatan tambahan melalui undian saldo promo.
              </p>
            </div>
            <div className="nanad-landing-bottom-cta-actions">
              <Link href="/register" className="nanad-landing-cta-primary">
                Daftar &amp; mulai catat setoran
              </Link>
              <Link href="/login" className="nanad-landing-cta-secondary">
                Masuk ke dompet Nadnad
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>
              © {new Date().getFullYear()} Nanad Invest. All rights reserved.
            </span>
            <span>
              Nanad Invest adalah ruang simulasi &amp; perencanaan keuangan
              pribadi. Promo Nadnad Balance Boost bersifat undian hadiah, bukan
              produk investasi dan tidak menjanjikan imbal hasil tertentu.
            </span>
          </div>
          <div className="nanad-landing-footer-links">
            <Link href="/about">Tentang</Link>
            <Link href="/legal">Legal &amp; Disclaimer</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
