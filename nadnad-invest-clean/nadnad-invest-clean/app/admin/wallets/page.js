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

// 📌 SAMA dengan ADMIN_EMAILS di /admin/transactions/page.js
const ADMIN_EMAILS = ["sonnnn603@gmail.com"]; // ganti/ tambah kalau ada admin lain

export default function AdminWalletsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [editValues, setEditValues] = useState({}); // { [walletId]: "123000" }
  const [updatingId, setUpdatingId] = useState(null);

  // Ambil semua wallet
  const loadWallets = async () => {
    setErrorMsg("");

    const { data, error } = await supabase
      .from("wallets")
      .select("id, user_id, balance, currency, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error load wallets:", error.message);
      setErrorMsg("Gagal memuat daftar dompet. Cek policy RLS tabel wallets.");
      return;
    }

    setWallets(data || []);

    // isi default editValues = saldo sekarang
    const defaults = {};
    (data || []).forEach((w) => {
      defaults[w.id] = String(w.balance ?? 0);
    });
    setEditValues(defaults);
  };

  // Cek admin + load data
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
          // bukan admin -> balikin
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

  // Handler ubah nilai input saldo
  const handleChangeValue = (walletId, value) => {
    setEditValues((prev) => ({
      ...prev,
      [walletId]: value,
    }));
  };

  // Handler submit penyesuaian saldo
  const handleAdjustBalance = async (wallet) => {
    const raw = editValues[wallet.id];
    const newBalance = Number(raw);

    if (Number.isNaN(newBalance) || newBalance < 0) {
      alert("Saldo baru harus angka ≥ 0.");
      return;
    }

    const current = wallet.balance ?? 0;
    if (newBalance === current) {
      alert("Saldo baru sama dengan saldo sekarang. Tidak ada perubahan.");
      return;
    }

    const diff = newBalance - current;
    const amount = Math.abs(diff);

    const note =
      "Penyesuaian manual oleh admin (" +
      (diff > 0 ? "+" : "-") +
      formatCurrency(amount) +
      ").";

    try {
      setUpdatingId(wallet.id);

      // 1️⃣ Catat di wallet_transactions sebagai ADJUST
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "ADJUST",
          amount,
          balance_before: current,
          balance_after: newBalance,
          status: "COMPLETED",
          note,
        });

      if (txErr) {
        console.error("Insert ADJUST error:", txErr.message);
        alert("Gagal mencatat transaksi penyesuaian.");
        return;
      }

      // 2️⃣ Update saldo di tabel wallets
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallets balance error:", wErr.message);
        alert("Gagal memperbarui saldo dompet.");
        return;
      }

      await loadWallets();
      alert("Saldo berhasil disesuaikan.");
    } catch (err) {
      console.error("Adjust balance error:", err);
      alert("Terjadi kesalahan saat menyesuaikan saldo.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ============ RENDER ============
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
                Admin · Pengaturan saldo dompet
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
          <p className="nanad-dashboard-eyebrow">Wallet management</p>
          <h1 className="nanad-dashboard-heading">
            Penyesuaian saldo dompet semua user.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini memungkinkan admin melakukan koreksi saldo secara
            manual. Setiap perubahan akan dicatat sebagai transaksi{" "}
            <strong>ADJUST</strong> di riwayat dompet, sehingga jejaknya tetap
            terlihat.
          </p>
          <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
            Gunakan dengan hati-hati. Fitur ini hanya untuk simulasi internal /
            pengujian. Bukan untuk mengelola dana investasi publik yang
            sebenarnya.
          </p>
        </section>

        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Daftar dompet</h3>
              <p>
                Menampilkan semua dompet yang ada di tabel{" "}
                <code>wallets</code>.
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

            {wallets.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada dompet yang tercatat.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {wallets.map((w) => (
                  <div key={w.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                        User ID
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          wordBreak: "break-all",
                        }}
                      >
                        {w.user_id}
                      </div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                        Wallet ID: {w.id}
                      </div>
                    </div>

                    <div>
                      <div>Saldo saat ini</div>
                      <div>{formatCurrency(w.balance)}</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                        {w.currency || "IDR"}
                      </div>
                    </div>

                    <div style={{ minWidth: "220px" }}>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        Saldo baru
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={editValues[w.id] ?? ""}
                          onChange={(e) =>
                            handleChangeValue(w.id, e.target.value)
                          }
                          style={{
                            width: "100%",
                            borderRadius: "999px",
                            border: "1px solid rgba(248, 250, 252, 0.08)",
                            background:
                              "radial-gradient(circle at top, rgba(255,255,255,0.06), rgba(15,23,42,1))",
                            padding: "0.4rem 0.8rem",
                            color: "white",
                            fontSize: "0.8rem",
                          }}
                          placeholder="contoh: 1500000"
                        />
                      </label>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        disabled={updatingId === w.id}
                        className="nanad-dashboard-deposit-submit"
                        onClick={() => handleAdjustBalance(w)}
                      >
                        {updatingId === w.id
                          ? "Menyimpan..."
                          : "Simpan penyesuaian"}
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
            Fitur penyesuaian saldo ini hanya untuk simulasi dan kebutuhan
            internal. Untuk operasional keuangan nyata, tetap wajib mengikuti
            regulasi dan pengawasan otoritas yang berlaku.
          </span>
        </footer>
      </div>
    </main>
  );
}
