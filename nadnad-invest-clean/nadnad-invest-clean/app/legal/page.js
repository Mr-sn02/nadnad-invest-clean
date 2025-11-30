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
            <div className="nanad-landing-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-landing-brand-title">Dompet Nadnad</p>
              <p className="nanad-landing-brand-sub">
                Dompet pintar pelanggan &amp; komunitas
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
            <h2>Ketentuan umum penggunaan Dompet Nadnad</h2>
          </div>

          <div
            style={{
              marginTop: "0.9rem",
              fontSize: "0.84rem",
              lineHeight: 1.7,
            }}
          >
            <h3 style={{ fontSize: "0.9rem", marginBottom: "0.3rem" }}>
              1. Sifat layanan
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Dompet Nadnad menyediakan layanan berupa dashboard digital untuk{" "}
              <strong>dompet pintar</strong>, pencatatan transaksi pelanggan,
              serta simulasi arisan dan tabungan/goal. Layanan ini berfokus pada
              pencatatan alur setoran–penarikan, perhitungan sederhana, dan
              visualisasi progres berdasarkan data yang pengguna masukkan
              sendiri.
            </p>

            <p style={{ marginBottom: "0.3rem" }}>
              Dompet Nadnad <strong>bukan</strong>:
            </p>
            <ul
              style={{
                marginLeft: "1.1rem",
                marginTop: "0.2rem",
                marginBottom: "0.6rem",
              }}
            >
              <li>platform penitipan dana atau rekening simpanan,</li>
              <li>penyalur dana ke pihak ketiga,</li>
              <li>penyedia, perantara, atau agen penjual produk investasi,</li>
              <li>penasihat keuangan, investasi, hukum, atau pajak.</li>
            </ul>
            <p style={{ marginBottom: "0.6rem" }}>
              Seluruh pergerakan dana nyata tetap terjadi di{" "}
              <strong>
                rekening bank, e-wallet, kas usaha, atau kanal pembayaran lain
              </strong>{" "}
              yang disepakati di luar aplikasi Dompet Nadnad.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              2. Tidak ada janji imbal hasil
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Setiap angka simulasi, persentase keuntungan, ataupun ilustrasi
              paket yang muncul di Dompet Nadnad hanya merupakan contoh
              perhitungan dan tidak boleh dianggap sebagai:
            </p>
            <ul
              style={{
                marginLeft: "1.1rem",
                marginBottom: "0.6rem",
              }}
            >
              <li>janji atau jaminan keuntungan di masa depan,</li>
              <li>ajakan atau rekomendasi untuk membeli produk tertentu,</li>
              <li>
                informasi yang cukup untuk mengambil keputusan investasi atau
                usaha.
              </li>
            </ul>
            <p style={{ marginBottom: "0.6rem" }}>
              Keputusan untuk menabung, berinvestasi, mengelola arisan, ataupun
              menjalankan model usaha apa pun sepenuhnya berada di tangan
              pengguna dan menjadi tanggung jawab masing-masing.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              3. Bukan nasihat keuangan atau hukum
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Informasi yang disajikan di Dompet Nadnad disusun untuk tujuan{" "}
              <strong>edukasi umum, pencatatan, dan simulasi</strong> saja.
              Informasi tersebut <strong>bukan</strong> nasihat keuangan,
              investasi, hukum, atau pajak yang disesuaikan dengan kondisi
              pribadi pengguna.
            </p>
            <p style={{ marginBottom: "0.6rem" }}>
              Pengguna disarankan untuk berkonsultasi dengan penasihat keuangan,
              perencana keuangan tersertifikasi, penasihat hukum, atau
              profesional lain yang kompeten sebelum mengambil keputusan
              penting terkait keuangan maupun usaha.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              4. Data yang dimasukkan pengguna
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Data yang dimasukkan pengguna ke dalam Dompet Nadnad (seperti
              nama dompet, nama pelanggan, nilai setoran, penarikan, catatan
              arisan, dan catatan pribadi lainnya) digunakan untuk menampilkan
              perhitungan dan visualisasi di dashboard. Dompet Nadnad tidak
              meminta detail kredensial perbankan seperti PIN, OTP, password,
              atau kode keamanan satu kali, dan pengguna tidak diperbolehkan
              membagikan informasi tersebut melalui platform ini.
            </p>
            <p style={{ marginBottom: "0.6rem" }}>
              Kami dapat menggunakan data yang telah dianonimkan secara agregat
              untuk keperluan pengembangan fitur, analitik, atau peningkatan
              kualitas layanan, tanpa mengungkap identitas pribadi pengguna.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              5. Hak cipta &amp; merek
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Seluruh logo, nama layanan <strong>Dompet Nadnad</strong>,
              tampilan antarmuka, serta teks dan ilustrasi yang terdapat di
              dalam situs dan aplikasi ini dilindungi oleh hak cipta. Pengguna
              tidak diperkenankan menyalin, memodifikasi, atau mendistribusikan
              materi tersebut tanpa izin tertulis dari pemilik hak yang
              berwenang.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              6. Batasan tanggung jawab
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Kami berupaya menyajikan informasi dan perhitungan yang akurat
              sejauh kemampuan sistem. Namun, Dompet Nadnad tidak dapat
              menjamin bahwa seluruh perhitungan, proyeksi, atau informasi
              bebas dari kesalahan. Pengguna memahami bahwa setiap keputusan
              keuangan atau usaha yang diambil berdasarkan informasi di Dompet
              Nadnad merupakan tanggung jawab pribadi pengguna.
            </p>

            <h3
              style={{ fontSize: "0.9rem", margin: "0.8rem 0 0.3rem" }}
            >
              7. Perubahan layanan &amp; ketentuan
            </h3>
            <p style={{ marginBottom: "0.6rem" }}>
              Dompet Nadnad dapat melakukan pembaruan, penyesuaian, atau
              penghentian fitur sewaktu-waktu untuk alasan pengembangan,
              keamanan, atau pertimbangan lain. Ketentuan ini juga dapat
              diperbarui dari waktu ke waktu. Versi terbaru akan dipublikasikan
              di halaman ini, dan mulai berlaku sejak tanggal pembaruan.
            </p>

            <p
              style={{
                marginTop: "0.8rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              Catatan: teks ini disusun sebagai template umum dan tidak
              menggantikan nasihat hukum profesional. Untuk kebutuhan
              kepatuhan yang spesifik, silakan konsultasikan dengan penasihat
              hukum atau konsultan regulasi yang kompeten.
            </p>
          </div>
        </section>

        <footer className="nanad-landing-footer">
          <div className="nanad-landing-footer-left">
            <span>
              © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
            </span>
            <span>
              Dompet Nadnad adalah ruang pencatatan &amp; simulasi transaksi,
              bukan platform penitipan dana maupun penyedia produk investasi.
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
