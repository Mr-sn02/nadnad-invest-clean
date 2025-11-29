// app/faq/page.js
export default function FaqPage() {
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Bantuan</p>
          <h1 className="nanad-dashboard-heading">
            Pertanyaan yang sering diajukan (FAQ).
          </h1>
          <p className="nanad-dashboard-body">
            Ringkasan jawaban singkat seputar cara menggunakan Nanad Invest
            sebagai ruang pencatatan dan perencanaan dana.
          </p>

          <div
            className="nanad-dashboard-body"
            style={{ marginTop: "1rem", fontSize: "0.9rem", lineHeight: 1.7 }}
          >
            <h3 style={{ fontWeight: 600, marginTop: "0.7rem" }}>
              1. Apakah Nanad Invest menyimpan uang saya?
            </h3>
            <p>
              Tidak. Nanad Invest hanya membantu mencatat rencana dan alur dana.
              Dana nyata tetap berada di rekening bank atau e-wallet resmi milik
              kamu dan/atau pengelola.
            </p>

            <h3 style={{ fontWeight: 600, marginTop: "0.7rem" }}>
              2. Apa itu saldo dompet di aplikasi?
            </h3>
            <p>
              Saldo dompet adalah representasi administrasi berdasarkan
              pengajuan setoran dan penarikan yang disetujui admin. Bukan saldo
              resmi bank.
            </p>

            <h3 style={{ fontWeight: 600, marginTop: "0.7rem" }}>
              3. Bagaimana jika ada perbedaan saldo dengan rekening bank?
            </h3>
            <p>
              Jadikan catatan di Nanad Invest sebagai alat bantu. Jika ada
              selisih, gunakan mutasi resmi dari bank atau e-wallet sebagai
              acuan utama dan perbarui catatan di aplikasi.
            </p>

            <h3 style={{ fontWeight: 600, marginTop: "0.7rem" }}>
              4. Bagaimana melaporkan masalah?
            </h3>
            <p>
              Kamu dapat menggunakan tombol{" "}
              <strong>Pengaduan WhatsApp</strong> di pojok kanan bawah untuk
              menghubungi admin dan mengkonfirmasi transaksi atau data akun.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
