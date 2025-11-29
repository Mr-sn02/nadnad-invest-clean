// app/terms/page.js
export default function TermsPage() {
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Legal</p>
          <h1 className="nanad-dashboard-heading">
            Syarat &amp; Ketentuan Nanad Invest.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini menjelaskan ketentuan penggunaan platform Nanad Invest
            sebagai ruang pencatatan dan perencanaan keuangan pribadi.
          </p>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "1rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <ol style={{ paddingLeft: "1.25rem" }}>
              <li>
                Nanad Invest digunakan untuk membantu pengguna mencatat alur
                dana pribadi, pengajuan setoran, dan penarikan secara
                administratif.
              </li>
              <li>
                Nanad Invest bukan lembaga keuangan, bukan manajer investasi,
                dan tidak menerima titipan dana secara langsung di dalam
                aplikasi.
              </li>
              <li>
                Segala transaksi dana nyata tetap dilakukan melalui rekening
                resmi bank atau layanan pembayaran lain di luar aplikasi, sesuai
                kesepakatan para pihak.
              </li>
              <li>
                Pengguna berkewajiban menjaga kerahasiaan akun, termasuk email,
                kata sandi, dan kode OTP, serta tidak membagikannya kepada
                pihak lain.
              </li>
              <li>
                Data yang ditampilkan di aplikasi bersifat informatif dan tidak
                dapat dijadikan dasar tunggal pengambilan keputusan finansial
                maupun hukum.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
