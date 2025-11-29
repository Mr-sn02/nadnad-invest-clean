// app/disclaimer/page.js

export default function DisclaimerPage() {
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Legal · Disclaimer</p>
          <h1 className="nanad-dashboard-heading">
            Disclaimer · Pernyataan Penyangkalan
          </h1>
          <p className="nanad-dashboard-body">
            Informasi berikut menjelaskan batasan tanggung jawab dan ruang
            lingkup penggunaan Nanad Invest. The information below explains the
            limits of liability and scope of use for Nanad Invest.
          </p>
        </section>

        {/* Indonesia */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Disclaimer – Bahasa Indonesia</h3>
            <p>
              Ringkasan penyangkalan yang berlaku bagi seluruh pengguna Nanad
              Invest. Ini bukan nasihat hukum atau keuangan profesional.
            </p>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "0.9rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <h4 style={{ marginTop: "0" }}>1. Bukan Nasihat Investasi</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Nanad Invest tidak memberikan rekomendasi investasi, saran
                pembelian atau penjualan instrumen keuangan apa pun.
              </li>
              <li>
                Informasi yang ditampilkan (saldo, catatan, grafik) bersifat
                ilustratif dan administratif, bukan proyeksi imbal hasil atau
                jaminan keuntungan.
              </li>
            </ul>

            <h4>2. Risiko dan Keputusan Pengguna</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Seluruh keputusan finansial yang diambil berdasarkan catatan di
                Nanad Invest sepenuhnya merupakan{" "}
                <strong>tanggung jawab pengguna</strong>.
              </li>
              <li>
                Pengguna disarankan untuk berkonsultasi dengan penasihat
                keuangan, konsultan pajak, atau penasihat hukum berizin sebelum
                mengambil keputusan penting.
              </li>
            </ul>

            <h4>3. Akurasi Data &amp; Gangguan Layanan</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Pengelola berupaya menampilkan data dengan akurat, namun tidak
                menjamin bahwa seluruh informasi bebas dari kekeliruan input,
                sinkronisasi, atau gangguan teknis.
              </li>
              <li>
                Aplikasi dapat mengalami downtime, keterlambatan respon, atau
                bug perangkat lunak yang mengakibatkan tampilan data tidak
                sempurna.
              </li>
            </ul>

            <h4>4. Batasan Tanggung Jawab</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Pengelola tidak bertanggung jawab atas kerugian finansial,
                kehilangan data, atau kerusakan lain yang timbul akibat:
                <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem" }}>
                  <li>kesalahan input pengguna,</li>
                  <li>pembagian kata sandi kepada pihak lain,</li>
                  <li>serangan siber pihak ketiga, atau</li>
                  <li>
                    gangguan layanan yang berada di luar kendali wajar
                    pengelola.
                  </li>
                </ul>
              </li>
            </ul>

            <h4>5. Tidak Menggantikan Catatan Resmi</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Nanad Invest tidak menggantikan fungsi mutasi rekening bank,
                laporan lembaga keuangan, atau dokumen resmi lainnya.
              </li>
              <li>
                Jika terdapat selisih data, pengguna wajib merujuk pada catatan
                resmi dari bank/lembaga keuangan sebagai sumber kebenaran
                utama.
              </li>
            </ul>
          </div>
        </section>

        {/* English */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>Disclaimer – English Version</h3>
            <p>
              Summary of the disclaimer applicable to all Nanad Invest users.
              This is not legal, investment, tax, or accounting advice.
            </p>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "0.9rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <h4 style={{ marginTop: "0" }}>1. No Investment Advice</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Nanad Invest does not provide investment recommendations or
                advice to buy, sell, or hold any financial instrument.
              </li>
              <li>
                Information shown in the app (balances, notes, charts) is
                illustrative and administrative only, not a forecast of returns
                or a guarantee of profit.
              </li>
            </ul>

            <h4>2. User&apos;s Risk and Responsibility</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                All financial decisions made based on records stored in Nanad
                Invest are the <strong>sole responsibility of the user</strong>.
              </li>
              <li>
                Users are encouraged to consult licensed financial, tax, or
                legal professionals before making significant decisions.
              </li>
            </ul>

            <h4>3. Data Accuracy &amp; Service Interruptions</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                While reasonable efforts are made to display accurate data, the
                operator does not warrant that all information is free from
                input errors, syncing issues, or technical faults.
              </li>
              <li>
                The service may experience downtime, delayed responses, or
                software bugs that affect how information is presented.
              </li>
            </ul>

            <h4>4. Limitation of Liability</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                The operator shall not be liable for financial loss, data loss,
                or other damages arising from:
                <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem" }}>
                  <li>user input mistakes,</li>
                  <li>sharing passwords with third parties,</li>
                  <li>third-party cyber attacks, or</li>
                  <li>
                    service interruptions beyond the operator&apos;s reasonable
                    control.
                  </li>
                </ul>
              </li>
            </ul>

            <h4>5. No Replacement for Official Records</h4>
            <ul style={{ paddingLeft: "1.1rem" }}>
              <li>
                Nanad Invest does not replace official bank statements, reports
                from financial institutions, or other legal documents.
              </li>
              <li>
                In the event of discrepancies, users must rely on the official
                records from banks or financial institutions as the primary
                source of truth.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
