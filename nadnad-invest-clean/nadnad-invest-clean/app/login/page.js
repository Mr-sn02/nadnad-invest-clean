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
        setErrorMsg(error.message || "Gagal masuk. Periksa kembali data login.");
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

  return (
    <main className="nanad-auth-page">
      <div className="nanad-auth-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="nanad-auth-logo">N</div>
          <div>
            <p className="nanad-dashboard-brand-title">Nanad Invest</p>
            <p className="nanad-dashboard-brand-sub">
              Ruang pribadi perencanaan dana
            </p>
          </div>
        </div>

        <div>
          <h1 className="nanad-auth-title">Masuk ke Nanad Invest</h1>
          <p className="nanad-auth-sub">
            Gunakan email dan kata sandi yang telah terdaftar untuk mengakses
            dashboard dan dompet kamu.
          </p>
        </div>

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
