"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Kalau sudah login & masih coba buka /login → lempar ke dashboard
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

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message || "Login gagal, cek email & kata sandi.");
      return;
    }

    router.push("/");
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
          <span className="nanad-login-badge">Beta Studio · v0.1</span>
        </header>

        {/* Main content */}
        <div className="nanad-login-main">
          {/* Left copy */}
          <section className="nanad-login-copy">
            <p className="nanad-login-eyebrow">Welcome back</p>
            <h1 className="nanad-login-heading">
              Masuk ke ruang
              <span>rencana finansial yang rapi &amp; elegan.</span>
            </h1>
            <p className="nanad-login-text">
              Simulasikan tujuan, rancang setoran, dan lihat bagaimana
              rencanamu bisa tumbuh secara terukur. Semua tersimpan rapi,
              tanpa tekanan untuk langsung mengeksekusi di instrumen nyata.
            </p>

            <div className="nanad-login-highlights">
              <div className="nanad-login-highlight-card nanad-login-highlight-primary">
                <p className="nanad-login-highlight-title">
                  Ruang simulasi dulu
                </p>
                <p className="nanad-login-highlight-body">
                  Uji berbagai skenario: dana darurat, rumah, pensiun —
                  tanpa mengubah uang di rekeningmu.
                </p>
              </div>
              <div className="nanad-login-highlight-card">
                <p className="nanad-login-highlight-title">
                  Satu dasbor, banyak tujuan
                </p>
                <p className="nanad-login-highlight-body">
                  Lihat gambaran besar keuanganmu dalam satu tampilan tenang,
                  bukan penuh angka yang bikin panik.
                </p>
              </div>
            </div>
          </section>

          {/* Right card */}
          <section className="nanad-login-card">
            <div className="nanad-login-card-header">
              <p className="nanad-login-card-eyebrow">Secure access</p>
              <h2>Masuk ke dashboard Nanad Invest</h2>
              <p>
                Gunakan email yang kamu daftarkan. Kamu bisa mengubah detail
                rencana kapan pun di dalam dasbor.
              </p>
            </div>

            <form onSubmit={handleLogin} className="nanad-login-form">
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
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="nanad-login-row">
                <label className="nanad-login-remember">
                  <input type="checkbox" />
                  <span>Ingat saya di perangkat ini</span>
                </label>
                <button
                  type="button"
                  className="nanad-login-forgot"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {errorMsg && (
                <p className="nanad-login-error">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="nanad-login-submit"
              >
                {loading ? "Memproses..." : "Masuk sekarang"}
              </button>
            </form>

            <p className="nanad-login-bottom-text">
              Belum punya akun? <a href="/register">Daftar dulu</a>
            </p>
            <p className="nanad-login-bottom-sub">
              Dengan masuk, kamu menyetujui pengelolaan data rencana untuk
              keperluan simulasi di Nanad Invest.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
