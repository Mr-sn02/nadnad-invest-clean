// app/arisan/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

// format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// generate kode grup 5 digit angka
function generateGroupCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function ArisanHomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // form cari grup dari ID
  const [searchCode, setSearchCode] = useState("");

  // form buat grup baru
  const [groupName, setGroupName] = useState("");
  const [perRoundAmount, setPerRoundAmount] = useState("");
  const [totalRounds, setTotalRounds] = useState("");
  const [startDate, setStartDate] = useState("");
  const [creating, setCreating] = useState(false);

  // ===== LOAD USER & GRUP ARISAN =====
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

        // ambil semua grup yang diikuti user
        const { data, error: gErr } = await supabase
          .from("arisan_members")
          .select(
            `
            id,
            role,
            group:arisan_groups(
              id,
              group_code,
              name,
              per_round_amount,
              total_rounds,
              start_date,
              created_at
            )
          `
          )
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false });

        if (gErr) {
          console.error("load groups error:", gErr.message);
          setErrorMsg("Gagal memuat daftar arisan.");
        } else {
          const cleaned =
            data?.map((row) => ({
              memberId: row.id,
              role: row.role,
              ...row.group,
            })) || [];
          setGroups(cleaned);
        }
      } catch (err) {
        console.error("Arisan init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ===== CARI GRUP DARI KODE 5 DIGIT =====
  const handleSearchGroup = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    const code = searchCode.trim();

    try {
      const { data, error } = await supabase
        .from("arisan_groups")
        .select("id")
        .eq("group_code", code)
        .maybeSingle();

      if (error) {
        console.error("search group error:", error.message);
        alert("Gagal mencari grup arisan.");
        return;
      }

      if (!data) {
        alert("Grup dengan ID tersebut tidak ditemukan.");
        return;
      }

      router.push(`/arisan/${data.id}`);
    } catch (err) {
      console.error("search group error:", err);
      alert("Terjadi kesalahan saat mencari grup.");
    }
  };

  // ===== BUAT GRUP ARISAN BARU =====
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!groupName.trim()) {
      alert("Nama grup arisan wajib diisi.");
      return;
    }

    const amount = Number(perRoundAmount);
    const rounds = Number(totalRounds);

    if (!amount || amount <= 0 || !rounds || rounds <= 0) {
      alert("Nominal iuran dan total putaran harus lebih besar dari 0.");
      return;
    }

    try {
      setCreating(true);
      setErrorMsg("");

      // cari kode unik 5 digit
      let finalCode = null;
      for (let i = 0; i < 10; i++) {
        const candidate = generateGroupCode();
        const { data: existing, error } = await supabase
          .from("arisan_groups")
          .select("id")
          .eq("group_code", candidate)
          .maybeSingle();

        if (error) {
          console.error("check code error:", error.message);
          continue;
        }
        if (!existing) {
          finalCode = candidate;
          break;
        }
      }

      if (!finalCode) {
        alert("Gagal menghasilkan ID grup unik. Coba lagi.");
        return;
      }

      // buat grup
      const { data: newGroup, error: gErr } = await supabase
        .from("arisan_groups")
        .insert({
          group_code: finalCode,
          name: groupName.trim(),
          per_round_amount: amount,
          total_rounds: rounds,
          start_date: startDate || null,
          created_by_user_id: user.id,
          created_by_email: user.email,
        })
        .select("*")
        .single();

      if (gErr) {
        console.error("create group error:", gErr.message);
        alert("Gagal membuat grup arisan.");
        return;
      }

      // catat owner sebagai member
      const { data: ownerMember, error: mErr } = await supabase
        .from("arisan_members")
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
          user_email: user.email,
          role: "OWNER",
        })
        .select("*")
        .single();

      if (mErr) {
        console.error("create member error:", mErr.message);
        alert(
          "Grup berhasil dibuat, tetapi gagal mencatat keanggotaan owner. Hubungi admin."
        );
        // masih lanjut, karena grup sudah ada
      }

      // pre-generate putaran
      const roundsPayload = [];
      const baseDate = startDate ? new Date(startDate) : null;

      for (let i = 1; i <= rounds; i++) {
        let date = null;
        if (baseDate) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + (i - 1) * 30); // 30 hari per putaran (simulasi)
          date = d.toISOString().split("T")[0];
        }
        roundsPayload.push({
          group_id: newGroup.id,
          round_number: i,
          scheduled_date: date,
        });
      }

      if (roundsPayload.length > 0) {
        const { error: rErr } = await supabase
          .from("arisan_rounds")
          .insert(roundsPayload);

        if (rErr) {
          console.error("create rounds error:", rErr.message);
        }
      }

      alert(
        `Grup arisan berhasil dibuat.\nNama: ${newGroup.name}\nID Grup: ${newGroup.group_code}`
      );

      router.push(`/arisan/${newGroup.id}`);
    } catch (err) {
      console.error("create group unexpected error:", err);
      alert("Terjadi kesalahan saat membuat grup arisan.");
    } finally {
      setCreating(false);
    }
  };

  // ===== RENDER =====
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
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Arisan module · Simulasi kelompok
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

        {/* Intro + cari grup */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Arisan Nanad</p>
          <h1 className="nanad-dashboard-heading">
            Kelola arisan bersama pelanggan atau kawan dekatmu.
          </h1>
          <p className="nanad-dashboard-body">
            Setiap grup arisan punya ID grup 5 digit angka. Peserta bisa masuk
            lewat ID tersebut, kemudian menyetor iuran dari saldo dompet
            Nanad Invest mereka. Pemenang putaran akan menerima saldo otomatis.
          </p>

          <form
            onSubmit={handleSearchGroup}
            style={{
              marginTop: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.7rem",
            }}
          >
            <input
              type="text"
              placeholder="Masukkan ID Grup (5 digit, contoh 34821)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              maxLength={5}
              className="nanad-dashboard-deposit-amount-input"
              style={{
                flex: "1 1 220px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.7)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                color: "white",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="nanad-dashboard-deposit-submit"
              style={{ flexShrink: 0 }}
            >
              Cari grup dari ID
            </button>
          </form>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.6rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* Dua kolom: daftar grup & form create */}
        <section className="nanad-dashboard-table-section">
          {/* Grup kamu */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Arisan kamu</h3>
              <p>Semua grup arisan yang kamu ikuti atau kamu kelola.</p>
            </div>

            {groups.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum tergabung di grup arisan mana pun. Kamu bisa membuat
                grup arisan baru di sebelah kanan, atau bergabung dengan
                memasukkan ID grup.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {groups.map((g) => (
                  <div key={g.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Dibuat{" "}
                      {g.created_at
                        ? new Date(g.created_at).toLocaleDateString("id-ID")
                        : "-"}
                      <br />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#9ca3af",
                        }}
                      >
                        ID Grup: {g.group_code} ·{" "}
                        {g.role === "OWNER" ? "Owner" : "Anggota"}
                      </span>
                    </div>
                    <div>
                      <strong>{g.name}</strong>
                      <br />
                      Iuran: {formatCurrency(g.per_round_amount)} · Putaran:{" "}
                      {g.total_rounds}
                      {g.start_date && (
                        <>
                          <br />
                          Mulai:{" "}
                          {new Date(g.start_date).toLocaleDateString("id-ID")}
                        </>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="nanad-dashboard-deposit-submit"
                        onClick={() => router.push(`/arisan/${g.id}`)}
                      >
                        Buka grup
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buat grup baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Buat grup arisan baru</h3>
              <p>
                Grup baru otomatis punya ID grup 5 digit. Bagikan ID tersebut
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
                  placeholder="contoh: Arisan bulanan Nanad"
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
                    step="1000"
                    placeholder="contoh: 100000"
                    value={perRoundAmount}
                    onChange={(e) => setPerRoundAmount(e.target.value)}
                  />
                </label>
                <label>
                  Total putaran
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="contoh: 10"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Tanggal mulai (opsional)
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={creating}
                className="nanad-dashboard-deposit-submit"
              >
                {creating ? "Membuat grup..." : "Membuat grup..."}
              </button>
            </form>

            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.75rem", marginTop: "0.75rem" }}
            >
              Fitur arisan ini bersifat pencatatan & simulasi. Pengelolaan dana
              nyata tetap mengikuti kesepakatan & regulasi di luar aplikasi.
            </p>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan tidak menggantikan perjanjian tertulis antar peserta.
            Selalu pastikan komunikasi dan kesepakatan yang jelas di luar
            aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
