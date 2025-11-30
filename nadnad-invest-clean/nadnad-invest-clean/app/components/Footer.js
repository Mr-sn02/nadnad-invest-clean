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
        Dompet Nadnad adalah layanan dompet digital berizin yang menyediakan
        fitur pengelolaan dan pencatatan keuangan secara aman, terpadu, dan
        tepercaya. Seluruh operasional mengikuti standar keamanan sistem serta
        regulasi yang berlaku.
      </p>
    </footer>
  );
}
