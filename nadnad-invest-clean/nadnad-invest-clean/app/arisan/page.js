// app/arisan/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient"; // ✅ pastikan nama & path sesuai

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Format tanggal singkat
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Generate kode grup 5 digit (string)
function generateGroupCode() {
  const n = Math.floor(Math.random() * 100000); // 0–99999
  return n.toString().padStart(5, "0");
}

export default function ArisanPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // daftar grup arisan milik user
  const [myGroups, setMyGroups] = useState([]);

  // cari grup dari ID
  const [searchCode, setSearchCode] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // form buat grup
  const [newName, setNewName] = useState("");
  const [newMonthly, setNewMonthly] = useState("");
  const [newRounds, setNewRounds] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // ================= INIT: cek login & load grup =================
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

        await loadMyGroups(user.id);
      } catch (err) {
        console.error("Arisan init error:", err);
        setErrorMsg("Gagal memuat halaman arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ================= LOAD GROUPS MILIK USER =================
  const loadMyGroups = async (userId) => {
    try {
      // 1) ambil membership user
      const { data: memberships, error: memErr } = await supabase
        .from("arisan_memberships")
        .select("id, group_id, role")
        .eq("user_id", userId);

      if (memErr) {
        console.error("Load memberships error:", memErr.message);
        setErrorMsg("Gagal memuat daftar arisan kamu.");
        return;
      }

      if (!memberships || memberships.length === 0) {
        setMyGroups([]);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);

      // 2) ambil data grup
      const { data: groups, error: grpErr } = await supabase
        .from("arisan_groups")
        .select("*")
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      if (grpErr) {
        console.error("Load groups error:", grpErr.message);
        setErrorMsg("Gagal memuat data grup arisan.");
        return;
      }

      const combined = groups.map((g) => {
        const mem = memberships.find((m) => m.group_id === g.id);
        return {
          group: g,
          role: mem?.role || "MEMBER",
        };
      });

      setMyGroups(combined);
    } catch (err) {
      console.error("Unexpected loadMyGroups error:", err);
      setErrorMsg("Terjadi kesalahan saat memuat arisan kamu.");
    }
  };

  // ================== CARI & JOIN GRUP DARI ID ==================
  const handleSearchAndJoin = async (e) => {
    e.preventDefault();
    if (!user) return;

    const code = (searchCode || "").trim();
    if (!/^\d{5}$/.test(code)) {
      alert("ID Grup harus 5 digit angka.");
      return;
    }

    try {
      setSearchLoading(true);
      setErrorMsg("");

      // cari grup sesuai group_code
      const { data: group, error: grpErr } = await supabase
        .from("arisan_groups")
        .select("*")
        .eq("group_code", code)
        .maybeSingle();

      if (grpErr) {
        console.error("Search group error:", grpErr.message);
        alert("Gagal mencari grup arisan.");
        return;
      }

      if (!group) {
        alert("Grup dengan ID tersebut tidak ditemukan.");
        return;
      }

      // cek apakah user sudah jadi member
      const { data: existing, error: memErr } = await supabase
        .from("arisan_memberships")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memErr) {
        console.error("Check member error:", memErr.message);
        alert("Gagal memeriksa keikutsertaan grup.");
        return;
      }

      if (!existing) {
        const { error: joinErr } = await supabase
          .from("arisan_memberships")
          .insert({
            group_id: group.id,
            user_id: user.id,
            role: "MEMBER",
          });

        if (joinErr) {
          console.error("Join group error:", joinErr.message);
          alert("Gagal bergabung ke grup arisan.");
          return;
        }
      }

      await loadMyGroups(user.id);

      // lanjut ke halaman detail arisan /arisan/[id] (id = group_code)
      router.push(`/arisan/${group.group_code}`);
    } catch (err) {
      console.error("Search & join error:", err);
      alert("Terjadi kesalahan saat mencoba bergabung ke grup.");
    } finally {
      setSearchLoading(false);
    }
  };

  // ================== BUAT GRUP BARU ==================
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!newName.trim()) {
      alert("Nama grup arisan wajib diisi.");
      return;
    }

    const monthly = Number(newMonthly);
    const rounds = Number(newRounds);

    if (!monthly || monthly <= 0) {
      alert("Iuran per putaran harus lebih besar dari 0.");
      return;
    }

    if (!rounds || rounds <= 0) {
      alert("Total putaran harus lebih besar dari 0.");
      return;
    }

    try {
      setCreatingGroup(true);
      setErrorMsg("");

      // generate kode unik
      let finalCode = "";
      for (let i = 0; i < 5; i++) {
        const candidate = generateGroupCode();
        const { data: exists, error: codeErr } = await supabase
          .from("arisan_groups")
          .select("id")
          .eq("group_code", candidate)
          .maybeSingle();

        if (codeErr) {
          console.error("Check code error:", codeErr.message);
          continue;
        }

        if (!exists) {
          finalCode = candidate;
          break;
        }
      }

      if (!finalCode) {
        alert("Gagal membuat ID Grup unik. Coba lagi.");
        return;
      }

      // insert grup baru (⚠️ penting: owner_user_id + created_by_user_id)
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
          created_by_user_id: user.id, // kolom NOT NULL di DB
          status: "ACTIVE",
        })
        .select("*")
        .single();

      if (createErr) {
        console.error("Create group error:", createErr.message);
        setErrorMsg(
          `Gagal membuat grup arisan: ${createErr.message || "unknown error"}`
        );
        return;
      }

      // owner otomatis jadi member
      const { error: memErr } = await supabase
        .from("arisan_memberships")
        .insert({
          group_id: created.id,
          user_id: user.id,
          role: "OWNER",
        });

      if (memErr) {
        console.error("Insert owner membership error:", memErr.message);
        alert(
          "Grup berhasil dibuat, tetapi gagal mencatat keanggotaan owner. Hubungi admin."
        );
      }

      setNewName("");
      setNewMonthly("");
      setNewRounds("");
      setNewStartDate("");

      await loadMyGroups(user.id);

      alert(
        `Grup arisan berhasil dibuat!\nNama: ${created.name}\nID Grup: ${created.group_code}\nSilakan bagikan ID Grup ini ke peserta lain.`
      );

      router.push(`/arisan/${created.group_code}`);
    } catch (err) {
      console.error("Create group unexpected error:", err);
      setErrorMsg("Terjadi kesalahan saat membuat grup arisan.");
    } finally {
      setCreatingGroup(false);
    }
  };

  // ================= RENDER =================
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat halaman arisan...</p>
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
                Arisan bersama · terencana &amp; terdokumentasi
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Kembali ke dashboard
            </button>
          </div>
        </header>

        {/* Intro + cari grup dari ID */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Arisan Nanad</p>
          <h1 className="nanad-dashboard-heading">
            Kelola arisan bersama dari dalam akun Nanad Invest.
          </h1>
          <p className="nanad-dashboard-body">
            Kamu bisa membuat grup arisan sendiri, menentukan iuran per
            putaran, jumlah putaran, dan tanggal mulai. Setiap grup punya ID
            unik 5 digit yang bisa dibagikan ke peserta lain agar mereka dapat
            bergabung dari akun Nanad Invest masing-masing.
          </p>

          <div
            className="nanad-dashboard-deposits"
            style={{ marginTop: "1rem" }}
          >
            <div className="nanad-dashboard-deposits-header">
              <h3>Cari &amp; gabung ke grup dari ID</h3>
              <p>
                Setiap grup arisan memiliki ID Grup berupa 5 digit angka. 
                Bagikan kode ini ke kawan atau pelanggan kamu. Mereka cukup
                masuk ke halaman arisan, masukkan ID Grup, lalu bergabung dari
                akun masing-masing.
              </p>
            </div>

            <form
              onSubmit={handleSearchAndJoin}
              style={{
                marginTop: "0.75rem",
                display: "flex",
                gap: "0.6rem",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Masukkan ID Grup (5 digit, contoh 34821)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ""))}
                style={{
                  flex: "1 1 220px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.7)",
                  background:
                    "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8rem",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />

              <button
                type="submit"
                disabled={searchLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {searchLoading ? "Mencari..." : "Cari grup dari ID"}
              </button>
            </form>
          </div>
        </section>

        {/* 2 kolom: Arisan kamu & Buat grup baru */}
        <section className="nanad-dashboard-table-section">
          {/* Arisan kamu */}
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
                style={{ marginTop: "0.5rem", color: "#fecaca" }}
              >
                {errorMsg}
              </p>
            )}

            {myGroups.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum tergabung di grup arisan mana pun. Kamu bisa membuat
                grup arisan baru di sebelah kanan, atau bergabung dengan
                memasukkan ID grup di atas.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {myGroups.map(({ group, role }) => (
                  <div key={group.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Dibuat {formatDate(group.created_at)}
                      <br />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.11em",
                          color: "#e5e7eb",
                        }}
                      >
                        ID Grup: {group.group_code}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.11em",
                          color: "#facc15",
                        }}
                      >
                        {role === "OWNER"
                          ? "Kamu sebagai pemilik"
                          : "Kamu sebagai peserta"}
                      </span>
                    </div>

                    <div>
                      <strong>{group.name}</strong>
                      <br />
                      Iuran: {formatCurrency(group.monthly_amount)} · Putaran:{" "}
                      {group.total_rounds}
                      {group.start_date && (
                        <>
                          <br />
                          Mulai: {formatDate(group.start_date)}
                        </>
                      )}
                      {group.status && (
                        <>
                          <br />
                          <span
                            style={{
                              fontSize: "0.72rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.09em",
                              color:
                                group.status === "ACTIVE"
                                  ? "#4ade80"
                                  : "#e5e7eb",
                            }}
                          >
                            STATUS: {group.status}
                          </span>
                        </>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        className="nanad-dashboard-deposit-submit"
                        onClick={() =>
                          router.push(`/arisan/${group.group_code}`)
                        }
                      >
                        Buka grup
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buat grup arisan baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Buat grup arisan baru</h3>
              <p>
                Grup baru otomatis memiliki ID Grup 5 digit. Bagikan ID tersebut 
                ke peserta lain agar mereka bisa ikut arisan dari akun Nanad
                Invest masing-masing.
              </p>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="nanad-dashboard-deposit-form"
              style={{ marginTop: "0.9rem" }}
            >
              <label className="nanad-dashboard-deposit-amount">
                Nama grup arisan
                <input
                  type="text"
                  placeholder="contoh: Arisan Test 2025"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Iuran per putaran (Rp)
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="contoh: 100000"
                    value={newMonthly}
                    onChange={(e) => setNewMonthly(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.8rem",
                      color: "#e5e7eb",
                      outline: "none",
                    }}
                  />
                </label>

                <label>
                  Total putaran
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="contoh: 10"
                    value={newRounds}
                    onChange={(e) => setNewRounds(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.8rem",
                      color: "#e5e7eb",
                      outline: "none",
                    }}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Tanggal mulai (opsional)
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={creatingGroup}
                className="nanad-dashboard-deposit-submit"
              >
                {creatingGroup ? "Membuat grup..." : "Buat grup arisan"}
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan ini bersifat pencatatan &amp; simulasi. 
            Pengelolaan dana nyata tetap mengikuti kesepakatan dan regulasi
            yang berlaku di luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
