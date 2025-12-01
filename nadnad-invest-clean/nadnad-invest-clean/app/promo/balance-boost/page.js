// app/promo/balance-boost/page.js
"use client";

import Link from "next/link";

export default function BalanceBoostPage() {
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Event Promo · Balance Boost
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => (window.location.href = "/wallet")}
            >
              Buka Dompet
            </button>
          </div>
        </header>

        {/* INTRO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo terbatas</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost – event apresiasi setoran Dompet Nadnad.
          </h1>
          <p className="nanad-dashboard-body">
            Balance Boost adalah event promosi terbatas dari{" "}
            <strong>Dompet Nadnad</strong> untuk mengapresiasi pengguna yang
            aktif menyetor dana ke dompetnya selama periode event. Sebagian
            pengguna yang beruntung berpeluang mendapatkan{" "}
            <strong>bonus saldo tambahan</strong> berdasarkan total setoran yang
            tercatat di Dompet Nadnad.
          </p>

          <p
            className="nanad-dashboard-body"
            style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#e5e7eb" }}
          >
            Periode contoh: <strong>1 Januari – 31 Maret 2026</strong> (3 bulan
            promo). Silakan sesuaikan waktu resmi sesuai keputusan kamu.
          </p>

          <div
            style={{
              marginTop: "0.9rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
            }}
          >
            <Link
              href="/promo/balance-boost/join"
              className="nanad-dashboard-deposit-submit"
            >
              Daftar ikut Balance Boost
            </Link>
            <Link href="/wallet" className="nanad-dashboard-logout">
              Buka halaman Dompet Nadnad
            </Link>
          </div>
        </section>

        {/* TIER DETAIL */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Struktur tier &amp; peluang bonus</h3>
              <p>
                Tier di bawah ini berdasarkan total setoran yang tercatat di
                Dompet Nadnad selama 1 bulan periode event. Bonus diberikan
                kepada pengguna yang <strong>beruntung</strong>, bukan semua
                peserta.
              </p>
            </div>

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.88rem" }}
            >
              {/* Bronze */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(148,163,184,0.4)",
                  marginBottom: "0.75rem",
                  background:
                    "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  🟤 Tier Bronze – Rp 100.000 s.d. &lt; Rp 1.000.000
                </h4>
                <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
                  <li>Contoh: 30 pemenang per bulan.</li>
                  <li>Peluang bonus hingga ±1% dari total setoran bulan itu.</li>
                  <li>Batas maksimum bonus, misal: Rp 25.000 per user.</li>
                </ul>
              </div>

              {/* Silver */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(148,163,184,0.4)",
                  marginBottom: "0.75rem",
                  background:
                    "radial-gradient(circle at top, rgba(191,219,254,0.12), rgba(15,23,42,1))",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  ⚪ Tier Silver – Rp 1.000.000 s.d. &lt; Rp 10.000.000
                </h4>
                <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
                  <li>Contoh: 20 pemenang per bulan.</li>
                  <li>Peluang bonus hingga ±2% dari total setoran.</li>
                  <li>Batas maksimum bonus, misal: Rp 150.000 per user.</li>
                </ul>
              </div>

              {/* Gold */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(234,179,8,0.6)",
                  marginBottom: "0.75rem",
                  background:
                    "radial-gradient(circle at top, rgba(250,204,21,0.12), rgba(15,23,42,1))",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  🟡 Tier Gold – Rp 10.000.000 s.d. &lt; Rp 50.000.000
                </h4>
                <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
                  <li>Contoh: 10 pemenang per bulan.</li>
                  <li>Peluang bonus hingga ±3% dari total setoran.</li>
                  <li>Batas maksimum bonus, misal: Rp 600.000 per user.</li>
                </ul>
              </div>

              {/* Diamond */}
              <div
                style={{
                  borderRadius: "18px",
                  padding: "0.9rem 1rem",
                  border: "1px solid rgba(147,197,253,0.6)",
                  marginBottom: "0.75rem",
                  background:
                    "radial-gradient(circle at top, rgba(191,219,254,0.16), rgba(15,23,42,1))",
                }}
              >
                <h4 style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  🔷 Tier Diamond – Rp 50.000.000 ke atas
                </h4>
                <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
                  <li>Contoh: 5 pemenang per bulan.</li>
                  <li>Peluang bonus hingga ±5% dari total setoran.</li>
                  <li>Batas maksimum bonus, misal: Rp 1.500.000 per user.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CATATAN PENTING */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catatan penting &amp; batasan</h3>
              <p>
                Event ini dirancang untuk mendorong kebiasaan menabung dan
                membantu Dompet Nadnad dikenal lebih luas dari mulut ke mulut.
              </p>
            </div>

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.86rem", lineHeight: 1.8 }}
            >
              <ul style={{ paddingLeft: "1.1rem", marginBottom: "0.6rem" }}>
                <li>
                  Bonus bersifat <strong>hadiah promosi</strong> untuk sebagian
                  pengguna yang beruntung, <strong>bukan</strong> janji
                  keuntungan tetap.
                </li>
                <li>
                  Tidak semua peserta akan menerima bonus. Pemilihan pemenang
                  dilakukan berdasarkan mekanisme undian / seleksi internal yang
                  diumumkan oleh pengelola Dompet Nadnad.
                </li>
                <li>
                  Seluruh setoran tetap dilakukan di luar aplikasi (rekening
                  bank / e-wallet), lalu dicatat di halaman Wallet Dompet
                  Nadnad.
                </li>
                <li>
                  Event dapat dihentikan, diubah mekanismenya, atau tidak
                  diperpanjang setelah 3 bulan sesuai kebijakan pengelola.
                </li>
              </ul>

              <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                Dompet Nadnad adalah ruang pencatatan &amp; perencanaan. Dompet
                Nadnad tidak menerima titipan dana langsung, tidak menyalurkan
                dana ke pihak lain, dan tidak memberikan nasihat investasi.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Balance Boost Promo.
          </span>
          <span>
            Event promosi ini bersifat terbatas dan tidak membentuk janji
            keuntungan tetap. Semua keputusan finansial tetap menjadi tanggung
            jawab pengguna.
          </span>
        </footer>
      </div>
    </main>
  );
}
