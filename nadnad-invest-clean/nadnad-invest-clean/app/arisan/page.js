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

export default function ArisanListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // form grup baru
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [totalRounds, setTotalRounds] = useState("4");
  const [startDate, setStartDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadGroups = async () => {
    setErrorMsg("");
    const { data, error } = await supabase
      .from("arisan_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load groups error:", error.message);
      setErrorMsg("Gagal memuat daftar arisan.");
      return;
    }

    setGroups(data || []);
  };

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

        await loadGroups();
      } catch (err) {
        console.error("Arisan init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      alert("Nama arisan wajib diisi.");
      return;
    }
    const amt = Number(monthlyAmount);
    if (!amt || amt <= 0) {
      alert("Nominal iuran per putaran wajib lebih dari 0.");
      return;
    }
    const rounds = Number(totalRounds);
    if (!rounds || rounds <= 0) {
      alert("Jumlah putaran minimal 1.");
      return;
    }
    if (!startDate) {
      alert("Tanggal mulai arisan wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from("arisan_groups").insert({
        name: name.trim(),
        description: desc.trim() || null,
        monthly_amount: amt,
        total_rounds: rounds,
        start_date: startDate,
        status: "PLANNING",
        created_by_user_id: user.id,
      });

      if (error) {
        console.error("Create group error:", error.message);
        alert("Gagal membuat grup arisan.");
        return;
      }

      setName("");
      setDesc("");
      setMonthlyAmount("");
      setTotalRounds("4");
      setStartDate("");

      await loadGroups();
    } catch (err) {
      console.error("Create group error:", err);
      alert("Terjadi kesalahan saat membuat grup arisan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman arisan Nanad Invest...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat fitur arisan.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/dashboard")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke dashboard
            </button>
          </section>
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
          </div>
        </header>

        {/* Intro */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Group Arisan</p>
          <h1 className="nanad-dashboard-heading">
            Kelola arisan terencana dengan dana dari dompet Nanad Invest.
          </h1>
          <p className="nanad-dashboard-body">
            Setiap grup arisan memiliki iuran per putaran, jadwal terencana, dan
            daftar anggota. Setoran iuran dapat dicatat sebagai pengurangan
            saldo dompet di akun Nanad Invest kamu (simulasi). Dana nyata tetap
            dikelola melalui rekening resmi di luar aplikasi ini.
          </p>
        </section>

        {/* Dua kolom: buat grup + daftar grup */}
        <section className="nanad-dashboard-table-section">
          {/* Buat grup baru */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Buat grup arisan baru</h3>
              <p>
                Cocok untuk arisan keluarga, teman kantor, komunitas belajar,
                atau arisan investasi kecil.
              </p>
            </div>

            <form
              onSubmit={handleCreateGroup}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nama arisan
                <input
                  type="text"
                  placeholder="contoh: Arisan Keluarga Bandung 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Deskripsi (opsional)
                <input
                  type="text"
                  placeholder="contoh: 10 orang, iuran bulanan, fokus dana darurat"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Iuran per putaran
                  <input
                    type="number"
                    min="0"
                    step="10000"
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
                    max="36"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Tanggal mulai arisan
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="nanad-dashboard-deposit-submit"
              >
                {saving ? "Menyimpan..." : "Buat grup arisan"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Catatan: fitur ini berfungsi sebagai{" "}
                <strong>pencatatan &amp; perencanaan arisan</strong>. Dana
                riil tetap berpindah melalui rekening atau media pembayaran
                yang disepakati di luar sistem.
              </p>
            </form>
          </div>

          {/* Daftar grup arisan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar grup arisan</h3>
              <p>
                Pilih salah satu untuk melihat jadwal putaran, anggota, dan
                setoran dari dompet.
              </p>
            </div>

            {groups.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada grup arisan. Buat satu di panel sebelah kiri.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {groups.map((g) => (
                  <div key={g.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <strong>{g.name}</strong>
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color:
                            g.status === "COMPLETED"
                              ? "#4ade80"
                              : g.status === "RUNNING"
                              ? "#facc15"
                              : "#e5e7eb",
                        }}
                      >
                        {g.status}
                      </span>
                      <br />
                      <small>
                        Mulai:{" "}
                        {new Date(g.start_date).toLocaleDateString("id-ID")}
                      </small>
                    </div>
                    <div>
                      Iuran per putaran:{" "}
                      <strong>{formatCurrency(g.monthly_amount)}</strong>
                      <br />
                      Total putaran: <strong>{g.total_rounds}</strong>
                      {g.description && (
                        <p
                          className="nanad-dashboard-body"
                          style={{
                            marginTop: "0.3rem",
                            fontSize: "0.78rem",
                            color: "#e5e7eb",
                          }}
                        >
                          {g.description}
                        </p>
                      )}
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
                        className="nanad-dashboard-logout"
                      >
                        Lihat detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan planning module.
          </span>
          <span>
            Fitur arisan ini bersifat simulasi &amp; pencatatan. Pastikan segala
            transaksi dana nyata mengikuti kesepakatan dan regulasi yang
            berlaku.
          </span>
        </footer>
      </div>
    </main>
  );
}
