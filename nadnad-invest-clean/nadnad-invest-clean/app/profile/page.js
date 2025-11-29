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
              Gagal memuat profil Nanad Invest.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {error}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/")}
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
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Profil akun &amp; keamanan
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/")}
          >
            Kembali ke dashboard
          </button>
        </header>

        {/* Isi profil */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Your account</p>
          <h1 className="nanad-dashboard-heading">
            Detail akun Nanad Invest kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Jaga kerahasiaan email, password, dan kode OTP. Jangan pernah
            membagikan data login kepada siapa pun, termasuk admin.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Email</p>
              <p className="nanad-dashboard-stat-number" style={{ fontSize: 16 }}>
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
              <p className="nanad-dashboard-stat-number" style={{ fontSize: 14 }}>
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
                Nanad Invest.
              </li>
              <li>
                Jika ada aktivitas mencurigakan, segera gunakan tombol{" "}
                <strong>Pengaduan WhatsApp</strong> di pojok kanan bawah.
              </li>
            </ul>
          </div>

          {/* Tombol aksi akun */}
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

            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() =>
                alert(
                  "Fitur ganti password bisa dihubungkan dengan Supabase Auth reset password via email."
                )
              }
            >
              Ganti password (coming soon)
            </button>
          </div>
        </section>

        {/* Footer kecil */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Account & security page.
          </span>
          <span>
            Untuk reset password resmi, gunakan mekanisme yang disediakan oleh
            penyedia autentikasi (Supabase Auth).
          </span>
        </footer>
      </div>
    </main>
  );
}
