"use client";

- import { supabase } from "../../lib/supabaseClient";
+ import { supabase } from "../lib/supabaseClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // kalau sudah login, langsung lempar ke dashboard
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        window.location.href = "/dashboard";
      }
    });
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="auth-shell">
      <div className="container auth-inner">
        <div className="auth-panel">
          <div className="auth-header">
            <div className="auth-eyebrow">Nadnad Invest</div>
            <h1 className="auth-title">Sign in to your space</h1>
            <p className="auth-sub">
              Masuk dengan email dan password untuk melanjutkan simulasi dan
              melihat dashboard elegan Anda.
            </p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
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
                required
                placeholder="••••••••"
              />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn-main auth-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-footer-text">
            Belum punya akun?{" "}
            <a href="/register" className="auth-link">
              Daftar dulu
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
