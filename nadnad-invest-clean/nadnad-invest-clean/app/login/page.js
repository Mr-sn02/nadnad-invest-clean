"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Masuk ke Nadnad Invest</h1>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: 10 }}>{errorMsg}</p>
      )}

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />

        <button type="submit" className="btn-main">
          Login
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Belum punya akun? <a href="/register">Daftar</a>
      </p>
    </div>
  );
}
