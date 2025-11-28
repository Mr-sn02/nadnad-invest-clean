// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

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

  // Ambil transaksi untuk wallet tertentu
  const loadTransactions = async (walletId) => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error load transactions:", error.message);
      setLoadError(
        "Gagal memuat transaksi dompet. Pastikan tabel 'wallet_transactions' sudah ada."
      );
      return;
    }

    setTransactions(data || []);
  };

  // Inisialisasi: user + wallet + transaksi
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
        await loadTransactions(currentWallet.id);
      } catch (err) {
        console.error("Unexpected wallet init error:", err);
        setLoadError("Terjadi kesalahan saat memuat dompet Nanad Invest.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Helper refresh setelah ada approval admin (kalau halaman dibuka lagi)
  const refreshWallet = async () => {
    if (!user) return;

    const { data: w } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (w) {
      setWallet(w);
      await loadTransactions(w.id);
    }
  };

  // === Pengajuan DEPOSIT: status PENDING, saldo BELUM berubah ===
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    try {
      setActionLoading(true);

      const before = wallet.balance ?? 0;
      const after = before + amount;

      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "DEPOSIT",
        amount,
        balance_before: before,
        balance_after: after,
        status: "PENDING",
        note: "Pengajuan deposit menunggu persetujuan admin.",
      });

      if (txErr) throw txErr;

      setDepositAmount("");
      await loadTransactions(wallet.id); // saldo tidak ikut berubah
      alert("Pengajuan deposit terkirim dan menunggu persetujuan admin.");
    } catch (err) {
      console.error("Create deposit error:", err);
      alert("Gagal mengajukan deposit.");
    } finally {
      setActionLoading(false);
    }
  };

  // === Pengajuan WITHDRAW: status PENDING, saldo BELUM berubah ===
  const handleCreateWithdraw = async (e) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Nominal penarikan harus lebih besar dari 0.");
      return;
    }

    if (amount > wallet.balance) {
      alert(
        `Saldo saat ini ${formatCurrency(
          wallet.balance
        )}. Nominal penarikan tidak boleh melebihi saldo.`
      );
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

      const before = wallet.balance ?? 0;
      const after = before - amount;

      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "WITHDRAW",
        amount,
        balance_before: before,
        balance_after: after,
        status: "PENDING",
        note: "Pengajuan penarikan menunggu persetujuan admin.",
        withdraw_bank_name: withdrawBankName,
        withdraw_bank_account: withdrawBankAccount,
        withdraw_bank_holder: withdrawBankHolder,
      });

      if (txErr) throw txErr;

      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawBankAccount("");
      setWithdrawBankHolder("");

      await loadTransactions(wallet.id); // saldo tidak ikut berubah
      alert("Pengajuan penarikan terkirim dan menunggu persetujuan admin.");
    } catch (err) {
      console.error("Create withdraw error:", err);
      alert("Gagal mengajukan penarikan.");
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
            Pengajuan deposit dan penarikan di halaman ini akan berstatus{" "}
            <strong>PENDING</strong> dan menunggu persetujuan admin. Saldo baru
            akan berubah setelah pengajuan tersebut disetujui secara manual.
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
          {/* Pengajuan Deposit */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan deposit</h3>
              <p>
                Pengajuan ini hanya mencatat rencana penambahan saldo. Admin
                akan memeriksa dan menyetujui secara manual (misalnya setelah
                cek mutasi rekening atau payment gateway).
              </p>
            </div>

            <form
              onSubmit={handleCreateDeposit}
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
                {actionLoading ? "Memproses..." : "Ajukan deposit"}
              </button>
            </form>
          </div>

          {/* Pengajuan Withdraw */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan penarikan</h3>
              <p>
                Admin akan memproses penarikan ke rekening yang kamu isi di
                bawah. Saldo hanya akan berkurang setelah pengajuan disetujui.
              </p>
            </div>

            <form
              onSubmit={handleCreateWithdraw}
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
                {actionLoading ? "Memproses..." : "Ajukan penarikan"}
              </button>
            </form>
          </div>
        </section>

        {/* RIWAYAT */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi dompet</h3>
              <p>
                Termasuk pengajuan yang masih <strong>menunggu persetujuan</strong>.
              </p>
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
                {transactions.map((tx) => {
                  const created = new Date(tx.created_at).toLocaleString(
                    "id-ID"
                  );
                  let statusLabel = tx.status;
                  let statusColor = "#e5e7eb";

                  if (tx.status === "PENDING") {
                    statusLabel = "Menunggu persetujuan";
                    statusColor = "#facc15";
                  } else if (tx.status === "APPROVED" || tx.status === "COMPLETED") {
                    statusLabel = "Disetujui / selesai";
                    statusColor = "#4ade80";
                  } else if (tx.status === "REJECTED") {
                    statusLabel = "Ditolak";
                    statusColor = "#f87171";
                  }

                  return (
                    <div key={tx.id} className="nanad-dashboard-deposits-row">
                      <div>{created}</div>
                      <div>
                        {tx.type === "DEPOSIT" ? "Deposit" : "Penarikan"}
                        <br />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                        {tx.type === "WITHDRAW" && tx.withdraw_bank_name && (
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
                  );
                })}
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
            Fitur dompet dan approval ini masih dalam mode simulasi/pengembangan.
            Untuk operasi keuangan sebenarnya, tetap diperlukan integrasi resmi
            dengan perbankan/payment gateway dan kepatuhan regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
