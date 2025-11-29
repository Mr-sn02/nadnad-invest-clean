// app/components/Footer.js
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear(); // boleh jadi 2025 otomatis

  return (
    <footer className="nanad-dashboard-footer nanad-footer-global">
      <div className="nanad-footer-main">
        <span>© {year} Nanad Invest. All rights reserved.</span>

        <span className="nanad-footer-links">
          <Link href="/terms">Syarat &amp; Ketentuan</Link>
          <span> · </span>
          <Link href="/disclaimer">Disclaimer</Link>
          <span> · </span>
          <Link href="/faq">FAQ</Link>
        </span>
      </div>

      <p className="nanad-footer-sub">
        Nanad Invest berfungsi sebagai ruang pencatatan dan perencanaan
        keuangan pribadi. Nanad Invest bukan lembaga keuangan berizin dan tidak
        memberikan janji imbal hasil tertentu. Selalu gunakan rekening resmi dan
        ikuti regulasi yang berlaku.
      </p>
    </footer>
  );
}
