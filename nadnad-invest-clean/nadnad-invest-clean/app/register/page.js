"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage(
      "Akun berhasil dibuat. Jika verifikasi email aktif, silakan cek inbox."
    );
  }

  return (
    <main className="auth-shell">
      <div className="container auth-inner">
        <div className="auth-panel">
          <div className="auth-header">
            <div className="auth-eyebrow">Nadnad Invest</div>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-sub">
              Daftar dengan email dan password untuk menyimpan simulasi dan
              mengakses dashboard pribadi Anda.
            </p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <label className="auth-label">
              Email
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </label>

            <label className="auth-label">
              Password
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                placeholder="Minimal 6 karakter"
              />
            </label>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <button type="submit" className="btn-main auth-submit" disabled={loading}>
              {loading ? "Membuat akun..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Sudah punya akun?{" "}
            <a href="/login" className="auth-link">
              Masuk di sini
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
