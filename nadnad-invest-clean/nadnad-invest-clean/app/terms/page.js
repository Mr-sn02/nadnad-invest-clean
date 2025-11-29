// app/terms/page.js
import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | Nadnad Invest",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate-400 mb-2">
            Legal
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Syarat & Ketentuan{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-300 to-slate-100">
              Nadnad Invest
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Berlaku bagi seluruh pengguna platform Nadnad Invest. Harap dibaca
            dengan saksama sebelum menggunakan layanan.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-200">
          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              1. Definisi
            </h2>
            <p className="mb-2">
              Dalam Syarat & Ketentuan ini, yang dimaksud dengan:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-200">
              <li>
                <span className="font-semibold">“Platform”</span> adalah
                aplikasi web Nadnad Invest yang diakses melalui browser.
              </li>
              <li>
                <span className="font-semibold">“Pengguna”</span> adalah setiap
                individu yang membuat akun dan/atau menggunakan layanan Nadnad
                Invest.
              </li>
              <li>
                <span className="font-semibold">“Dana”</span> adalah seluruh
                nilai saldo yang tercatat pada akun Pengguna di platform Nadnad
                Invest.
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              2. Akun & Keamanan
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Pengguna wajib memberikan data yang benar, lengkap, dan dapat
                dipertanggungjawabkan saat mendaftar.
              </li>
              <li>
                Pengguna bertanggung jawab penuh atas kerahasiaan{" "}
                <span className="font-semibold">email, password, dan OTP</span>{" "}
                yang digunakan.
              </li>
              <li>
                Segala aktivitas pada akun yang menggunakan kredensial Pengguna
                dianggap sebagai tindakan Pengguna.
              </li>
              <li>
                Jika terdapat indikasi penyalahgunaan akun, Pengguna wajib
                segera menghubungi Admin melalui{" "}
                <Link
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Nadnad%20Invest%2C%20ada%20kendala%20pada%20akun%20saya."
                  className="underline decoration-yellow-400 decoration-dotted underline-offset-2"
                >
                  WhatsApp Pengaduan
                </Link>
                .
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              3. Penggunaan Layanan
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Pengguna setuju menggunakan platform hanya untuk tujuan yang
                sah dan tidak melanggar hukum yang berlaku.
              </li>
              <li>
                Segala bentuk percobaan manipulasi sistem, penyalahgunaan bug,
                maupun aktivitas yang merugikan pihak lain{" "}
                <span className="font-semibold">dilarang keras</span>.
              </li>
              <li>
                Nadnad Invest berhak menolak, membatasi, atau menghentikan
                akses Pengguna jika terdapat indikasi pelanggaran.
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              4. Risiko Investasi
            </h2>
            <p className="mb-2">
              Aktivitas pengelolaan dana dan investasi selalu mengandung risiko.
              Dengan menggunakan platform ini, Pengguna menyatakan memahami
              bahwa:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Nilai dana maupun imbal hasil{" "}
                <span className="font-semibold">dapat naik maupun turun</span>.
              </li>
              <li>
                <span className="font-semibold">
                  Tidak ada jaminan keuntungan tetap
                </span>{" "}
                atau bebas risiko.
              </li>
              <li>
                Keputusan untuk menambahkan dana, menarik dana, atau melanjutkan
                penggunaan layanan sepenuhnya merupakan tanggung jawab Pengguna.
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              5. Deposit, Penarikan, & Biaya
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Dana dianggap{" "}
                <span className="font-semibold">berhasil didepositkan</span>{" "}
                setelah terkonfirmasi di sistem dan tercatat pada saldo akun
                Pengguna.
              </li>
              <li>
                Proses penarikan dana mengikuti jadwal, limit, dan ketentuan
                yang tercantum di halaman informasi Nadnad Invest.
              </li>
              <li>
                Biaya administrasi, biaya transfer, atau biaya lain (jika ada)
                akan diinformasikan secara jelas sebelum transaksi dilakukan.
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              6. Larangan
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Menggunakan platform untuk pencucian uang (money laundering) atau
                pendanaan aktivitas ilegal.
              </li>
              <li>
                Menggunakan identitas palsu atau mengatasnamakan pihak lain
                tanpa izin.
              </li>
              <li>
                Mengakses sistem di luar antarmuka resmi (misalnya dengan
                scraping yang merusak, brute force, dan sejenisnya).
              </li>
            </ul>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              7. Data & Privasi
            </h2>
            <p>
              Nadnad Invest berkomitmen menjaga kerahasiaan data Pengguna dan
              hanya menggunakan data sesuai dengan ketentuan yang dijelaskan
              dalam Kebijakan Privasi (jika nanti dibuat terpisah). Pengguna
              setuju bahwa sebagian data teknis (log, aktivitas dasar) dapat
              digunakan untuk keperluan keamanan dan pengembangan layanan.
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              8. Perubahan Ketentuan
            </h2>
            <p>
              Nadnad Invest dapat sewaktu-waktu mengubah Syarat & Ketentuan ini.
              Versi terbaru akan ditampilkan di halaman ini. Dengan tetap
              menggunakan layanan setelah perubahan, Pengguna dianggap menyetujui
              pembaruan tersebut.
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5 backdrop-blur">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              9. Kontak & Pengaduan
            </h2>
            <p>
              Jika Pengguna memiliki pertanyaan atau pengaduan terkait layanan,
              silakan menghubungi:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Email: <span className="font-mono">support@nadnadinvest.com</span></li>
              <li>
                WhatsApp Pengaduan:{" "}
                <Link
                  href="https://wa.me/6281234567890"
                  className="underline decoration-yellow-400 decoration-dotted underline-offset-2"
                >
                  0812-3456-7890
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
