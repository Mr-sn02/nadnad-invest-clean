// app/register/page.js
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref"); // ?ref=NAD123456

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

    if (password !== confirm) {
      setErrorMsg("Kata sandi dan konfirmasi tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // simpan kode referral yang dipakai (kalau ada)
          data: {
            ref_code_used: refFromUrl || null,
          },
        },
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="nanad-auth-logo">N</div>
          <div>
            <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
            <p className="nanad-dashboard-brand-sub">
              Langkah awal ruang finansial elegan
            </p>
          </div>
        </div>

        <div>
          <h1 className="nanad-auth-title">Daftar akun Dompet Nadnad</h1>
          <p className="nanad-auth-sub">
            Buat akun untuk mulai mencatat setoran, penarikan, dan rencana
            simpanan di satu ruang yang rapi dan mewah.
          </p>

          {refFromUrl && (
            <p
              className="nanad-dashboard-body"
              style={{
                marginTop: "0.4rem",
                fontSize: "0.8rem",
                color: "#bbf7d0",
              }}
            >
              Kamu mendaftar dengan kode undangan:{" "}
              <strong>{refFromUrl}</strong>. Kode ini akan tercatat sebagai
              referral saat dompet pertamamu aktif.
            </p>
          )}
        </div>

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

        <div className="nanad-auth-footer">
          Sudah punya akun?{" "}
          <Link href="/login" style={{ color: "#f5d17a" }}>
            Masuk di sini
          </Link>
        </div>
      </div>
    </main>
  );
}
