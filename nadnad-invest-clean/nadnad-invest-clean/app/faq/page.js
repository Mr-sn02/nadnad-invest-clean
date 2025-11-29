// app/faq/page.js
import Link from "next/link";

export const metadata = {
  title: "FAQ | Nadnad Invest",
};

const faqs = [
  {
    q: "Apa itu Nadnad Invest?",
    a: "Nadnad Invest adalah platform pengelolaan dana / investasi yang membantu pengguna memonitor saldo, menambah dana (deposit), dan melakukan penarikan dengan tampilan yang elegan dan mudah dipahami.",
  },
  {
    q: "Apakah dana saya aman?",
    a: "Keamanan menjadi prioritas kami. Kami menggunakan autentikasi akun, pencatatan transaksi, dan praktik pengelolaan yang transparan. Namun, aktivitas investasi tetap memiliki risiko dan tidak ada jaminan keuntungan pasti.",
  },
  {
    q: "Bagaimana cara melakukan deposit?",
    a: "Pengguna dapat melakukan deposit melalui rekening tujuan yang tertera di halaman Wallet. Setelah transfer, sistem akan melakukan pencatatan saldo. Jika terdapat kendala pada rekening tujuan, segera hubungi Admin melalui WhatsApp Pengaduan.",
  },
  {
    q: "Bagaimana cara penarikan dana?",
    a: "Penarikan dana dapat dilakukan melalui menu Withdraw di halaman Wallet. Dana akan dikirim ke rekening yang telah terverifikasi sesuai jadwal dan ketentuan yang berlaku.",
  },
  {
    q: "Apakah Nadnad Invest memberikan jaminan keuntungan?",
    a: "Tidak. Nadnad Invest tidak memberikan jaminan keuntungan tetap. Nilai dana dapat naik maupun turun. Keputusan untuk menambah atau menarik dana sepenuhnya berada di tangan pengguna.",
  },
  {
    q: "Ke mana saya bisa mengajukan pengaduan?",
    a: "Pengguna dapat mengajukan pengaduan melalui WhatsApp Pengaduan atau email support resmi Nadnad Invest yang tercantum di halaman ini dan di Syarat & Ketentuan.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-slate-900 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-slate-400 mb-2">
            Help Center
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Pertanyaan yang{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-amber-300 to-slate-100">
              Sering Diajukan
            </span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Kumpulan FAQ untuk membantu Anda memahami cara kerja Nadnad Invest.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <details
              key={idx}
              className="group border border-yellow-500/20 rounded-2xl bg-white/5 backdrop-blur px-4 py-3"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium text-sm">{item.q}</span>
                <span className="ml-4 text-xs text-yellow-200 group-open:rotate-90 transition-transform">
                  ▶
                </span>
              </summary>
              <p className="mt-2 text-sm text-slate-200">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-xs text-slate-400 border-t border-white/10 pt-4">
          <p className="mb-1">
            Masih ada yang ingin ditanyakan? Hubungi kami melalui:
          </p>
          <ul className="list-disc pl-5 space-y-1">
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

          <p className="mt-3">
            Dengan menggunakan platform ini, Anda dianggap telah membaca dan
            menyetujui{" "}
            <Link
              href="/terms"
              className="underline decoration-yellow-400 decoration-dotted underline-offset-2"
            >
              Syarat & Ketentuan
            </Link>{" "}
            serta{" "}
            <Link
              href="/disclaimer"
              className="underline decoration-yellow-400 decoration-dotted underline-offset-2"
            >
              Disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
