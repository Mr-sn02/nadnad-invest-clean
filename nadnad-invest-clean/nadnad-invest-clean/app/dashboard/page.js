// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

// 🔐 Sementara: daftar email admin.
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ➕ baru: pesan kecil setelah copy referral
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error getUser:", error.message);
        }

        // Belum login → lempar ke /login
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Ambil dompet user (jika ada)
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setLoadError(
            "Gagal memuat saldo dompet. Pastikan database telah dikonfigurasi."
          );
          return;
        }

        setWallet(existing || null);
      } catch (err) {
        console.error("Dashboard init error:", err);
        setLoadError("Terjadi kesalahan saat memuat dashboard.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Gagal logout. Coba lagi.");
    }
  };

  const isAdmin =
    user && user.email && ADMIN_EMAILS.includes(user.email);

  // ➕ BARU: referral code & link
  const referralCode =
    wallet?.ref_code ||
    (user?.user_metadata && user.user_metadata.ref_code) ||
    "BELUM-AKTIF";

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://dompet-nadnad.app";

  const referralLink = `${baseUrl}/register?ref=${encodeURIComponent(
    referralCode
  )}`;

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopyMsg("Link referral tersalin.");
      setTimeout(() => setCopyMsg(""), 2500);
    } catch (err) {
      console.error("Copy error:", err);
      alert("Gagal menyalin link. Silakan copy manual.");
    }
  };

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Dashboard ruang finansial pribadi
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/profile")}
            >
              Profil &amp; Keamanan
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={handleLogout}
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Welcome */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Welcome back</p>
          <h1 className="nanad-dashboard-heading">
            Ruang tenang untuk Mengembangkan alur dana kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Dari satu Halaman, kamu dapat mengakses dompet, tabungan khusus
            (saving goals), memantau riwayat Menabung dan menarik dana kamu
            dengan pengalaman menabung baru di Dompet Pintar Nadnad,.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun terhubung</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Ini adalah identitas login yang digunakan untuk mengakses ruang
                Dompet Nadnad kamu.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Saldo ini akan berubah setelah pengajuan menabung dan menarik{" "}
                <strong>Proses cepat demi kenyamanan pengguna.</strong>
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Peran</p>
              <p className="nanad-dashboard-stat-number">
                {isAdmin ? "Admin & Nasabah" : "Nasabah"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Nasabah adalah anggota yang sudah bergabung dengan Dompet
                Pintar Nadnad dengan pengalaman menabung yang menyenangkan.
              </p>
            </div>
          </div>
        </section>

        {/* ➕ BARU: Referral & Bagikan Dompet Nadnad */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Bagikan Dompet Nadnad</h3>
              <p>
                Ajak teman pakai Dompet Nadnad. Saat teman daftar pakai link-mu,
                kalian berdua bisa dapat kesempatan hadiah tambahan di event
                promo (misalnya tiket undian ekstra Balance Boost).
              </p>
            </div>

            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.95rem 1.1rem",
                borderRadius: "18px",
                border: "1px solid rgba(148,163,184,0.5)",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      opacity: 0.8,
                      marginBottom: "0.25rem",
                    }}
                  >
                    Kode referral kamu
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1rem",
                      letterSpacing: "0.18em",
                    }}
                  >
                    {referralCode || "BELUM-AKTIF"}
                  </div>

                  <p
                    className="nanad-dashboard-body"
                    style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}
                  >
                    Bagikan kode atau link di bawah ini ke teman / keluarga yang
                    mau merapikan tabungannya. Nikmati promonya sebelum habis karena
                    Dompet Nadnad sedang bagi-bagi uang unlimited.
                  </p>
                </div>

                <div style={{ minWidth: "230px", flexShrink: 0 }}>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      opacity: 0.85,
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Link pendaftaran dengan referral kamu
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      style={{
                        flex: 1,
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.8)",
                        background:
                          "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,1))",
                        padding: "0.4rem 0.8rem",
                        color: "#e5e7eb",
                        fontSize: "0.8rem",
                        outline: "none",
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="nanad-dashboard-deposit-submit"
                      style={{
                        whiteSpace: "nowrap",
                        paddingInline: "0.9rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      Salin
                    </button>
                  </div>

                  {copyMsg && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        marginTop: "0.3rem",
                        color: "#a5f3fc",
                      }}
                    >
                      {copyMsg}
                    </p>
                  )}

                  {/* Tombol share cepat ke WhatsApp */}
                  <button
                    type="button"
                    onClick={() => {
                      const text =
                        `Aku lagi pakai Dompet Nadnad buat merapikan tabungan ` +
                        `dan pisahin uang usaha/pribadi.\n\n` +
                        `Kamu bisa daftar lewat sini: ${referralLink}\n\n` +
                        `Tidak ada janji imbal hasil, cuma bantu lihat alur uang ` +
                        `dan ikut event-event hadiah kalau lagi ada.`;
                      const url = `https://wa.me/?text=${encodeURIComponent(
                        text
                      )}`;
                      window.open(url, "_blank");
                    }}
                    className="nanad-dashboard-logout"
                    style={{
                      marginTop: "0.5rem",
                      width: "100%",
                      fontSize: "0.8rem",
                    }}
                  >
                    Bagikan lewat WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigasi utama */}
        <section className="nanad-dashboard-table-section">
          {/* Kolom kiri: akses utama */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Akses utama</h3>
              <p>Menu yang sering kamu gunakan dalam Dompet Nadnad.</p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              <div className="nanad-dashboard-deposits-row">
                <div>Dompet &amp; Tabungan</div>
                <div>
                  Kelola saldo melalui pengajuan menabung dan penarikan, simpan
                  bukti transfer, dan pantau riwayat transaksi kamu.
                </div>
                <div>
                  <Link
                    href="/wallet"
                    className="nanad-dashboard-deposit-submit"
                  >
                    Buka wallet
                  </Link>
                </div>
              </div>

              <div className="nanad-dashboard-deposits-row">
                <div>Tabungan &amp; goals khusus</div>
                <div>
                  Buat beberapa kantong tabungan (saving buckets) seperti{" "}
                  <strong>dana darurat, DP rumah, modal usaha</strong>, dan
                  pantau progresnya secara terpisah dari saldo utama.
                </div>
                <div>
                  <Link href="/goals" className="nanad-dashboard-logout">
                    Buka goals
                  </Link>
                </div>
              </div>

              <div className="nanad-dashboard-deposits-row">
                <div>Arisan bersama pengguna</div>
                <div>
                  Kelola grup arisan dengan jadwal terencana, iuran bulanan, dan
                  catat setoran dari saldo Dompet Nadnad sebagai simulasi alur
                  dana.
                </div>
                <div>
                  <Link href="/arisan" className="nanad-dashboard-logout">
                    Buka arisan
                  </Link>
                </div>
              </div>

           {/* ⭐ BARU: menu event promo Balance Boost (user) */}
              <div className="nanad-dashboard-deposits-row">
                <div>Event promo Balance Boost</div>
                <div>
                  Ikuti Event Promo 30 Hari dan rasakan peluang cuan yang 
                  terus bertumbuh! Selama hingga 3 bulan, Anda berhak 
                  menikmati perkembangan dana sesuai tier event yang Anda pilih.
                  Setiap hari, nilai dana Anda berpotensi meningkat mengikuti 
                  aturan promo yang berlaku, dengan total peluang keuntungan 
                  10% hingga 30%.
                 
                </div>
                <div>
                  <Link
                    href="/promo/balance-boost"
                    className="nanad-dashboard-logout"
                  >
                    Buka promo
                  </Link>
                </div>
              </div>

              {isAdmin && (
                <>
                  <div className="nanad-dashboard-deposits-row">
                    <div>Approval transaksi</div>
                    <div>
                      Tinjau semua pengajuan deposit dan penarikan berstatus{" "}
                      <strong>PENDING</strong>, lalu setujui atau tolak secara
                      manual sebelum saldo diperbarui.
                    </div>
                    <div>
                      <Link
                        href="/admin/transactions"
                        className="nanad-dashboard-logout"
                      >
                        Panel admin
                      </Link>
                    </div>
                  </div>

                  <div className="nanad-dashboard-deposits-row">
                    <div>Edit saldo dompet</div>
                    <div>
                      Sesuaikan saldo dompet member secara langsung dengan
                      pencatatan otomatis sebagai transaksi{" "}
                      <strong>ADJUST</strong> untuk menjaga transparansi.
                    </div>
                    <div>
                      <Link
                        href="/admin/wallets"
                        className="nanad-dashboard-logout"
                      >
                        Kelola dompet
                      </Link>
                    </div>
                  </div>

                  {/* Promo Balance Boost (admin) */}
                  <div className="nanad-dashboard-deposits-row">
                    <div>Promo Balance Boost (admin)</div>
                    <div>
                      Kelola peserta promo Balance Boost, kirim cicilan harian
                      secara manual, dan pantau progres 30 hari.
                    </div>
                    <div>
                      <Link
                        href="/admin/promo/balance-boost"
                        className="nanad-dashboard-logout"
                      >
                        Panel promo
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Kolom kanan: catatan & kenyamanan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catatan & kenyamanan penggunaan</h3>
              <p>
                Beberapa hal penting sebelum kamu menggunakan Dompet Nadnad
                secara rutin.
              </p>
            </div>

            <ul
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem", paddingLeft: "1.1rem" }}
            >
              <li style={{ marginBottom: "0.4rem" }}>
                Dompet Nadnad berperan sebagai{" "}
                <strong>dompet pintar yang berizin, terpercaya, &amp; 
                ruang pencatatan</strong>, serta 
                perencanaan keuangan yang aman dan transparan.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Dana yang anda simpan dan dikelola di Nadnad Dompet Pintar
                akan memberikan pengalaman menabung terbaik untuk anda, 
                dan sesuai kesepakatan dan regulasi yang berlaku.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Jika ada keraguan terkait nomor rekening tujuan atau status
                transaksi, gunakan tombol{" "}
                <strong>Pengaduan WhatsApp</strong> di pojok kanan bawah untuk
                menghubungi admin.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Fitur <strong>Tabungan / Goals</strong> bersifat perencanaan.
                Angka di goals tidak otomatis mengunci saldo dompet utama, jadi
                tetap cek mutasi rekening resmi saat mengambil keputusan.
              </li>
            </ul>
          </div>
        </section>

        {/* Footer + info loading/error */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Dompet Nadnad adalah dompet pintar yang beroperasi secara resmi,
            transparan, dan dapat dipercaya. Nadnad membantu pengguna dalam 
            memberikan arahan, rekomendasi, dan pendampingan finansial sesuai
            kebutuhan pribadi masing-masing.
        </footer>

        {loading && (
          <p
            className="nanad-dashboard-body"
            style={{ fontSize: "0.78rem", marginTop: "0.4rem" }}
          >
            Memuat data dashboard...
          </p>
        )}

        {loadError && (
          <p
            className="nanad-dashboard-body"
            style={{ fontSize: "0.78rem", color: "#fecaca" }}
          >
            {loadError}
          </p>
        )}
      </div>
    </main>
  );
}
