// app/disclaimer/page.js
import Link from "next/link";

export const metadata = {
  title: "Disclaimer | Nadnad Invest",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate-400 mb-2">
            Legal
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Disclaimer{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-300 to-slate-100">
              Nadnad Invest
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Penyangkalan (disclaimer) ini menjelaskan batas tanggung jawab
            Nadnad Invest sebagai platform pengelolaan dana.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              1. Bukan Nasihat Keuangan
            </h2>
            <p>
              Seluruh informasi, simulasi, dan tampilan pada platform Nadnad
              Invest disediakan{" "}
              <span className="font-semibold">
                untuk tujuan informasi umum
              </span>{" "}
              dan bukan merupakan{" "}
              <span className="font-semibold">nasihat keuangan, hukum,</span>{" "}
              maupun{" "}
              <span className="font-semibold">anjuran investasi personal</span>.
              Pengguna disarankan untuk berkonsultasi dengan penasihat keuangan
              independen sebelum mengambil keputusan.
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              2. Tidak Ada Jaminan Keuntungan
            </h2>
            <p>
              Nadnad Invest{" "}
              <span className="font-semibold">
                tidak menjamin keuntungan tertentu
              </span>{" "}
              maupun perlindungan penuh atas risiko kerugian. Kinerja masa lalu
              (jika ditampilkan) tidak dapat dijadikan jaminan hasil di masa
              depan. Pengguna memahami bahwa{" "}
              <span className="font-semibold">
                seluruh keputusan tetap berada di tangan Pengguna
              </span>
              .
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              3. Risiko Teknologi & Gangguan Sistem
            </h2>
            <p>
              Nadnad Invest berupaya menjaga keamanan dan ketersediaan sistem,
              namun tidak dapat menjamin bahwa platform bebas dari{" "}
              bug, gangguan jaringan, serangan siber, atau keterlambatan
              transaksi akibat faktor di luar kendali kami. Segala upaya
              perbaikan akan dilakukan secara wajar sesuai standar industri.
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              4. Informasi Pihak Ketiga
            </h2>
            <p>
              Jika di kemudian hari platform menampilkan data, grafik, atau
              tautan dari pihak ketiga, Pengguna memahami bahwa{" "}
              akurasi dan kelengkapan data tersebut dapat berada di luar
              kendali Nadnad Invest. Pengguna disarankan untuk melakukan
              verifikasi mandiri jika diperlukan.
            </p>
          </section>

          <section className="border border-yellow-500/20 rounded-2xl p-5 bg-white/5">
            <h2 className="text-lg font-semibold mb-2 text-yellow-200">
              5. Persetujuan Pengguna
            </h2>
            <p>
              Dengan mengakses dan menggunakan platform Nadnad Invest, Pengguna
              menyatakan telah membaca, memahami, dan menyetujui isi Disclaimer
              ini serta{" "}
              <Link
                href="/terms"
                className="underline decoration-yellow-400 decoration-dotted underline-offset-2"
              >
                Syarat & Ketentuan
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
