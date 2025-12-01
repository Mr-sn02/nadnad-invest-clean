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

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

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
                Dashboard dompet &amp; perencanaan dana
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
            Ruang tenang untuk mencatat alur dana kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Dari satu dashboard, kamu dapat mengakses dompet, tabungan
            khusus (saving goals), memantau riwayat pengajuan setoran dan
            penarikan, serta—jika kamu admin—meninjau permintaan pengguna
            sebelum saldo diperbarui.
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
                Saldo ini akan berubah setelah pengajuan deposit dan penarikan{" "}
                <strong>disetujui secara manual oleh admin.</strong>
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Peran</p>
              <p className="nanad-dashboard-stat-number">
                {isAdmin ? "Admin & Member" : "Member"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Admin memiliki akses tambahan untuk menyetujui transaksi dan
                melakukan penyesuaian saldo dompet secara terkontrol.
              </p>
            </div>
          </div>
        </section>

        {/* Navigasi utama */}
        <section className="nanad-dashboard-table-section">
          {/* Kolom kiri: akses utama */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Akses utama</h3>
              <p>Menu yang sering kamu gunakan di Dompet Nadnad.</p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              <div className="nanad-dashboard-deposits-row">
                <div>Dompet &amp; pengajuan</div>
                <div>
                  Kelola saldo melalui pengajuan deposit dan penarikan, simpan
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
                  catat setoran dari saldo dompet Dompet Nadnad sebagai simulasi alur dana.
                </div>
                <div>
                  <Link href="/arisan" className="nanad-dashboard-logout">
                    Buka arisan
                  </Link>
                </div>
              </div>

              {/* 🔥 LINK PROMO BALANCE BOOST */}
              <div className="nanad-dashboard-deposits-row">
                <div>Promo Balance Boost</div>
                <div>
                  Event promo terbatas di mana sebagian pengguna yang aktif
                  menyetor berkesempatan mendapatkan bonus saldo sebagai bentuk
                  apresiasi (tanpa janji keuntungan tetap).
                </div>
                <div>
                  <Link
                    href="/promo/balance-boost"
                    className="nanad-dashboard-logout"
                  >
                    Lihat promo
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
                <strong>ruang pencatatan &amp; perencanaan</strong>, bukan
                sebagai lembaga investasi berizin.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Dana nyata tetap disimpan dan dikelola pada rekening resmi
                milik pengguna dan/atau pengelola sesuai kesepakatan dan
                regulasi yang berlaku.
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
            Dompet Nadnad tidak memberikan janji keuntungan tertentu. Segala
            keputusan finansial tetap menjadi tanggung jawab masing-masing
            pengguna.
          </span>
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
