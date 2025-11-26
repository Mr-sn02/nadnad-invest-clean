"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    }

    loadUser();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!user) return <p style={{ padding: "1rem" }}>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Selamat datang, <strong>{user.email}</strong></p>

      <button onClick={logout} style={{ marginTop: "1rem" }}>
        Logout
      </button>
    </div>
  );
}
