// app/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State untuk fitur "Lupa password"
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Email dan kata sandi wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message || "Gagal masuk. Periksa kembali data login."
        );
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Terjadi kesalahan saat proses login.");
    } finally {
      setLoading(false);
    }
  };

  // 👉 Kirim email lupa password, redirect ke /profile
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");

    // Kalau user sudah isi email di form login, boleh dipakai juga
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail) {
      setResetError("Masukkan email yang terdaftar terlebih dahulu.");
      return;
    }

    try {
      setResetLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        targetEmail,
        {
          redirectTo: `${window.location.origin}/profile`,
        }
      );

      if (error) {
        console.error("resetPasswordForEmail error:", error.message);
        setResetError(
          "Gagal mengirim link reset password. Pastikan email sudah terdaftar."
        );
        return;
      }

      setResetMessage(
        `Link reset password telah dikirim ke email ${targetEmail}. Silakan cek inbox atau folder spam. Setelah klik link, kamu akan diarahkan ke halaman Profil untuk mengganti password.`
      );
    } catch (err) {
      console.error("Unexpected reset error:", err);
      setResetError("Terjadi kesalahan saat mengirim link reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="nanad-auth-page">
      <div className="nanad-auth-shell">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="nanad-auth-logo">N</div>
          <div>
            <p className="nanad-dashboard-brand-title">Nanad Invest</p>
            <p className="nanad-dashboard-brand-sub">
              Ruang pribadi perencanaan dana
            </p>
          </div>
        </div>

        {/* Judul */}
        <div>
          <h1 className="nanad-auth-title">Masuk ke Nanad Invest</h1>
          <p className="nanad-auth-sub">
            Gunakan email dan kata sandi yang telah terdaftar untuk mengakses
            dashboard dan dompet kamu.
          </p>
        </div>

        {/* Form login */}
        <form onSubmit={handleLogin} className="nanad-auth-form">
          <div className="nanad-auth-field">
            Email
            <input
              type="email"
              placeholder="nama@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="nanad-auth-field">
            Kata sandi
            <input
              type="password"
              placeholder="•••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", fontSize: "0.8rem" }}
            >
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="nanad-dashboard-deposit-submit"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk sekarang"}
          </button>
        </form>

        {/* Tombol kecil: Lupa password */}
        <button
          type="button"
          onClick={() => setShowReset((s) => !s)}
          className="nanad-dashboard-logout"
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            alignSelf: "flex-start",
            paddingInline: "1rem",
          }}
        >
          {showReset ? "Tutup form lupa password" : "Lupa password?"}
        </button>

        {/* Panel form lupa password */}
        {showReset && (
          <div
            style={{
              marginTop: "0.75rem",
              width: "100%",
              maxWidth: "420px",
              borderRadius: "18px",
              padding: "0.9rem 1rem",
              border: "1px solid rgba(148,163,184,0.5)",
              background:
                "radial-gradient(circle at top, rgba(148,163,184,0.18), rgba(15,23,42,1))",
              fontSize: "0.8rem",
            }}
          >
            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}
            >
              Masukkan email yang terdaftar di Nanad Invest. Kami akan
              mengirimkan link untuk mengatur ulang password. Link tersebut akan
              mengarahkan kamu ke halaman <strong>Profil</strong>, di mana kamu
              bisa mengganti password melalui form ganti password.
            </p>

            <form
              onSubmit={handleResetPassword}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div className="nanad-auth-field">
                Email terdaftar
                <input
                  type="email"
                  placeholder="nama@contoh.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              {resetError && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.78rem" }}
                >
                  {resetError}
                </p>
              )}
              {resetMessage && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#bbf7d0", fontSize: "0.78rem" }}
                >
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-logout"
                disabled={resetLoading}
                style={{ marginTop: "0.3rem" }}
              >
                {resetLoading
                  ? "Mengirim link reset..."
                  : "Kirim link reset password"}
              </button>
            </form>
          </div>
        )}

        {/* Footer register */}
        <div className="nanad-auth-footer">
          Belum punya akun?{" "}
          <Link href="/register" style={{ color: "#f5d17a" }}>
            Daftar Nanad Invest
          </Link>
        </div>
      </div>
    </main>
  );
}
