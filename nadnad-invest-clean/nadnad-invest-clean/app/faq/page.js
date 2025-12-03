// app/faq/page.js

export default function FaqPage() {
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Help · FAQ</p>
          <h1 className="nanad-dashboard-heading">
            Pertanyaan yang Sering Diajukan · Frequently Asked Questions
          </h1>
          <p className="nanad-dashboard-body">
            Ringkasan tanya–jawab singkat mengenai fungsi{" "}
            <strong>Dompet Nadnad</strong> sebagai{" "}
            <strong>dompet pintar</strong> dan batasan layanannya, dalam Bahasa
            Indonesia dan English.
          </p>
        </section>

        {/* Bahasa Indonesia */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>FAQ – Bahasa Indonesia</h3>
            <p>Beberapa pertanyaan umum seputar penggunaan Dompet Nadnad.</p>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "0.9rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <h4 style={{ marginTop: "0" }}>
              1. Apakah Dompet Nadnad menyimpan uang saya?
            </h4>
            <p>
              Bisa. <strong>Dompet Nadnad</strong> membantu kamu menyimpan
              dan mengelola uang dengan cara yang tertib, aman, dan bertanggung
              jawab. Dana nyata tetap yang berada di dalam Dompet Nadnad resmi
              milik kamu, sementara aplikasi menampilkan ringkasan dan alur dana
              berdasarkan data yang kamu masukkan.
            </p>

            <h4>2. Apa fungsi saldo dompet di aplikasi?</h4>
            <p>
              Saldo dompet adalah representasi administratif dari setoran dan
              penarikan yang diajukan dan (jika berlaku) disetujui Otomatis. Ini
              membantu kamu melihat gambaran kondisi dana, saldo {" "}
              <strong>resmi</strong> dari bank atau lembaga keuangan.
            </p>

            <h4>3. Bagaimana jika ada selisih dengan rekening bank?</h4>
            <p>
              Jika terdapat perbedaan antara catatan di Dompet Nadnad dan mutasi
              rekening bank resmi, jadikan mutasi rekening sebagai acuan utama.
              Kamu dapat menyesuaikan catatan di aplikasi agar selaras dengan
              data resmi lainnya.
            </p>

            <h4>4. Apakah Dompet Nadnad memberikan jaminan keuntungan?</h4>
            <p>
              Tidak. Dompet Nadnad tidak memberikan janji imbal hasil, tidak
              mengelola portofolio investasi, dan tidak menjamin keuntungan atau
              bebas rugi. Keputusan keuangan tetap menjadi tanggung jawab
              masing-masing pengguna.
            </p>

            <h4>5. Bagaimana cara melaporkan masalah?</h4>
            <p>
              Jika menemukan transaksi mencurigakan, data yang tidak sesuai, atau
              masalah teknis, gunakan tombol{" "}
              <strong>Pengaduan WhatsApp</strong> di pojok kanan bawah untuk
              menghubungi admin, lalu sertakan tangkapan layar dan penjelasan
              singkat.
            </p>
          </div>
        </section>

        {/* English */}
        <section className="nanad-dashboard-deposits">
          <div className="nanad-dashboard-deposits-header">
            <h3>FAQ – English Version</h3>
            <p>
              Short Q&amp;A about how <strong>Dompet Nadnad</strong> works as a{" "}
              smart wallet and its limits.
            </p>
          </div>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "0.9rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <h4 style={{ marginTop: "0" }}>
              1. Does Dompet Nadnad hold my money?
            </h4>
            <p>
              No. <strong>Dompet Nadnad</strong> only helps you record plans and
              cash flows. Real funds always stay in official bank accounts or
              payment services owned by you and/or the organiser. The app shows
              administrative summaries based on the data entered.
            </p>

            <h4>2. What does the wallet balance represent?</h4>
            <p>
              The wallet balance is an administrative representation of deposits
              and withdrawals that have been requested and, where applicable,
              approved by an admin. It is not an official bank balance and
              should not be treated as such.
            </p>

            <h4>
              3. What should I do if there is a mismatch with my bank statement?
            </h4>
            <p>
              In case of discrepancies, always treat your official bank
              statement as the primary reference. You can update the records in{" "}
              <strong>Dompet Nadnad</strong> so that they match the official
              data.
            </p>

            <h4>4. Does Dompet Nadnad guarantee any returns?</h4>
            <p>
              No. Dompet Nadnad does not manage investments and does not promise
              any specific returns or guarantee that you will avoid losses. All
              financial decisions remain your own responsibility.
            </p>

            <h4>5. How can I report an issue?</h4>
            <p>
              If you notice suspicious activity, incorrect data, or technical
              problems, use the <strong>WhatsApp Complaint</strong> button in
              the bottom-right corner to contact the admin. Include screenshots
              and a short description of the issue.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
