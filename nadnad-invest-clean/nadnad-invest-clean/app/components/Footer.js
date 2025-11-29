// app/components/Footer.js

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <p className="order-2 md:order-1">
          © {new Date().getFullYear()} Nanad Invest. All rights reserved.
        </p>
        <div className="flex items-center gap-4 order-1 md:order-2">
          <Link href="/terms" className="hover:text-yellow-200 transition">
            Syarat & Ketentuan
          </Link>
          <Link href="/disclaimer" className="hover:text-yellow-200 transition">
            Disclaimer
          </Link>
          <Link href="/faq" className="hover:text-yellow-200 transition">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
