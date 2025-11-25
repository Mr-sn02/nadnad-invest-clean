"use client";

import { supabase } from "../../lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    if (!data.user) {
      router.push("/login");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    getUser();
  }, []);

  if (!user) return <p style={{ padding: 40 }}>Memuat akun...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "60px auto" }}>
      <h1>Dashboard</h1>
      <p>Selamat datang, {user.email}</p>

      <button className="btn-main" onClick={handleLogout} style={{ marginTop: 20 }}>
        Logout
      </button>
    </div>
  );
}
