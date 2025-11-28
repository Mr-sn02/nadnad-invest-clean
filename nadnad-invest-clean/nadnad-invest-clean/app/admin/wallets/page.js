// app/admin/wallets/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Hanya email di daftar ini yang boleh akses halaman admin
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

export default function AdminWalletsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [editValues, setEditValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");

  // Ambil semua wallet
  const loadWallets = async () => {
    setErrorMsg("");
    const { data, error } = await supabase
      .from("wallets")
      .select("id, user_id, balance, currency, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error load wallets:", error.message);
      setErrorMsg("Gagal memuat daftar dompet.");
      return;
    }

    setWallets(data || []);
    const initialEdit = {};
    (data || []).forEach((w) => {
      initialEdit[w.id] = String(w.balance ?? 0);
    });
    setEditValues(initialEdit);
  };

  // Inisialisasi: cek admin + load wallet
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
          console.error("Error getUser:", error.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          // Bukan admin → balik ke dashboard
          router.push("/");
          return;
        }

        await loadWallets();
      } catch (err) {
        console.error("Admin wallets init error:", err);
        setErrorMsg("Gagal memuat halaman admin dompet.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Ubah nilai input saldo per wallet
  const handleChangeValue = (walletId, value) => {
    setEditValues((prev) => ({
      ...prev,
      [walletId]: value,
    }));
  };

  // Simpan perubahan saldo
  const handleSaveBalance = async (wallet) => {
    const rawValue = editValues[wallet.id];
    const newBalance = Number(rawValue);

    if (Number.isNaN(newBalance) || newBalance < 0) {
      alert("Nominal saldo harus berupa angka dan tidak boleh negatif.");
      return;
    }

    if (newBalance === wallet.balance) {
      alert("Saldo tidak berubah.");
      return;
    }

    const diff = newBalance - (wallet.balance ?? 0);

    try {
      setSavingId(wallet.id);

      // Update saldo di tabel wallets
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (updErr) {
        console.error("Update wallet error:", updErr.message);
        alert("Gagal menyimpan perubahan saldo.");
        return;
      }

      // Catat di wallet_transactions sebagai ADJUST
      const before = wallet.balance ?? 0;
      const after = newBalance;

      const noteAdjust =
        "Penyesuaian saldo manual oleh admin " +
        (diff > 0 ? "(+)" : "(-)") +
        formatCurrency(Math.abs(diff));

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ADJUST",
          amount: Math.abs(diff),
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: noteAdjust,
        });

      if (txErr) {
        console.error("Insert adjust tx error:", txErr.message);
        // Tidak perlu batal, saldo sudah terupdate, hanya riwayat yang gagal
      }

      // Update state lokal
      setWallets((prev) =>
        prev.map((w) =>
          w.id === wallet.id ? { ...w, balance: newBalance } : w
        )
      );

      alert("Saldo dompet berhasil diperbarui.");
    } catch (err) {
      console.error("Save balance error:", err);
      alert("Terjadi kesalahan saat menyimpan saldo.");
    } finally {
      setSavingId(null);
    }
  };

  // Filter berdasarkan search (id atau user_id)
  const filteredWallets = wallets.filter((w) => {
    if (!search.trim()) return true;
    const key = `${w.id} ${w.user_id}`.toLowerCase();
    return key.includes(search.toLowerCase());
  });

  // =================== RENDER ===================
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman admin dompet...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Admin · Edit saldo dompet
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/admin/transactions")}
            >
              Approval transaksi
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/")}
            >
              Kembali ke dashboard
            </button>
          </div>
        </header>

        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Admin wallets</p>
          <h1 className="nanad-dashboard-heading">
            Kelola saldo dompet semua member.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini khusus untuk admin. Setiap perubahan saldo akan
            dicatat sebagai transaksi <strong>ADJUST</strong> di{" "}
            <code>wallet_transactions</code> agar jejaknya tetap terdokumentasi.
          </p>
          <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
            Gunakan fitur ini dengan hati-hati. Pastikan setiap perubahan
            saldo sesuai dengan bukti transfer, mutasi rekening, atau
            kesepakatan dengan member.
          </p>
        </section>

        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar dompet</h3>
              <p>Maksimal 100 dompet terbaru.</p>
            </div>

            {errorMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.5rem" }}
              >
                {errorMsg}
              </p>
            )}

            <div
              style={{
                marginTop: "0.75rem",
                marginBottom: "0.75rem",
                maxWidth: "320px",
              }}
            >
              <label
                className="nanad-dashboard-deposit-amount"
                style={{ width: "100%" }}
              >
                Cari berdasarkan ID / user_id
                <input
                  type="text"
                  placeholder="ketik sebagian ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>

            {filteredWallets.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada dompet yang cocok dengan pencarian.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {filteredWallets.map((w) => (
                  <div key={w.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                        Wallet ID
                      </div>
                      <div style={{ fontSize: "0.8rem" }}>{w.id}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.7,
                          marginTop: "0.25rem",
                        }}
                      >
                        user_id: {w.user_id}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.6,
                          marginTop: "0.25rem",
                        }}
                      >
                        Dibuat:{" "}
                        {new Date(w.created_at).toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.85,
                          marginBottom: "0.25rem",
                        }}
                      >
                        Saldo sekarang
                      </div>
                      <div
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {formatCurrency(w.balance)}
                      </div>

                      <label
                        className="nanad-dashboard-deposit-amount"
                        style={{ width: "180px" }}
                      >
                        Set saldo baru
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={editValues[w.id] ?? ""}
                          onChange={(e) =>
                            handleChangeValue(w.id, e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        type="button"
                        disabled={savingId === w.id}
                        className="nanad-dashboard-deposit-submit"
                        onClick={() => handleSaveBalance(w)}
                      >
                        {savingId === w.id
                          ? "Menyimpan..."
                          : "Simpan saldo"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. All rights reserved.
          </span>
          <span>
            Pengelolaan saldo manual ini bersifat internal & administratif.
            Untuk pengelolaan dana nyata, tetap diperlukan prosedur dan
            infrastruktur yang sesuai regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
