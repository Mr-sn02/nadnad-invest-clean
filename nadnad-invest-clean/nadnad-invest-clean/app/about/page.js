export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <main className="about-shell">
      <div className="container">
        {/* HEADER ABOUT */}
        <header className="about-header">
          <div>
            <div className="about-eyebrow">Tentang Nadnad Invest</div>
            <h1 className="about-title">
              Elegance Powered by Intelligence.
            </h1>
            <p className="about-sub">
              Nadnad Invest dirancang sebagai ruang yang tenang dan elegan untuk
              belajar merencanakan keuangan. Bukan tempat spekulasi liar, tapi
              tempat berlatih berpikir jangka panjang dengan cara yang rapi,
              bersih, dan bisa dinikmati.
            </p>
          </div>
          <div className="about-tag">
            Gold · Black · Silver · White
          </div>
        </header>

        {/* GRID: FILOSOFI & SIMULASI */}
        <section className="about-grid">
          <article className="about-block">
            <h2 className="about-block-title">Filosofi di balik Nadnad Invest</h2>
            <p>
              Banyak orang ingin belajar investasi, tapi langsung disambut angka,
              istilah teknis, dan grafik yang menegangkan. Nadnad Invest hadir
              sebagai “ruang latihan” yang aman: kamu bisa mengutak-atik simulasi,
              mencoba skenario, dan melihat gambaran jangka panjang tanpa harus
              menginvestasikan dana sungguhan.
            </p>
            <p>
              Fokus kami adalah membantu membangun kebiasaan sehat: konsistensi
              setoran, pemahaman risiko, dan rasa tenang saat melihat naik-turun
              nilai. Baru setelah itu, kamu bebas membawa pola pikir tersebut ke
              platform investasi lain yang kamu percaya.
            </p>
          </article>

          <article className="about-block">
            <h2 className="about-block-title">Apa itu platform simulasi?</h2>
            <p>
              Platform simulasi di sini berarti semua angka yang kamu lihat
              merupakan ilustrasi, bukan data keuangan nyata. Kamu bisa:
            </p>
            <ul className="about-list">
              <li>Mencoba berbagai skenario setoran bulanan.</li>
              <li>Melihat efek jangka panjang dari kebiasaan kecil yang konsisten.</li>
              <li>Membandingkan horizon waktu dan profil risiko.</li>
            </ul>
            <p>
              Dengan cara ini, kamu bisa “berlatih” dulu sebelum terjun ke dunia
              investasi yang sebenarnya.
            </p>
          </article>
        </section>

        {/* PILAR DESAIN */}
        <section className="about-section">
          <div className="section-header">
            <div className="section-eyebrow">Pilar desain</div>
            <h2 className="section-title">Tiga pilar Nadnad Invest</h2>
            <p className="section-subtitle">
              Setiap tampilan, warna, dan teks di Nadnad Invest mengikuti tiga
              prinsip utama ini.
            </p>
          </div>

          <div className="about-pillars">
            <article className="about-pillar-card">
              <h3>Elegan, bukan heboh</h3>
              <p>
                Warna gold–black–silver–white dipilih untuk menciptakan nuansa
                tenang dan mewah. Bukan agar terlihat “pamer”, tapi agar pikiranmu
                terasa rapi saat mengambil keputusan.
              </p>
            </article>

            <article className="about-pillar-card">
              <h3>Jernih, bukan rumit</h3>
              <p>
                Angka dan teks dibuat sesederhana mungkin tanpa mengorbankan
                makna. Fokus pada hal yang benar-benar penting: tujuan, durasi,
                dan kebiasaan setoran.
              </p>
            </article>

            <article className="about-pillar-card">
              <h3>Reflektif, bukan impulsif</h3>
              <p>
                Alih-alih memicu FOMO, Nadnad Invest mengajakmu berhenti sejenak,
                melihat pola, dan merenungkan: “Sebenarnya, apa yang ingin aku
                capai dengan uang ini?”
              </p>
            </article>
          </div>
        </section>

        {/* UNTUK SIAPA */}
        <section className="about-section">
          <div className="section-header">
            <div className="section-eyebrow">Untuk siapa</div>
            <h2 className="section-title">Siapa yang cocok memakai Nadnad Invest?</h2>
          </div>

          <div className="about-forwho">
            <div className="about-forwho-col">
              <ul className="about-list">
                <li>
                  Kamu yang baru mulai belajar keuangan dan ingin melihat gambaran
                  besar tanpa langsung menaruh dana sungguhan.
                </li>
                <li>
                  Kamu yang sudah pernah berinvestasi, tapi ingin punya ruang
                  latihan yang lebih tenang dan elegan.
                </li>
                <li>
                  Kamu yang ingin menjelaskan rencana keuangan ke pasangan atau
                  keluarga dengan visual yang rapi dan mudah dipahami.
                </li>
              </ul>
            </div>
            <div className="about-forwho-col note">
              <p>
                Nadnad Invest bukan platform jual-beli produk keuangan, dan tidak
                memberikan rekomendasi instrumen spesifik. Ini adalah ruang
                simulasi dan refleksi.
              </p>
            </div>
          </div>
        </section>

        {/* CATATAN PENTING */}
        <section className="about-section">
          <div className="section-header">
            <div className="section-eyebrow">Catatan penting</div>
            <h2 className="section-title">Disclaimer & batasan</h2>
          </div>

          <ul className="about-list">
            <li>
              Semua angka di Nadnad Invest bersifat simulasi ilustratif, bukan
              proyeksi resmi, saran keuangan, atau jaminan hasil.
            </li>
            <li>
              Keputusan finansial tetap menjadi tanggung jawab masing-masing
              pengguna. Pertimbangkan untuk berdiskusi dengan perencana keuangan
              profesional sebelum mengambil keputusan besar.
            </li>
            <li>
              Tujuan utama Nadnad Invest adalah membantumu mengembangkan pola
              pikir, kebiasaan, dan cara pandang yang lebih sehat terhadap uang.
            </li>
          </ul>

          <div className="about-backlink">
            <a href="/" className="btn-ghost">
              ← Kembali ke beranda
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
