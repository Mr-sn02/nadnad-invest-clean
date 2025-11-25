"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("Akun berhasil dibuat! Silakan login.");
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Buat akun Nadnad Invest</h1>

      {errorMsg && (
        <p style={{ color: "red", marginBottom: 10 }}>{errorMsg}</p>
      )}

      <form onSubmit={handleRegister} style={{ display: "grid", gap: 12 }}>
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
          placeholder="Password minimal 6 karakter"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />

        <button type="submit" className="btn-main">
          Daftar
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Sudah punya akun? <a href="/login">Login</a>
      </p>
    </div>
  );
}
