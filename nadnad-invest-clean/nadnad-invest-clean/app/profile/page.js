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

  // state untuk form ganti password langsung
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError("");
      try {
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
      } catch (err) {
        console.error("Unexpected profile error:", err);
        setError("Gagal memuat data akun.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
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
            membagikan data login kepada siapa pun, termasuk pihak yang
            mengaku admin Dompet Nadnad.
          </p>

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
          </div>

          {/* Reminder keamanan */}
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

          {/* Form ganti password langsung */}
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
