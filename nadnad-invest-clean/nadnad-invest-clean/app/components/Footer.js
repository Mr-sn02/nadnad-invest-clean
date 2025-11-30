// app/components/Footer.js
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear(); // boleh jadi 2025 otomatis

  return (
    <footer className="nanad-dashboard-footer nanad-footer-global">
      <div className="nanad-footer-main">
        <span>© {year} Dompet Nadnad. All rights reserved.</span>

        <span className="nanad-footer-links">
          <Link href="/terms">Syarat &amp; Ketentuan</Link>
          <span> · </span>
          <Link href="/disclaimer">Disclaimer</Link>
          <span> · </span>
          <Link href="/faq">FAQ</Link>
        </span>
      </div>

      <p className="nanad-footer-sub">
        Dompet Nadnad merupakan platform dompet digital berizin yang
        menyediakan layanan pengelolaan, pencatatan, dan perencanaan keuangan
        pribadi secara aman dan tepercaya. Seluruh aktivitas operasional Dompet
        Nadnad mengikuti standar keamanan, integrasi sistem, serta regulasi yang
        berlaku. Untuk transaksi keuangan, pengguna tetap dianjurkan menggunakan
        rekening resmi dan memastikan kepatuhan terhadap ketentuan peraturan
        perundang-undangan.
      </p>
    </footer>
  );
}
