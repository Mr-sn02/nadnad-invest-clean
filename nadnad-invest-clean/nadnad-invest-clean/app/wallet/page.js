// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient"; // ← ini yang diperbaiki

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Ambil user + wallet
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // cek wallet, kalau belum ada buat
      const { data: existing, error: walletErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletErr) {
        console.error("Error get wallet:", walletErr.message);
      }

      let currentWallet = existing;

      if (!existing) {
        const { data: created, error: createErr } = await supabase
          .from("wallets")
          .insert({ user_id: user.id })
          .select("*")
          .single();
        if (createErr) {
          console.error("Error create wallet:", createErr.message);
        } else {
          currentWallet = created;
        }
      }

      setWallet(currentWallet);

      if (currentWallet) {
        const { data: txs, error: txErr } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", currentWallet.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (txErr) console.error("Error load tx:", txErr.message);
        setTransactions(txs || []);
      }

      setLoading(false);
    };

    init();
  }, [router]);

  // Helper refresh wallet + transaksi
  const refreshWallet = async () => {
    if (!user) return;
    const { data: w } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setWallet(w);

    const { data: txs } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", w.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTransactions(txs || []);
  };

  // === Deposit "langsung" (belum pakai payment gateway) ===
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    // *** CATATAN ***
    // Di produksi, di sini seharusnya deposit dilakukan lewat payment gateway/bank,
    // lalu callback dari gateway yang mengubah saldo. Ini hanya shortcut DEV.

    try {
      setActionLoading(true);
      const before = wallet.balance;
      const after = before + amount;

      // update saldo
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (updErr) throw updErr;

      // insert transaksi
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "DEPOSIT",
        amount,
        balance_before: before,
        balance_after: after,
        status: "COMPLETED",
        note: "Deposit manual (DEV, tanpa gateway).",
      });

      if (txErr) throw txErr;

      setDepositAmount("");
      await refreshWallet();
    } catch (err) {
      console.error("Deposit error:", err.message);
      alert("Gagal memproses deposit (mode dev).");
    } finally {
      setActionLoading(false);
    }
  };

  // === Withdraw ===
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Nominal penarikan harus lebih besar dari 0.");
      return;
    }

    if (amount > wallet.balance) {
      alert("Saldo tidak mencukupi untuk penarikan ini.");
      return;
    }

    // Di produksi, ini sebaiknya kirim request ke back-end untuk proses disbursement bank.
    try {
      setActionLoading(true);
      const before = wallet.balance;
      const after = before - amount;

      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (updErr) throw updErr;

      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "WITHDRAW",
        amount,
        balance_before: before,
        balance_after: after,
        status: "COMPLETED",
        note: "Penarikan manual (DEV, tanpa disbursement bank).",
      });

      if (txErr) throw txErr;

      setWithdrawAmount("");
      await refreshWallet();
    } catch (err) {
      console.error("Withdraw error:", err.message);
      alert("Gagal memproses penarikan (mode dev).");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="text-sm text-slate-200">
            Memuat dompet Nanad Invest...
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
                Wallet · Simpanan &amp; transaksi
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nanad-dashboard-logout"
            onClick={() => router.push("/")}
          >
            Kembali ke dashboard
          </button>
        </header>

        {/* Saldo utama */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Wallet balance</p>
          <h1 className="nanad-dashboard-heading">
            Saldo dompet Nanad Invest kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Di halaman ini kamu bisa melihat saldo, melakukan deposit (mode
            pengembangan), dan simulasi penarikan. Untuk operasi keuangan
            sebenarnya, integrasi ke bank atau payment gateway perlu ditambahkan
            di sisi server.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo tersedia</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance) : "Rp 0"}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Mata uang</p>
              <p className="nanad-dashboard-stat-number">
                {wallet?.currency || "IDR"}
              </p>
            </div>
          </div>
        </section>

        {/* Deposit & Withdraw */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Deposit (mode pengembangan)</h3>
              <p>
                Untuk tahap awal, deposit di sini hanya mengubah saldo di
                database sebagai simulasi. Untuk uang nyata, harus dihubungkan
                dengan payment gateway / bank dan dikonfirmasi lewat callback.
              </p>
            </div>

            <form onSubmit={handleDeposit} className="nanad-dashboard-deposit-form">
              <label className="nanad-dashboard-deposit-amount">
                Nominal deposit
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="contoh: 100000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={actionLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {actionLoading ? "Memproses..." : "Tambah saldo (DEV)"}
              </button>
            </form>
          </div>

          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Penarikan (mode pengembangan)</h3>
              <p>
                Penarikan di sini hanya mengurangi saldo sebagai simulasi. Untuk
                penarikan nyata, biasanya diperlukan verifikasi tambahan dan
                pencairan lewat sistem bank.
              </p>
            </div>

            <form
              onSubmit={handleWithdraw}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal penarikan
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="contoh: 50000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={actionLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {actionLoading ? "Memproses..." : "Tarik saldo (DEV)"}
              </button>
            </form>
          </div>
        </section>

        {/* Riwayat */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi dompet</h3>
              <p>20 transaksi terakhir dalam dompet Nanad Invest kamu.</p>
            </div>

            {transactions.length === 0 ? (
              <p className="nanad-dashboard-body mt-3">
                Belum ada transaksi tercatat.
              </p>
            ) : (
              <div className="nanad-dashboard-deposits-rows mt-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="nanad-dashboard-deposits-row">
                    <div>{new Date(tx.created_at).toLocaleString("id-ID")}</div>
                    <div>
                      {tx.type === "DEPOSIT" ? "Deposit" : "Penarikan"} ·{" "}
                      {tx.status}
                    </div>
                    <div>{formatCurrency(tx.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. All rights reserved.
          </span>
          <span>
            Fitur dompet ini saat ini berjalan dalam mode simulasi/pengembangan.
            Untuk operasi keuangan sebenarnya, diperlukan integrasi resmi dengan
            perbankan/payment gateway dan kepatuhan regulasi yang berlaku.
          </span>
        </footer>
      </div>
    </main>
  );
}
