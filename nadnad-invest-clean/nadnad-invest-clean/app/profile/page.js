// app/profile/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

// helper tanggal
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // 🔹 data dompet & referral
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState("");
  const [referralCount, setReferralCount] = useState(0);

  // state untuk form ganti password langsung
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      setWalletError("");
      try {
        // 1. Ambil user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("getUser error:", error.message);
        }
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        // 2. Ambil dompet + referral (kalau ada)
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("id, balance, account_number, referral_code, referred_by")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Profile wallet error:", wErr.message);
          setWalletError(
            "Gagal memuat info Dompet Nadnad. Pastikan tabel 'wallets' sudah ada."
          );
        } else if (w) {
          setWallet(w);

          // hitung teman yang daftar pakai referral_code kita
          if (w.referral_code) {
            const { data: referredRows, error: refErr } = await supabase
              .from("wallets")
              .select("id")
              .eq("referred_by", w.referral_code);

            if (refErr) {
              console.error("Profile referral count error:", refErr.message);
            } else {
              setReferralCount(referredRows?.length || 0);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected profile error:", err);
        setError("Gagal memuat data akun.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
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

  // 👉 Ganti password langsung (tanpa email)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdMessage("");

    if (!newPassword || newPassword.length < 6) {
      setPwdError("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setPwdLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("updateUser (password) error:", error.message);
        setPwdError("Gagal mengubah password. Coba lagi.");
        return;
      }

      setPwdMessage(
        "Password berhasil diubah. Kamu akan diminta login ulang dengan password baru."
      );

      // kosongkan form
      setNewPassword("");
      setConfirmPassword("");

      // setelah beberapa detik, paksa logout agar login pakai password baru
      setTimeout(() => {
        handleLogout();
      }, 2500);
    } catch (err) {
      console.error("Unexpected update password error:", err);
      setPwdError("Terjadi kesalahan saat mengubah password.");
    } finally {
      setPwdLoading(false);
    }
  };

  // 👉 helper copy ke clipboard
  const copyToClipboard = async (value, label) => {
    if (!value) {
      alert(`${label} belum tersedia.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      alert(`${label} disalin ke clipboard.`);
    } catch (err) {
      console.error("Clipboard error:", err);
      alert("Gagal menyalin. Silakan salin manual.");
    }
  };

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    "(belum diatur)";

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat profil akun...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Profile error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat profil Dompet Nadnad.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {error}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/dashboard")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke dashboard
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            {/* Logo N elegan */}
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Profil akun &amp; keamanan dompet pintar
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/dashboard")}
          >
            Kembali ke dashboard
          </button>
        </header>

        {/* Isi profil */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Your account</p>
          <h1 className="nanad-dashboard-heading">
            Detail akun Dompet Nadnad kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Jaga kerahasiaan email, password, dan kode OTP. Jangan pernah
            membagikan data login kepada siapa pun, termasuk pihak yang mengaku
            admin Dompet Nadnad.
          </p>

          {/* Stat grid lama + tambahkan username */}
          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Email</p>
              <p
                className="nanad-dashboard-stat-number"
                style={{ fontSize: 16 }}
              >
                {user?.email}
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">User ID</p>
              <p
                className="nanad-dashboard-stat-number"
                style={{ fontSize: 12, fontFamily: "monospace" }}
              >
                {user?.id}
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Bergabung sejak</p>
              <p
                className="nanad-dashboard-stat-number"
                style={{ fontSize: 14 }}
              >
                {formatDate(user?.created_at)}
              </p>
            </div>

            {/* ➕ BARU: Username */}
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Nama pengguna</p>
              <p
                className="nanad-dashboard-stat-number"
                style={{ fontSize: 14 }}
              >
                {username}
              </p>
            </div>
          </div>

          {/* Reminder keamanan (lama) */}
          <div
            style={{
              marginTop: "1.5rem",
              borderRadius: "24px",
              padding: "1rem 1.25rem",
              border: "1px solid rgba(250,204,21,0.4)",
              background:
                "radial-gradient(circle at top, rgba(250,204,21,0.08), rgba(15,23,42,1))",
              fontSize: "0.8rem",
              color: "#fef9c3",
            }}
          >
            <p
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontSize: "0.65rem",
                marginBottom: "0.3rem",
              }}
            >
              PENGINGAT KEAMANAN
            </p>
            <ul style={{ paddingLeft: "1rem", margin: 0 }}>
              <li>
                Jangan pernah membagikan password atau kode OTP kepada siapa pun.
              </li>
              <li>
                Selalu cek alamat website sebelum login. Pastikan domain resmi
                Dompet Nadnad / Nanad kamu, bukan tiruan.
              </li>
              <li>
                Jika ada aktivitas mencurigakan, segera gunakan tombol{" "}
                <strong>Pengaduan WhatsApp</strong> di pojok kanan bawah.
              </li>
            </ul>
          </div>

          {/* 🔹 BLOK BARU: Info Dompet Nadnad & Referral */}
          <div
            style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
              gap: "1rem",
            }}
          >
            {/* Kiri: Dompet & nomor rekening internal */}
            <div
              style={{
                borderRadius: "24px",
                padding: "1rem 1.25rem",
                border: "1px solid rgba(148,163,184,0.4)",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
                fontSize: "0.82rem",
              }}
            >
              <p
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "0.7rem",
                  marginBottom: "0.5rem",
                  color: "#e5e7eb",
                }}
              >
                DOMPET NADNAD
              </p>

              {walletError && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.78rem" }}
                >
                  {walletError}
                </p>
              )}

              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ opacity: 0.8 }}>Nomor Dompet Nadnad</div>
                <div
                  style={{
                    marginTop: "0.25rem",
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    letterSpacing: "0.14em",
                  }}
                >
                  {wallet?.account_number || "— belum tersedia —"}
                </div>
                <div style={{ marginTop: "0.4rem" }}>
                  <button
                    type="button"
                    className="nanad-dashboard-logout"
                    onClick={() =>
                      copyToClipboard(
                        wallet?.account_number,
                        "Nomor Dompet Nadnad"
                      )
                    }
                  >
                    Salin nomor Dompet Nadnad
                  </button>
                </div>
                <p
                  className="nanad-dashboard-body"
                  style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}
                >
                  Nomor ini nantinya bisa dipakai untuk fitur{" "}
                  <strong>kirim saldo antar Dompet Nadnad</strong> seperti kirim
                  ke nomor rekening internal.
                </p>
              </div>
            </div>

            {/* Kanan: Referral code & statistik sederhana */}
            <div
              style={{
                borderRadius: "24px",
                padding: "1rem 1.25rem",
                border: "1px solid rgba(148,163,184,0.4)",
                background:
                  "radial-gradient(circle at top, rgba(56,189,248,0.12), rgba(15,23,42,1))",
                fontSize: "0.82rem",
              }}
            >
              <p
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "0.7rem",
                  marginBottom: "0.5rem",
                  color: "#e5e7eb",
                }}
              >
                REFERRAL DOMPET NADNAD
              </p>

              <div style={{ marginBottom: "0.8rem" }}>
                <div style={{ opacity: 0.8 }}>Kode referral</div>
                <div
                  style={{
                    marginTop: "0.25rem",
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    letterSpacing: "0.12em",
                  }}
                >
                  {wallet?.referral_code || "— belum tersedia —"}
                </div>

                <div
                  style={{
                    marginTop: "0.4rem",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.4rem",
                  }}
                >
                  <button
                    type="button"
                    className="nanad-dashboard-logout"
                    onClick={() =>
                      copyToClipboard(
                        wallet?.referral_code,
                        "Kode referral Dompet Nadnad"
                      )
                    }
                  >
                    Salin kode referral
                  </button>
                  {wallet?.referral_code && (
                    <button
                      type="button"
                      className="nanad-dashboard-logout"
                      onClick={() =>
                        copyToClipboard(
                          `Aku lagi pakai Dompet Nadnad buat rapihin tabungan. Kamu bisa daftar di ${window.location.origin}/register?ref=${wallet.referral_code}`,
                          "Teks ajakan Dompet Nadnad"
                        )
                      }
                    >
                      Salin teks ajakan
                    </button>
                  )}
                </div>

                <p
                  className="nanad-dashboard-body"
                  style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}
                >
                  Bagikan kode ini ke temanmu. Jika mereka daftar dan aktif,
                  kamu bisa mendapat{" "}
                  <strong>kesempatan hadiah tambahan</strong> di event promo
                  (bukan janji keuntungan tetap).
                </p>
              </div>

              <div
                style={{
                  marginTop: "0.4rem",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "18px",
                  border: "1px dashed rgba(148,163,184,0.8)",
                  fontSize: "0.78rem",
                }}
              >
                <p style={{ marginBottom: "0.2rem" }}>
                  Teman yang terdeteksi daftar memakai kode kamu:{" "}
                  <strong>{referralCount}</strong>
                </p>
                <p style={{ opacity: 0.9 }}>
                  Angka ini hanya hitungan administratif. Ketentuan hadiah promo
                  akan dijelaskan di halaman event yang berlaku.
                </p>
              </div>
            </div>
          </div>

          {/* Aksi akun: logout & ganti password */}
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={handleLogout}
            >
              Logout dari akun ini
            </button>
          </div>

          {/* Form ganti password langsung (lama, tetap) */}
          <div
            style={{
              marginTop: "1.5rem",
              maxWidth: "380px",
              borderRadius: "24px",
              padding: "1rem 1.25rem",
              border: "1px solid rgba(148,163,184,0.4)",
              background:
                "radial-gradient(circle at top, rgba(148,163,184,0.12), rgba(15,23,42,1))",
              fontSize: "0.8rem",
            }}
          >
            <p
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "0.7rem",
                marginBottom: "0.5rem",
                color: "#e5e7eb",
              }}
            >
              GANTI PASSWORD
            </p>
            <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
              Password baru hanya bisa diubah saat kamu sudah login. Setelah
              password diubah, kamu akan diminta login ulang menggunakan password
              yang baru.
            </p>

            <form
              onSubmit={handleChangePassword}
              style={{
                marginTop: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <label className="nanad-dashboard-deposit-amount">
                Password baru
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Konfirmasi password baru
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </label>

              {pwdError && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.78rem" }}
                >
                  {pwdError}
                </p>
              )}
              {pwdMessage && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#bbf7d0", fontSize: "0.78rem" }}
                >
                  {pwdMessage}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={pwdLoading}
                style={{ marginTop: "0.3rem" }}
              >
                {pwdLoading ? "Menyimpan password..." : "Simpan password baru"}
              </button>
            </form>
          </div>
        </section>

        {/* Footer kecil */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Account &amp; security
            page.
          </span>
          <span>
            Jaga selalu kerahasiaan akun kamu. Untuk keamanan tambahan, ganti
            password secara berkala dan hindari menggunakan password yang sama
            dengan layanan lain.
          </span>
        </footer>
      </div>
    </main>
  );
}
