// app/legal/page.js
"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="nanad-landing-page">
      <div className="nanad-landing-shell">
        {/* Header mini */}
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
            <Link href="/landing" className="nanad-landing-nav-link">
              Beranda
            </Link>
            <Link href="/about" className="nanad-landing-nav-link">
              Tentang
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

        <section className="nanad-landing-section nanad-landing-section-soft">
          <div className="nanad-landing-section-header">
            <p className="nanad-landing-eyebrow">Legal &amp; Disclaimer</p>
            <h2>Ketentuan umum penggunaan Nanad Invest</h2>
          </div>

          <div style={{ marginTop: "0.9rem", fontSize: "0.84rem", lineHeight: 1.7 }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "0.3rem" }}>
              1. Sifat layanan
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Nanad Invest menyediakan layanan berupa dashboard digital untuk simulasi dan
              perencanaan keuangan pribadi. Layanan ini berfokus pada pencatatan rencana,
              perhitungan kasar, dan visualisasi progres berdasarkan data yang pengguna
              masukkan sendiri.
            </p>

            <p style={{ marginBottom: "0.6rem" }}>
              Nanad Invest <strong>bukan</strong>:
              <ul style={{ marginLeft: "1.1rem", marginTop: "0.2rem" }}>
                <li>platform penitipan dana atau rekening simpanan,</li>
                <li>penyalur dana ke pihak ketiga,</li>
                <li>penyedia, perantara, atau agen penjual produk investasi,</li>
                <li>penasihat keuangan, investasi, hukum, atau pajak.</li>
              </ul>
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              2. Tidak ada janji imbal hasil
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Setiap angka imbal hasil, persentase keuntungan, ataupun ilustrasi “paket
              simulasi” yang muncul di Nanad Invest hanya merupakan contoh perhitungan dan
              tidak boleh dianggap sebagai:
            </p>
            <ul style={{ marginLeft: "1.1rem", marginBottom: "0.6rem" }}>
              <li>janji atau jaminan keuntungan di masa depan,</li>
              <li>ajakan atau rekomendasi untuk membeli produk tertentu,</li>
              <li>informasi yang cukup untuk mengambil keputusan investasi.</li>
            </ul>
            <p style={{ marginBottom: "0.6rem" }}>
              Keputusan untuk menabung, berinvestasi, atau menggunakan produk keuangan apa
              pun sepenuhnya berada di tangan pengguna dan menjadi tanggung jawab masing-masing.
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              3. Bukan nasihat keuangan atau hukum
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Informasi yang disajikan di Nanad Invest disusun untuk tujuan edukasi umum dan
              simulasi saja. Informasi tersebut <strong>bukan</strong> nasihat keuangan,
              investasi, hukum, atau pajak yang disesuaikan dengan kondisi pribadi pengguna.
            </p>
            <p style={{ marginBottom: "0.6rem" }}>
              Pengguna disarankan untuk berkonsultasi dengan penasihat keuangan, perencana
              keuangan tersertifikasi, penasihat hukum, atau profesional lain yang kompeten
              sebelum mengambil keputusan penting terkait keuangan maupun investasi.
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              4. Data yang dimasukkan pengguna
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Data yang dimasukkan pengguna ke dalam Nanad Invest (seperti nama rencana,
              target dana, setoran, dan catatan pribadi) digunakan untuk menampilkan
              perhitungan dan visualisasi di dashboard pengguna. Nanad Invest tidak meminta
              detail kredensial perbankan (seperti PIN, OTP, password, atau kode keamanan
              satu kali) dan pengguna tidak diperbolehkan membagikan informasi tersebut
              melalui platform ini.
            </p>
            <p style={{ marginBottom: "0.6rem" }}>
              Kami dapat menggunakan data yang telah dianonimkan secara agregat untuk
              keperluan pengembangan fitur, analitik, atau peningkatan kualitas layanan,
              tanpa mengungkap identitas pribadi pengguna.
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              5. Hak cipta &amp; merek
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Seluruh logo, nama layanan <strong>Nanad Invest</strong>, tampilan antarmuka,
              serta teks dan ilustrasi yang terdapat di dalam situs dan aplikasi ini dilindungi
              oleh hak cipta. Pengguna tidak diperkenankan menyalin, memodifikasi, atau
              mendistribusikan materi tersebut tanpa izin tertulis dari pemilik hak yang
              berwenang.
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              6. Batasan tanggung jawab
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Kami berupaya menyajikan informasi dan perhitungan yang akurat sejauh
              kemampuan sistem. Namun, Nanad Invest tidak dapat menjamin bahwa seluruh
              perhitungan, proyeksi, atau informasi bebas dari kesalahan. Pengguna memahami
              bahwa setiap keputusan keuangan yang diambil berdasarkan informasi di Nanad
              Invest merupakan tanggung jawab pribadi pengguna.
            </p>

            <h3 style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}>
              7. Perubahan layanan &amp; ketentuan
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Nanad Invest dapat melakukan pembaruan, penyesuaian, atau penghentian fitur
              sewaktu-waktu untuk alasan pengembangan, keamanan, atau pertimbangan lain.
              Ketentuan ini juga dapat diperbarui dari waktu ke waktu. Versi terbaru akan
              dipublikasikan di halaman ini, dan mulai berlaku sejak tanggal pembaruan.
            </p>

            <p style={{ marginTop: "0.8rem", fontSize: "0.8rem", color: "#9ca3af" }}>
              Catatan: teks ini disusun sebagai template umum dan tidak menggantikan
              nasihat hukum profesional. Untuk kebutuhan kepatuhan yang spesifik, silakan
              konsultasikan dengan penasihat hukum atau konsultan regulasi yang kompeten.
            </p>
          </div>
        </section>

        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>© {new Date().getFullYear()} Nanad Invest. All rights reserved.</span>
            <span>
              Nanad Invest adalah ruang simulasi &amp; perencanaan keuangan pribadi, bukan
              platform penitipan dana maupun penyedia produk investasi.
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
