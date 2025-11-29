// app/layout.js
import "./globals.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "Nanad Invest",
  description: "Nanad Invest · Personal Planning & Wealth Space",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-black text-slate-100">
        {children}

        {/* TOMBOL PENGADUAN WHATSAPP NANAD INVEST */}
        <a
          href="https://wa.me/6281234567890?text=Halo%20admin%20Nanad%20Invest%2C%20saya%20ingin%20mengkonfirmasi%20rekening%20tujuan%20atau%20pengajuan%20transaksi."
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
