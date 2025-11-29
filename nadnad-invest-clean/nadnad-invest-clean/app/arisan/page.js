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

// 5 digit angka acak (10000–99999)
function generateGroupCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

export default function ArisanListPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [groups, setGroups] = useState([]);

  // Form buat grup baru
  const [name, setName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [totalRounds, setTotalRounds] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Form join via Kode Grup
  const [searchCode, setSearchCode] = useState("");
  const [searchMsg, setSearchMsg] = useState("");
  const [searching, setSearching] = useState(false);

  // --------- LOAD DATA AWAL (USER + GRUP YANG DIA IKUTI) ---------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // cek login
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

        await loadGroups(user.id);
      } catch (err) {
        console.error("Arisan list init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat daftar arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const loadGroups = async (userId) => {
    setErrorMsg("");

    // Grup yang diikuti (via arisan_members)
    const { data: membership, error: memErr } = await supabase
      .from("arisan_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memErr) {
      console.error("Load membership error:", memErr.message);
      setErrorMsg("Gagal memuat keikutsertaan arisan.");
      return;
    }

    const memberGroupIds = (membership || []).map((m) => m.group_id);

    // Grup yang dimiliki (owner_user_id)
    const { data: owned, error: ownErr } = await supabase
      .from("arisan_groups")
      .select("*")
      .eq("owner_user_id", userId);

    if (ownErr) {
      console.error("Load owned groups error:", ownErr.message);
      setErrorMsg("Gagal memuat data arisan yang kamu kelola.");
      return;
    }

    const ownedIds = (owned || []).map((g) => g.id);

    const allIds = Array.from(new Set([...memberGroupIds, ...ownedIds]));

    if (allIds.length === 0) {
      setGroups([]);
      return;
    }

    const { data: groupsData, error: gErr } = await supabase
      .from("arisan_groups")
      .select("*")
      .in("id", allIds)
      .order("created_at", { ascending: true });

    if (gErr) {
      console.error("Load groups error:", gErr.message);
      setErrorMsg("Gagal memuat daftar grup arisan.");
      return;
    }

    setGroups(groupsData || []);
  };

  // --------- BUAT GRUP ARISAN BARU (DENGAN KODE 5 DIGIT) ---------

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg("");

    if (!name.trim() || !monthlyAmount || !totalRounds || !startDate) {
      setErrorMsg("Nama, nominal iuran, jumlah putaran, dan tanggal mulai wajib diisi.");
      return;
    }

    const amount = Number(monthlyAmount);
    const rounds = Number(totalRounds);

    if (!amount || amount <= 0) {
      setErrorMsg("Nominal iuran per putaran harus lebih besar dari 0.");
      return;
    }
    if (!rounds || rounds <= 0) {
      setErrorMsg("Jumlah putaran harus lebih besar dari 0.");
      return;
    }

    try {
      setCreating(true);

      // generate kode unik max 5 percobaan (kemungkinan tabrakan sangat kecil)
      let finalCode = null;

      for (let i = 0; i < 5; i++) {
        const candidate = generateGroupCode();
        const { data: existing, error: checkErr } = await supabase
          .from("arisan_groups")
          .select("id")
          .eq("group_code", candidate)
          .maybeSingle();

        if (checkErr) {
          console.error("Check group_code error:", checkErr.message);
        }

        if (!existing) {
          finalCode = candidate;
          break;
        }
      }

      if (!finalCode) {
        setErrorMsg(
          "Gagal membuat kode grup unik. Coba simpan lagi beberapa saat lagi."
        );
        return;
      }

      // insert grup arisan
      const { data: grp, error: gErr } = await supabase
        .from("arisan_groups")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          monthly_amount: amount,
          total_rounds: rounds,
          start_date: startDate,
          status: "ACTIVE",
          owner_user_id: user.id,
          group_code: finalCode,
        })
        .select("*")
        .single();

      if (gErr) {
        console.error("Create group error:", gErr);
        setErrorMsg(
          "Gagal membuat grup arisan: " +
            (gErr.message || "cek struktur tabel arisan_groups di Supabase.")
        );
        return;
      }

      // otomatis tambahkan pembuat sebagai anggota urutan ke-1
      const { error: mErr } = await supabase.from("arisan_members").insert({
        group_id: grp.id,
        user_id: user.id,
        nickname: null,
        position: 1,
        status: "ACTIVE",
      });

      if (mErr) {
        console.error("Insert member (owner) error:", mErr);
        alert(
          "Grup berhasil dibuat, tetapi gagal menambahkan kamu sebagai anggota. Tambah manual dari Supabase kalau perlu."
        );
      }

      // reset form
      setName("");
      setMonthlyAmount("");
      setTotalRounds("");
      setStartDate("");
      setDescription("");

      // reload
      await loadGroups(user.id);

      alert(
        `Grup arisan baru berhasil dibuat.\nID Grup (kode arisan) kamu: ${finalCode}\nBagikan 5 digit ini ke teman/pelanggan untuk ikut arisan.`
      );
    } catch (err) {
      console.error("Create group unexpected error:", err);
      setErrorMsg(
        "Terjadi kesalahan saat membuat grup arisan: " +
          (err.message || "error tak dikenal.")
      );
    } finally {
      setCreating(false);
    }
  };

  // --------- CARI GRUP DARI KODE 5 DIGIT ---------

  const handleSearchByCode = async (e) => {
    e.preventDefault();
    setSearchMsg("");

    const code = searchCode.trim();

    if (!/^\d{5}$/.test(code)) {
      setSearchMsg("Masukkan 5 digit angka (contoh: 12345).");
      return;
    }

    try {
      setSearching(true);

      const { data: grp, error } = await supabase
        .from("arisan_groups")
        .select("id, name, group_code, status")
        .eq("group_code", code)
        .maybeSingle();

      if (error) {
        console.error("Search group by code error:", error.message);
        setSearchMsg(
          "Terjadi kesalahan saat mencari grup. Coba lagi beberapa saat."
        );
        return;
      }

      if (!grp) {
        setSearchMsg("Grup dengan ID tersebut tidak ditemukan.");
        return;
      }

      // kalau ketemu → langsung ke halaman detail grup
      router.push(`/arisan/${grp.id}`);
    } catch (err) {
      console.error("Search group code unexpected error:", err);
      setSearchMsg(
        "Terjadi kesalahan saat mencari grup: " +
          (err.message || "error tak dikenal.")
      );
    } finally {
      setSearching(false);
    }
  };

  // ----------------- RENDER -----------------

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat daftar arisan...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
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
                Arisan · Grup &amp; kode undangan
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

        {/* Intro & search by code */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Arisan space</p>
          <h1 className="nanad-dashboard-heading">
            Arisan bersama teman &amp; pelanggan dengan kode 5 digit.
          </h1>
          <p className="nanad-dashboard-body">
            Setiap grup arisan memiliki <strong>ID Grup</strong> berupa 5 digit angka.
            Bagikan kode ini ke kawan atau pelanggan kamu. Mereka cukup masuk ke
            halaman arisan, masukkan ID Grup, lalu bergabung dari akun masing-masing.
          </p>

          {/* Form cari grup dari kode */}
          <form
            onSubmit={handleSearchByCode}
            style={{
              marginTop: "0.9rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              maxLength={5}
              placeholder="Masukkan ID Grup (5 digit, contoh: 12345)"
              value={searchCode}
              onChange={(e) => {
                // hanya angka
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                setSearchCode(v);
              }}
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.7)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.04), rgba(15,23,42,1))",
                padding: "0.45rem 0.9rem",
                fontSize: "0.8rem",
                color: "#e5e7eb",
                outline: "none",
                minWidth: "220px",
              }}
            />
            <button
              type="submit"
              disabled={searching}
              className="nanad-dashboard-deposit-submit"
              style={{ fontSize: "0.76rem", padding: "0.4rem 1rem" }}
            >
              {searching ? "Mencari..." : "Cari grup dari ID"}
            </button>
            {searchMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.78rem", color: "#fecaca" }}
              >
                {searchMsg}
              </p>
            )}
          </form>
        </section>

        {/* Grid: daftar grup & form buat grup */}
        <section className="nanad-dashboard-table-section">
          {/* Daftar grup yang diikuti / dikelola */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Arisan kamu</h3>
              <p>
                Semua grup arisan yang kamu ikuti atau kamu kelola dari akun ini.
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

            {groups.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Kamu belum tergabung di grup arisan mana pun. Kamu bisa membuat grup
                arisan baru di sebelah kanan, atau bergabung dengan memasukkan ID
                grup di atas.
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
                      <small>
                        ID Grup:{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                            letterSpacing: "0.12em",
                            fontSize: "0.8rem",
                          }}
                        >
                          {g.group_code || "Belum ada"}
                        </span>
                      </small>
                    </div>
                    <div>
                      <strong>{g.name}</strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Iuran{" "}
                        <strong>
                          {formatCurrency(g.monthly_amount || 0)}
                        </strong>{" "}
                        · {g.total_rounds} putaran · Mulai{" "}
                        {g.start_date
                          ? new Date(g.start_date).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </span>
                      {g.description && (
                        <p
                          className="nanad-dashboard-body"
                          style={{ marginTop: "0.3rem", fontSize: "0.78rem" }}
                        >
                          {g.description}
                        </p>
                      )}
                      <p
                        className="nanad-dashboard-body"
                        style={{ marginTop: "0.2rem", fontSize: "0.76rem" }}
                      >
                        Status:{" "}
                        <strong style={{ textTransform: "uppercase" }}>
                          {g.status}
                        </strong>
                      </p>
                      <p
                        className="nanad-dashboard-body"
                        style={{ marginTop: "0.2rem", fontSize: "0.76rem" }}
                      >
                        Bagikan ID Grup ini ke kawan/pelanggan yang ingin ikut
                        arisan:{" "}
                        <span
                          style={{
                            fontFamily: "monospace",
                            letterSpacing: "0.12em",
                          }}
                        >
                          {g.group_code || "Belum ada"}
                        </span>
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Link
                        href={`/arisan/${g.id}`}
                        className="nanad-dashboard-deposit-submit"
                        style={{ fontSize: "0.78rem", padding: "0.45rem 1rem" }}
                      >
                        Buka detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form buat grup baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Buat grup arisan baru</h3>
              <p>
                Grup baru otomatis memiliki <strong>ID Grup 5 digit</strong>.
                Bagikan ID tersebut ke peserta lain agar mereka bisa ikut arisan
                dari akun Nanad Invest masing-masing.
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
                  placeholder="contoh: Arisan Pelanggan Premium Q1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Iuran per putaran
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="contoh: 500000"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                  />
                </label>
                <label>
                  Jumlah putaran
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
                Tanggal mulai putaran pertama
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Deskripsi (opsional)
                <input
                  type="text"
                  placeholder="contoh: Arisan khusus pelanggan aktif yang ingin menabung terjadwal."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={creating}
                className="nanad-dashboard-deposit-submit"
              >
                {creating ? "Membuat grup..." : "Buat grup arisan"}
              </button>
            </form>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module.
          </span>
          <span>
            ID Grup 5 digit memudahkan peserta untuk bergabung dari akun masing-masing.
            Pastikan aturan dan kesepakatan arisan dijelaskan dengan jelas di luar
            sistem ini.
          </span>
        </footer>
      </div>
    </main>
  );
}
