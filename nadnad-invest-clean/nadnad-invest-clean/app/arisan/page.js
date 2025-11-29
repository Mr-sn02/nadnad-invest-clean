// app/arisan/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function generateGroupCode() {
  // 5 digit angka, misal "34821"
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function ArisanPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [myGroups, setMyGroups] = useState([]);

  // cari berdasar ID grup (5 digit)
  const [searchCode, setSearchCode] = useState("");
  const [searchError, setSearchError] = useState("");

  // form buat grup baru
  const [newName, setNewName] = useState("");
  const [newMonthly, setNewMonthly] = useState("");
  const [newRounds, setNewRounds] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [creating, setCreating] = useState(false);

  // ---- LOAD USER + GRUP-GRUPNYA ----
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

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

        // 1) grup di mana user adalah anggota
        const { data: memberRows, error: mErr } = await supabase
          .from("arisan_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (mErr) {
          console.error("load members error:", mErr.message);
        }

        const memberGroupIds = (memberRows || [])
          .map((r) => r.group_id)
          .filter(Boolean);

        let groupsFromMember = [];
        if (memberGroupIds.length > 0) {
          const { data: g1, error: g1Err } = await supabase
            .from("arisan_groups")
            .select("*")
            .in("id", memberGroupIds);

          if (g1Err) {
            console.error("load groups by member error:", g1Err.message);
          } else {
            groupsFromMember = g1 || [];
          }
        }

        // 2) grup yang user buat (owner)
        const { data: g2, error: g2Err } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("owner_user_id", user.id);

        if (g2Err) {
          console.error("load groups by owner error:", g2Err.message);
        }

        const merged = [...groupsFromMember];
        (g2 || []).forEach((g) => {
          if (!merged.find((x) => x.id === g.id)) merged.push(g);
        });

        setMyGroups(
          merged.sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          )
        );
      } catch (err) {
        console.error("Arisan page init error:", err);
        setErrorMsg("Gagal memuat halaman arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ---- CARI GRUP DARI ID (5 digit) ----
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");

    const code = searchCode.trim();

    if (!code || code.length !== 5) {
      setSearchError("ID Grup harus 5 digit angka.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("arisan_groups")
        .select("id, group_code, name")
        .eq("group_code", code)
        .maybeSingle();

      if (error) {
        console.error("Search group error:", error.message);
        setSearchError("Terjadi kesalahan saat mencari grup.");
        return;
      }

      if (!data) {
        setSearchError("Grup dengan ID tersebut tidak ditemukan.");
        return;
      }

      router.push(`/arisan/${data.id}`);
    } catch (err) {
      console.error("Search group unexpected error:", err);
      setSearchError("Terjadi kesalahan saat mencari grup.");
    }
  };

  // ---- BUAT GRUP BARU ----
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg("");

    if (!newName.trim()) {
      setErrorMsg("Nama grup arisan wajib diisi.");
      return;
    }

    const monthly = Number(newMonthly) || 0;
    const rounds = Number(newRounds) || 0;

    try {
      setCreating(true);

      // generate group_code unik
      let finalCode = null;
      for (let i = 0; i < 5; i++) {
        const candidate = generateGroupCode();
        const { data: exist, error: exErr } = await supabase
          .from("arisan_groups")
          .select("id")
          .eq("group_code", candidate)
          .maybeSingle();

        if (exErr) {
          console.error("Check group_code error:", exErr.message);
          continue;
        }
        if (!exist) {
          finalCode = candidate;
          break;
        }
      }
      if (!finalCode) finalCode = generateGroupCode();

      // insert grup
      const { data: created, error: createErr } = await supabase
        .from("arisan_groups")
        .insert({
          name: newName.trim(),
          description: null,
          group_code: finalCode,
          monthly_amount: monthly,
          total_rounds: rounds,
          start_date: newStartDate || null,
          owner_user_id: user.id,
          status: "ACTIVE",
        })
        .select("*")
        .single();

      if (createErr) {
        console.error("Create group error:", createErr.message);
        setErrorMsg(
          createErr.message || "Gagal membuat grup arisan. Coba lagi."
        );
        return;
      }

      // otomatis owner ikut sebagai anggota posisi 1
      await supabase.from("arisan_members").insert({
        group_id: created.id,
        user_id: user.id,
        position: 1,
        status: "ACTIVE",
      });

      setNewName("");
      setNewMonthly("");
      setNewRounds("");
      setNewStartDate("");

      setMyGroups((prev) => [created, ...prev]);

      alert(
        `Grup arisan berhasil dibuat.\nID Grup: ${finalCode}\nBagikan ID ini ke teman/pelanggan untuk mereka gabung.`
      );
    } catch (err) {
      console.error("Create group unexpected error:", err);
      setErrorMsg("Terjadi kesalahan saat membuat grup arisan.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat halaman arisan...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // sudah diarahkan ke login
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
                Arisan bersama sesama pengguna
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Dompet
            </button>
          </div>
        </header>

        {/* Intro */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Nanad Arisan</p>
          <h1 className="nanad-dashboard-heading">
            Kelola arisan bersama kawan &amp; pelanggan, tercatat rapi di satu
            ruang.
          </h1>
          <p className="nanad-dashboard-body">
            Setiap grup arisan punya <strong>ID Grup 5 digit</strong> yang bisa
            dibagikan ke peserta lain. Iuran tiap putaran bisa dicatat dan
            dipotong dari saldo dompet Nanad Invest.
          </p>
        </section>

        {/* Cari grup + daftar & buat grup */}
        <section className="nanad-dashboard-table-section">
          {/* Cari grup dari ID */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Cari &amp; gabung ke grup arisan</h3>
              <p>
                Masukkan <strong>ID Grup 5 digit</strong> yang dibagikan oleh
                admin arisan, lalu masuk ke halaman detail untuk bergabung.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              style={{
                marginTop: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div className="nanad-dashboard-deposit-row">
                <label>
                  Masukkan ID Grup (5 digit, contoh 34821)
                  <input
                    type="text"
                    maxLength={5}
                    value={searchCode}
                    onChange={(e) =>
                      setSearchCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    style={{
                      width: "100%",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.4rem 0.8rem",
                      color: "white",
                      fontSize: "0.8rem",
                    }}
                    placeholder="contoh: 34821"
                  />
                </label>
              </div>

              {searchError && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.78rem" }}
                >
                  {searchError}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
              >
                Cari grup dari ID
              </button>
            </form>
          </div>

          {/* Daftar arisan milik user + buat baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Arisan kamu</h3>
              <p>
                Semua grup arisan yang kamu ikuti atau kamu buat. Pilih salah
                satu untuk melihat jadwal putaran &amp; iuran.
              </p>
            </div>

            {errorMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.5rem" }}
              >
                {errorMsg}
              </p>
            )}

            {myGroups.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum tergabung atau membuat grup arisan mana pun.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {myGroups.map((g) => (
                  <div key={g.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Dibuat{" "}
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString("id-ID")
                        : "-"}
                    </div>
                    <div>
                      <strong>{g.name}</strong>
                      <br />
                      {g.group_code && (
                        <span
                          style={{
                            fontSize: "0.78rem",
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "#e5e7eb",
                          }}
                        >
                          ID GRUP:{" "}
                          <span style={{ fontFamily: "monospace" }}>
                            {g.group_code}
                          </span>
                        </span>
                      )}
                      <br />
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#9ca3af",
                        }}
                      >
                        Iuran: {formatCurrency(g.monthly_amount || 0)} · Putaran:{" "}
                        {g.total_rounds || "-"}
                      </span>
                    </div>
                    <div>
                      <Link
                        href={`/arisan/${g.id}`}
                        className="nanad-dashboard-deposit-submit"
                      >
                        Buka grup
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form buat grup baru */}
            <hr
              style={{
                margin: "1.1rem 0 0.8rem",
                borderColor: "rgba(30,64,175,0.4)",
              }}
            />

            <div className="nanad-dashboard-deposits-header">
              <h3>Buat grup arisan baru</h3>
              <p>
                Grup baru otomatis memiliki ID Grup 5 digit. Bagikan ID
                tersebut ke peserta lain agar mereka bisa ikut arisan dari akun
                Nanad Invest masing-masing.
              </p>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nama grup arisan
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="contoh: Arisan Ramah 2025"
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Iuran per putaran (Rp)
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newMonthly}
                    onChange={(e) => setNewMonthly(e.target.value)}
                    placeholder="contoh: 100000"
                    style={{
                      width: "100%",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.4rem 0.8rem",
                      color: "white",
                      fontSize: "0.8rem",
                    }}
                  />
                </label>
                <label>
                  Total putaran
                  <input
                    type="number"
                    min="1"
                    value={newRounds}
                    onChange={(e) => setNewRounds(e.target.value)}
                    placeholder="contoh: 12"
                    style={{
                      width: "100%",
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.4rem 0.8rem",
                      color: "white",
                      fontSize: "0.8rem",
                    }}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Tanggal mulai arisan (opsional)
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={creating}
              >
                {creating ? "Memproses..." : "Buat grup arisan"}
              </button>
            </form>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan &amp; saving
            circle.
          </span>
          <span>
            Sistem ini mencatat iuran dan saldo secara internal. Aturan rinci
            arisan (jadwal penerima, denda, dsb.) tetap perlu disepakati antara
            peserta di luar sistem.
          </span>
        </footer>
      </div>
    </main>
  );
}
