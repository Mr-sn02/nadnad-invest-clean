// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient"; // dari /app/wallet ke /lib

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
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Form deposit
  const [depositAmount, setDepositAmount] = useState("");

  // Form withdraw + rekening tujuan
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawBankHolder, setWithdrawBankHolder] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // Ambil user + wallet + transaksi
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError("");

      try {
        // 1. Cek user login
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

        // 2. Ambil / buat wallet
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setLoadError(
            "Gagal memuat dompet. Pastikan tabel 'wallets' sudah dibuat di Supabase."
          );
          return;
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
            setLoadError(
              "Gagal membuat dompet baru. Cek konfigurasi database Supabase."
            );
            return;
          } else {
            currentWallet = created;
          }
        }

        setWallet(currentWallet);

        // 3. Ambil transaksi
        const { data: txs, error: txErr } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", currentWallet.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (txErr) {
          console.error("Error load transactions:", txErr.message);
          setLoadError(
            "Gagal memuat transaksi dompet. Pastikan tabel 'wallet_transactions' sudah ada."
          );
          return;
        }

        setTransactions(txs || []);
      } catch (err) {
        console.error("Unexpected wallet init error:", err);
        setLoadError("Terjadi kesalahan saat memuat dompet Nanad Invest.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Helper refresh setelah deposit/withdraw
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

  // === Deposit DEV (langsung update saldo) =====================
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    try {
      setActionLoading(true);
      const before = wallet.balance;
      const after = before + amount;

      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);
      if (updErr) throw updErr;

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
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
      console.error("Deposit error:", err);
      alert("Gagal memproses deposit (mode dev).");
    } finally {
      setActionLoading(false);
    }
  };

  // === Withdraw DEV dengan rekening tujuan =====================
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

    if (
      !withdrawBankName.trim() ||
      !withdrawBankAccount.trim() ||
      !withdrawBankHolder.trim()
    ) {
      alert("Lengkapi data rekening tujuan penarikan.");
      return;
    }

    try {
      setActionLoading(true);
      const before = wallet.balance;
      const after = before - amount;

      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);
      if (updErr) throw updErr;

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "WITHDRAW",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: "Penarikan manual (DEV, tanpa disbursement bank).",
          withdraw_bank_name: withdrawBankName,
          withdraw_bank_account: withdrawBankAccount,
          withdraw_bank_holder: withdrawBankHolder,
        });
      if (txErr) throw txErr;

      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawBankAccount("");
      setWithdrawBankHolder("");

      await refreshWallet();
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Gagal memproses penarikan (mode dev).");
    } finally {
      setActionLoading(false);
    }
  };

  // === RENDER ==================================================

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat dompet Nanad Invest...
          </p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Wallet error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat dompet Nanad Invest.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {loadError}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/")}
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

        {/* SALDO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Wallet balance</p>
          <h1 className="nanad-dashboard-heading">
            Saldo dompet Nanad Invest kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Di halaman ini kamu bisa melihat saldo, melakukan deposit
            (mode pengembangan), dan simulasi penarikan ke rekening tujuan.
            Untuk operasi keuangan sebenarnya, integrasi ke bank/payment
            gateway dan kepatuhan regulasi tetap diperlukan.
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

        {/* DEPOSIT & WITHDRAW */}
        <section className="nanad-dashboard-table-section">
          {/* Deposit */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Deposit (mode pengembangan)</h3>
              <p>
                Deposit di sini hanya mengubah saldo di database untuk keperluan
                simulasi/pengembangan. Untuk uang nyata, perlu integrasi resmi
                dengan payment gateway / bank.
              </p>
            </div>

            <form
              onSubmit={handleDeposit}
              className="nanad-dashboard-deposit-form"
            >
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

          {/* Withdraw */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Penarikan (mode pengembangan)</h3>
              <p>
                Penarikan di sini mengurangi saldo di database, dengan mencatat
                rekening tujuan. Pencairan uang nyata tetap perlu proses
                terpisah lewat sistem bank/payment gateway.
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

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Nama bank / e-wallet
                  <input
                    type="text"
                    placeholder="contoh: BCA / BRI / Dana"
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                  />
                </label>
                <label>
                  Nomor rekening / akun
                  <input
                    type="text"
                    placeholder="contoh: 1234567890"
                    value={withdrawBankAccount}
                    onChange={(e) => setWithdrawBankAccount(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Nama pemilik rekening
                <input
                  type="text"
                  placeholder="contoh: Nama lengkap kamu"
                  value={withdrawBankHolder}
                  onChange={(e) => setWithdrawBankHolder(e.target.value)}
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

        {/* RIWAYAT */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi dompet</h3>
              <p>20 transaksi terakhir dalam dompet Nanad Invest kamu.</p>
            </div>

            {transactions.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada transaksi tercatat.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {transactions.map((tx) => (
                  <div key={tx.id} className="nanad-dashboard-deposits-row">
                    <div>
                      {new Date(tx.created_at).toLocaleString("id-ID")}
                    </div>
                    <div>
                      {tx.type === "DEPOSIT" ? "Deposit" : "Penarikan"} ·{" "}
                      {tx.status}
                      {tx.type === "WITHDRAW" &&
                        tx.withdraw_bank_name && (
                          <>
                            <br />
                            <small>
                              ke {tx.withdraw_bank_name} ·{" "}
                              {tx.withdraw_bank_account} (
                              {tx.withdraw_bank_holder})
                            </small>
                          </>
                        )}
                    </div>
                    <div>{formatCurrency(tx.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER DOMPET */}
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
