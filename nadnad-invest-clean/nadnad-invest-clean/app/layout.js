// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Nanad Invest",
  description: "Personal Planning & Simulation Space",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}

        {/* TOMBOL PENGADUAN WHATSAPP NANAD INVEST */}
        <a
          href="https://wa.me/6281234567890?text=Halo%20admin%20Nanad%20Invest%2C%20saya%20ingin%20mengajukan%20pengaduan%20terkait%20rekening%20tujuan%20deposit."
          target="_blank"
          rel="noreferrer"
          className="nanad-wa-fab"
        >
          Pengaduan WhatsApp
        </a>
      </body>
    </html>
  );
}
