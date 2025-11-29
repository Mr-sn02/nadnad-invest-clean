// app/reset-password/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Cek apakah token recovery valid → akan ada session user sementara
  useEffect(() => {
    const checkUser = async () => {
      setChecking(true);
      setError("");
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error (reset):", error.message);
        }

        if (!user) {
          setError(
            "Link ganti password tidak valid atau sudah kadaluarsa. Silakan minta link baru dari halaman Profil."
          );
          return;
        }

        setUser(user);
      } catch (err) {
        console.error("Unexpected reset check error:", err);
        setError("Terjadi kesalahan saat memvalidasi link reset.");
      } finally {
        setChecking(false);
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password || password.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("updateUser (password) error:", error.message);
        setError("Gagal mengubah password. Coba lagi.");
        return;
      }

      setMessage("Password berhasil diubah. Kamu bisa login dengan password baru.");
      // Opsional: redirect otomatis ke login setelah beberapa detik
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      console.error("Unexpected update password error:", err);
      setError("Terjadi kesalahan saat mengubah password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Reset password</p>
          <h1 className="nanad-dashboard-heading">
            Atur ulang password Nanad Invest kamu.
          </h1>

          {checking ? (
            <p className="nanad-dashboard-body">
              Memvalidasi link ganti password...
            </p>
          ) : error ? (
            <>
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.75rem" }}
              >
                {error}
              </p>
              <button
                type="button"
                className="nanad-dashboard-deposit-submit"
                style={{ marginTop: "0.75rem" }}
                onClick={() => router.push("/profile")}
              >
                Kembali ke halaman profil
              </button>
            </>
          ) : (
            <>
              <p className="nanad-dashboard-body">
                Masukkan password baru yang aman untuk akun{" "}
                <strong>{user?.email}</strong>. Setelah disimpan, kamu akan
                diminta login ulang dengan password baru tersebut.
              </p>

              <form
                onSubmit={handleSubmit}
                style={{
                  marginTop: "1rem",
                  maxWidth: "360px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                <label className="nanad-dashboard-deposit-amount">
                  Password baru
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />
                </label>

                <label className="nanad-dashboard-deposit-amount">
                  Konfirmasi password baru
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Ulangi password baru"
                  />
                </label>

                {error && (
                  <p
                    className="nanad-dashboard-body"
                    style={{ color: "#fecaca", fontSize: "0.8rem" }}
                  >
                    {error}
                  </p>
                )}
                {message && (
                  <p
                    className="nanad-dashboard-body"
                    style={{ color: "#bbf7d0", fontSize: "0.8rem" }}
                  >
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  className="nanad-dashboard-deposit-submit"
                  disabled={saving}
                  style={{ marginTop: "0.5rem" }}
                >
                  {saving ? "Menyimpan password..." : "Simpan password baru"}
                </button>
              </form>
            </>
          )}
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Reset password.
          </span>
          <span>
            Jangan bagikan link reset password ini ke siapa pun. Jika kamu tidak
            merasa meminta reset, segera abaikan email tersebut.
          </span>
        </footer>
      </div>
    </main>
  );
}
