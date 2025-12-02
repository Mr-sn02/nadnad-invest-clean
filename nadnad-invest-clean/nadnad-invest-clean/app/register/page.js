// app/register/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [refCode, setRefCode] = useState(""); // kode referral (opsional)
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Ambil ?ref= dari URL di sisi client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || "";
    if (ref) {
      setRefCode(ref);
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanRefCode = refCode.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirm) {
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
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            referred_by_code: cleanRefCode || null, // dipakai nanti saat buat dompet / tiket referral
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "Gagal mendaftar.");
        return;
      }

      alert(
        "Pendaftaran berhasil. Silakan masuk menggunakan email & password yang baru kamu buat."
      );
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
        </div>

        <form onSubmit={handleRegister} className="nanad-auth-form">
          <div className="nanad-auth-field">
            Nama pengguna (username)
            <input
              type="text"
              placeholder="contoh: nadnad.family"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

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

          {/* Kode referral (opsional) */}
          <div className="nanad-auth-field">
            Kode referral (opsional)
            <input
              type="text"
              placeholder="contoh: NAD603A1"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
            />
            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
            >
              Jika temanmu mengirim link berisi kode referral, kolom ini akan
              terisi otomatis. Kamu tetap bisa mendaftar tanpa kode.
            </p>
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
