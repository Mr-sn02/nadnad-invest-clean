"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient"; // sesuaikan kalau path beda

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Kalau sudah login & masih buka /register → lempar ke dashboard
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirm) {
      setErrorMsg("Kata sandi dan konfirmasi tidak sama.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nama,
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Registrasi gagal, coba lagi.");
      return;
    }

    // Setelah daftar, arahkan ke login
    router.push("/login");
  }

  return (
    <main className="nanad-login-page">
      <div className="nanad-login-shell">
        {/* Brand bar */}
        <header className="nanad-login-brand">
          <div className="nanad-login-brand-left">
            <div className="nanad-login-logo">N</div>
            <div className="nanad-login-brand-text">
              <p className="nanad-login-brand-title">Nanad Invest</p>
              <p className="nanad-login-brand-sub">
                Personal Planning &amp; Simulation Space
              </p>
            </div>
          </div>
          <span className="nanad-login-badge">Create Plan Account</span>
        </header>

        {/* Main content */}
        <div className="nanad-login-main">
          {/* Kiri: storytelling */}
          <section className="nanad-login-copy">
            <div>
              <p className="nanad-login-eyebrow">Start your plan</p>
              <h1 className="nanad-login-heading">
                Buat akun
                <span>Nanad Invest untuk semua rencana keuanganmu.</span>
              </h1>
              <p className="nanad-login-text">
                Simpan beberapa rencana sekaligus — dari dana darurat, rumah,
                pendidikan, sampai pensiun. Semua bisa kamu ubah seiring hidup
                dan prioritasmu berubah.
              </p>

              <div className="nanad-login-highlights">
                <div className="nanad-login-highlight-card nanad-login-highlight-primary">
                  <p className="nanad-login-highlight-title">
                    Satu akun, banyak tujuan
                  </p>
                  <p className="nanad-login-highlight-body">
                    Kelola beberapa target dana dalam satu dasbor yang rapi dan
                    tenang.
                  </p>
                </div>
                <div className="nanad-login-highlight-card">
                  <p className="nanad-login-highlight-title">
                    Data tetap milikmu
                  </p>
                  <p className="nanad-login-highlight-body">
                    Informasi yang kamu isi dipakai untuk simulasi internal,
                    bukan untuk “menodong” produk tertentu.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Kanan: kartu form register */}
          <section className="nanad-login-card">
            <div className="nanad-login-card-header">
              <p>New account</p>
              <h2>Buat akun Nanad Invest</h2>
              <p>
                Isi data singkat di bawah. Kamu selalu bisa memperbarui nama dan
                rencana di dalam dasbor.
              </p>
            </div>

            <form onSubmit={handleRegister} className="nanad-login-form">
              <div className="nanad-login-field">
                <label>Nama lengkap</label>
                <div className="nanad-login-input-wrapper">
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama kamu"
                  />
                </div>
              </div>

              <div className="nanad-login-field">
                <label>Email</label>
                <div className="nanad-login-input-wrapper">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="nanad-login-field">
                <label>Kata sandi</label>
                <div className="nanad-login-input-wrapper">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                  />
                </div>
              </div>

              <div className="nanad-login-field">
                <label>Konfirmasi kata sandi</label>
                <div className="nanad-login-input-wrapper">
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Ulangi kata sandi"
                  />
                </div>
              </div>

              <div className="nanad-login-row">
                <label className="nanad-login-remember">
                  <input type="checkbox" required />
                  <span>
                    Saya setuju data saya digunakan untuk simulasi rencana di
                    Nanad Invest.
                  </span>
                </label>
              </div>

              {errorMsg && (
                <p className="nanad-login-error">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="nanad-login-submit"
              >
                {loading ? "Memproses..." : "Daftar sekarang"}
              </button>
            </form>

            <p className="nanad-login-bottom-text">
              Sudah punya akun? <a href="/login">Masuk di sini</a>
            </p>
            <p className="nanad-login-bottom-sub">
              Kamu bisa menghapus atau mengubah rencana kapan pun dari dalam
              dasbor.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
