// app/register/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password || !confirm) {
      setErrorMsg("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Kata sandi dan konfirmasi tidak sama.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Gagal mendaftar.");
        return;
      }

      alert("Pendaftaran berhasil. Silakan masuk menggunakan akun baru.");
      router.push("/login");
    } catch (err) {
      console.error("Register error:", err);
      setErrorMsg("Terjadi kesalahan saat proses pendaftaran.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="nanad-auth-page">
      <div className="nanad-auth-shell">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="nanad-auth-logo nanad-logo-n">N</div>
          <div>
            <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
            <p className="nanad-dashboard-brand-sub">
              Dompet pintar pelanggan &amp; komunitas
            </p>
          </div>
        </div>

        {/* Judul */}
        <div>
          <h1 className="nanad-auth-title">Daftar akun Dompet Nadnad</h1>
          <p className="nanad-auth-sub">
            Buat akun untuk mulai menggunakan dompet pintar, arisan pelanggan,
            dan papan pencatatan keuangan yang rapi dalam satu ruang elegan.
          </p>
        </div>

        {/* Form register */}
        <form onSubmit={handleRegister} className="nanad-auth-form">
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
              placeholder="minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="nanad-auth-field">
            Konfirmasi kata sandi
            <input
              type="password"
              placeholder="ulang kata sandi"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Memproses..." : "Buat akun"}
          </button>
        </form>

        {/* Footer: sudah punya akun */}
        <div className="nanad-auth-footer">
          Sudah punya akun?{" "}
          <Link href="/login" style={{ color: "#f5d17a" }}>
            Masuk ke Dompet Nadnad
          </Link>
        </div>
      </div>
    </main>
  );
}
