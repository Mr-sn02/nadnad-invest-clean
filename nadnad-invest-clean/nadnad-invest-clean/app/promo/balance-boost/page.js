// app/promo/balance-boost/page.js

import Link from "next/link";

export default function BalanceBoostPromoPage() {
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
                Halaman Promo · Balance Boost Event
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Link href="/dashboard" className="nanad-dashboard-logout">
              Kembali ke dashboard
            </Link>
          </div>
        </header>

        {/* INTRO PROMO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo terbatas</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost Event · Kesempatan bonus saldo dompet.
          </h1>
          <p className="nanad-dashboard-body">
            Selama periode promo, sebagian pengguna yang aktif menyetor ke
            Dompet Nadnad berkesempatan mendapatkan{" "}
            <strong>bonus saldo tambahan</strong> sebagai bentuk apresiasi.
            Promo ini bersifat <strong>undian berhadiah</strong>,{" "}
            <strong>bukan janji keuntungan pasti</strong> dan tidak berlaku
            selamanya.
          </p>

          <p
            className="nanad-dashboard-body"
            style={{ marginTop: "0.65rem", fontSize: "0.82rem", color: "#e5e7eb" }}
          >
            Detail teknis (periode, cara ikut, dan pengumuman pemenang) dapat
            disesuaikan dan diumumkan oleh admin Dompet Nadnad melalui kanal
            komunikasi resmi (misalnya grup WhatsApp/Telegram).
          </p>
        </section>

        {/* GRID TIER PROMO */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Struktur Bonus Berdasarkan Tier Setoran</h3>
              <p>
                Tier di bawah ini adalah contoh struktur untuk periode promo
                selama ±3 bulan. Kamu bisa menyesuaikan jumlah pemenang dan
                nominal maksimal sesuai budget promo yang tersedia.
              </p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.9rem", display: "grid", gap: "0.85rem" }}
            >
              {/* BRONZE */}
              <div className="nanad-dashboard-deposits-row">
                <div>
                  <strong>Tier Bronze</strong>
                  <br />
                  <span style={{ fontSize: "0.8rem", color: "#e5e7eb" }}>
                    Total setoran bulanan: Rp 100.000 s.d. &lt; Rp 1.000.000
                  </span>
                </div>
                <div style={{ fontSize: "0.86rem" }}>
                  <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                    <li>Contoh: 30 pemenang per bulan.</li>
                    <li>Bonus hingga ±1% dari total setoran bulan itu.</li>
                    <li>
                      Batas maksimum bonus contoh:{" "}
                      <strong>Rp 25.000 per user per bulan promo</strong>.
                    </li>
                  </ul>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.6)",
                    }}
                  >
                    Bronze · up to ~1%
                  </span>
                </div>
              </div>

              {/* SILVER */}
              <div className="nanad-dashboard-deposits-row">
                <div>
                  <strong>Tier Silver</strong>
                  <br />
                  <span style={{ fontSize: "0.8rem", color: "#e5e7eb" }}>
                    Total setoran bulanan: Rp 1.000.000 s.d. &lt; Rp 10.000.000
                  </span>
                </div>
                <div style={{ fontSize: "0.86rem" }}>
                  <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                    <li>Contoh: 20 pemenang per bulan.</li>
                    <li>Bonus hingga ±2% dari total setoran bulan itu.</li>
                    <li>
                      Batas maksimum bonus contoh:{" "}
                      <strong>Rp 150.000 per user per bulan promo</strong>.
                    </li>
                  </ul>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.6)",
                    }}
                  >
                    Silver · up to ~2%
                  </span>
                </div>
              </div>

              {/* GOLD */}
              <div className="nanad-dashboard-deposits-row">
                <div>
                  <strong>Tier Gold</strong>
                  <br />
                  <span style={{ fontSize: "0.8rem", color: "#e5e7eb" }}>
                    Total setoran bulanan: Rp 10.000.000 s.d. &lt; Rp 50.000.000
                  </span>
                </div>
                <div style={{ fontSize: "0.86rem" }}>
                  <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                    <li>Contoh: 10 pemenang per bulan.</li>
                    <li>Bonus hingga ±3% dari total setoran bulan itu.</li>
                    <li>
                      Batas maksimum bonus contoh:{" "}
                      <strong>Rp 600.000 per user per bulan promo</strong>.
                    </li>
                  </ul>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.6)",
                    }}
                  >
                    Gold · up to ~3%
                  </span>
                </div>
              </div>

              {/* DIAMOND */}
              <div className="nanad-dashboard-deposits-row">
                <div>
                  <strong>Tier Diamond</strong>
                  <br />
                  <span style={{ fontSize: "0.8rem", color: "#e5e7eb" }}>
                    Total setoran bulanan: Rp 50.000.000 ke atas
                  </span>
                </div>
                <div style={{ fontSize: "0.86rem" }}>
                  <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                    <li>Contoh: 5 pemenang per bulan.</li>
                    <li>Bonus hingga ±5% dari total setoran bulan itu.</li>
                    <li>
                      Batas maksimum bonus contoh:{" "}
                      <strong>Rp 1.500.000 per user per bulan promo</strong>.
                    </li>
                  </ul>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.8rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.6)",
                    }}
                  >
                    Diamond · up to ~5%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CATATAN & DISCLAIMER KHUSUS PROMO */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catatan penting promo Balance Boost</h3>
              <p>
                Bagian ini bisa ditampilkan ke user agar mereka paham bahwa
                promo ini bentuk apresiasi, bukan janji keuntungan tetap.
              </p>
            </div>

            <ul
              className="nanad-dashboard-body"
              style={{ marginTop: "0.8rem", fontSize: "0.86rem", paddingLeft: "1.1rem" }}
            >
              <li style={{ marginBottom: "0.4rem" }}>
                Promo ini bersifat{" "}
                <strong>undian terbatas selama periode tertentu</strong>, bukan
                program imbal hasil berkelanjutan.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Tidak semua pengguna akan menjadi pemenang. Peluang menang
                bergantung pada jumlah peserta dan mekanisme pemilihan yang
                diatur oleh admin.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Bonus diberikan dalam bentuk{" "}
                <strong>penyesuaian saldo dompet Dompet Nadnad</strong> dan
                dicatat sebagai transaksi khusus (misalnya: &quot;BONUS_PROMO&quot;).
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Periode berlakunya promo, kriteria kelayakan, dan cara
                pengumuman pemenang wajib diinformasikan secara tertulis oleh
                admin (misalnya melalui grup resmi atau halaman pengumuman).
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Dompet Nadnad{" "}
                <strong>tidak menjanjikan keuntungan tetap atau berulang</strong>.
                Promo dapat dihentikan sewaktu-waktu setelah periode berakhir.
              </li>
            </ul>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Balance Boost Promo Page.
          </span>
          <span>
            Dompet Nadnad adalah ruang simulasi &amp; perencanaan dana pribadi.
            Promo ini bersifat apresiasi, bukan janji imbal hasil berkelanjutan.
          </span>
        </footer>
      </div>
    </main>
  );
}
