// app/layout.js
import "./globals.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "Dompet Nadnad · Dompet Pintar",
  description:
    "Dompet Nadnad · Dompet pintar untuk mengelola saldo, arisan, dan tujuan keuangan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-black text-slate-100">
        {children}

        {/* TOMBOL PENGADUAN WHATSAPP DOMPET NADNAD */}
        <a
          href="https://wa.me/6282160082473?text=Halo%20admin%20Dompet%20Nadnad%2C%20saya%20ingin%20mengkonfirmasi%20rekening%20tujuan%20atau%20pengajuan%20transaksi."
          target="_blank"
          rel="noreferrer"
          className="nanad-wa-fab"
        >
          Pengaduan WhatsApp
        </a>

        <Footer />
      </body>
    </html>
  );
}
