// app/arisan/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Format tanggal
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Generate ID 5 digit
function generateGroupCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function ArisanPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [memberships, setMemberships] = useState([]);

  // cari grup via ID
  const [searchCode, setSearchCode] = useState("");

  // form buat grup
  const [groupName, setGroupName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [totalRounds, setTotalRounds] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rulesNote, setRulesNote] = useState("");
  const [creating, setCreating] = useState(false);

  // ====== INIT: cek user + load arisan user ======
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

        // Ambil semua membership + grupnya
        const { data, error: mErr } = await supabase
          .from("arisan_memberships")
          .select(
            `
            id,
            role,
            group_id,
            created_at,
            group:arisan_groups (
              id,
              name,
              group_code,
              monthly_amount,
              total_rounds,
              start_date,
              is_archived,
              created_at
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (mErr) {
          console.error("Load arisan memberships error:", mErr.message);
          setErrorMsg("Gagal memuat daftar arisan kamu.");
        } else {
          setMemberships(data || []);
        }
      } catch (err) {
        console.error("Arisan page error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ====== HANDLE: CARI GRUP DARI ID ======
  const handleSearchGroup = () => {
    if (!searchCode || searchCode.length !== 5) {
      alert("Masukkan ID Grup 5 digit (contoh: 34821).");
      return;
    }
    router.push(`/arisan/${searchCode}`);
  };

  // ====== HANDLE: BUAT GRUP BARU ======
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    const amount = Number(monthlyAmount);
    const rounds = Number(totalRounds);

    if (!groupName.trim() || !amount || amount <= 0 || !rounds || rounds <= 0) {
      alert("Nama grup, iuran per putaran, dan total putaran wajib diisi.");
      return;
    }

    try {
      setCreating(true);
      setErrorMsg("");

      // 1) generate kode unik 5 digit
      let code = null;
      for (let i = 0; i < 10; i++) {
        const candidate = generateGroupCode();
        const { data: existing, error: checkErr } = await supabase
          .from("arisan_groups")
          .select("id")
          .eq("group_code", candidate)
          .maybeSingle();

        if (checkErr) {
          console.error("Check code error:", checkErr.message);
        }

        if (!existing) {
          code = candidate;
          break;
        }
      }

      if (!code) {
        alert("Gagal menghasilkan ID Grup unik. Coba lagi.");
        return;
      }

      // 2) buat grup
      const { data: group, error: gErr } = await supabase
        .from("arisan_groups")
        .insert({
          name: groupName.trim(),
          group_code: code,
          monthly_amount: amount,
          total_rounds: rounds,
          start_date: startDate || null,
          rules_note: rulesNote || null,
          created_by_user_id: user.id,
        })
        .select("*")
        .single();

      if (gErr) {
        console.error("Create group error:", gErr.message);
        alert("Gagal membuat grup arisan baru.");
        return;
      }

      // 3) catat membership owner
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split("@")[0] : "Owner");

      const { error: memErr } = await supabase.from("arisan_memberships").insert({
        group_id: group.id,
        user_id: user.id,
        role: "OWNER",
        user_email: user.email,
        display_name: displayName,
      });

      if (memErr) {
        console.error("Owner membership error:", memErr.message);
        alert(
          "Grup berhasil dibuat, tetapi gagal mencatat keanggotaan owner. Hubungi admin jika masalah berlanjut."
        );
      }

      alert(
        `Grup arisan berhasil dibuat dengan ID Grup ${code}. Bagikan ID ini ke peserta lain.`
      );

      router.push(`/arisan/${group.group_code}`);
    } catch (err) {
      console.error("Create group error:", err);
      alert("Terjadi kesalahan saat membuat grup arisan.");
    } finally {
      setCreating(false);
    }
  };

  // ====== RENDER ======

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat modul arisan...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Modul Arisan · pencatatan &amp; simulasi
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/dashboard")}
          >
            Kembali ke dashboard
          </button>
        </header>

        {/* INTRO + CARI GRUP */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Arisan bersama</p>
          <h1 className="nanad-dashboard-heading">
            Kelola arisan dengan sesama pengguna Nanad Invest.
          </h1>
          <p className="nanad-dashboard-body">
            Buat grup arisan, atur jadwal putaran, pilih penerima, dan catat
            setoran tiap peserta. Fitur ini bersifat{" "}
            <strong>pencatatan &amp; simulasi</strong> — dana nyata tetap
            dikelola di luar aplikasi sesuai kesepakatan dan regulasi.
          </p>

          <div
            className="nanad-dashboard-deposit-row"
            style={{ marginTop: "0.9rem" }}
          >
            <label>
              Masukkan ID Grup (5 digit, contoh 34821)
              <input
                type="text"
                maxLength={5}
                value={searchCode}
                onChange={(e) =>
                  setSearchCode(e.target.value.replace(/\D/g, ""))
                }
                className="nanad-dashboard-deposit-amount-input"
                style={{
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.7)",
                  background:
                    "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.82rem",
                  color: "#e5e7eb",
                  outline: "none",
                }}
              />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="button"
                className="nanad-dashboard-deposit-submit"
                onClick={handleSearchGroup}
              >
                Cari grup dari ID
              </button>
            </div>
          </div>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.4rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* LIST GRUP & FORM BUAT BARU */}
        <section className="nanad-dashboard-table-section">
          {/* Kiri: grup milik / diikuti */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Arisan kamu</h3>
              <p>
                Semua grup arisan yang kamu ikuti atau kamu kelola. Pilih salah
                satu untuk melihat jadwal, penerima, dan status iuran.
              </p>
            </div>

            {memberships.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum bergabung di grup arisan mana pun. Kamu bisa membuat
                grup arisan baru di sebelah kanan, atau bergabung dengan
                memasukkan ID grup di atas.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {memberships.map((m) => (
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Dibuat {formatDate(m.group?.created_at)}
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            m.role === "OWNER"
                              ? "#facc15"
                              : "rgba(148,163,184,0.9)",
                        }}
                      >
                        {m.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <div>
                      <strong>{m.group?.name}</strong>
                      <br />
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                        ID Grup {m.group?.group_code} · Iuran{" "}
                        {formatCurrency(m.group?.monthly_amount)} · Putaran:{" "}
                        {m.group?.total_rounds}
                        {m.group?.is_archived && (
                          <>
                            {" "}
                            ·{" "}
                            <span style={{ color: "#f97316" }}>Diarsipkan</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="nanad-dashboard-deposit-submit"
                        onClick={() =>
                          router.push(`/arisan/${m.group?.group_code}`)
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

          {/* Kanan: buat grup baru */}
          <div className="nanad-dashboard-deposits">
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
              style={{ marginTop: "0.75rem" }}
            >
              <label className="nanad-dashboard-deposit-amount">
                Nama grup arisan
                <input
                  type="text"
                  placeholder="contoh: Arisan RT 05 / Arisan bulanan kantor"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Iuran per putaran (Rp)
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="contoh: 100000"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.82rem",
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
                    max="120"
                    placeholder="contoh: 10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid rgba(148,163,184,0.7)",
                      background:
                        "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.82rem",
                      color: "#e5e7eb",
                      outline: "none",
                    }}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Tanggal mulai (opsional, untuk jadwal putaran)
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan aturan / perjanjian grup (opsional)
                <textarea
                  rows={4}
                  placeholder="contoh: Jadwal setoran setiap tanggal 5. Denda telat 10% dari iuran. Pencairan ditransfer ke rekening penerima yang disepakati."
                  value={rulesNote}
                  onChange={(e) => setRulesNote(e.target.value)}
                  style={{
                    resize: "vertical",
                    borderRadius: "1rem",
                    border: "1px solid rgba(148,163,184,0.7)",
                    background:
                      "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                    padding: "0.6rem 0.85rem",
                    fontSize: "0.8rem",
                    color: "#e5e7eb",
                    outline: "none",
                  }}
                />
              </label>

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={creating}
              >
                {creating ? "Memproses..." : "Membuat grup..."}
              </button>
            </form>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan ini hanya sebagai alat bantu pencatatan &amp; simulasi.
            Pengelolaan dana nyata tetap mengikuti kesepakatan dan regulasi
            yang berlaku di luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
