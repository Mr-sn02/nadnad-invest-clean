"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    alert("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
    router.push("/login");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Daftar Akun</h1>

      <form onSubmit={handleRegister} style={{ display: "grid", gap: "1rem", maxWidth: "320px" }}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Sudah punya akun? <a href="/login">Login di sini</a>
      </p>
    </div>
  );
}
