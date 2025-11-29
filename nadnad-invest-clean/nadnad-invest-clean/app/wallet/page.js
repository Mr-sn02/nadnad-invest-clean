// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Rekening tujuan deposit (SILAKAN GANTI NOMOR & NAMA SESUAI REKENING ASLI)
const DEPOSIT_TARGETS = [
  {
    id: "BCA-UTAMA",
    label: "BCA · 1234567890 · a.n. Ratri Candra Agustin", // rekening utama
  },
  {
    id: "BRI-CABANG",
    label: "BRI · 5556667778 · a.n. Nanad Invest Bandung", // rekening cabang
  },
  {
    id: "DANA-SON",
    label: "DANA · 0812-0000-0000 · a.n. Bang Son", // e-wallet contoh
  },
];

export default function WalletPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Filter riwayat transaksi
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | DEPOSIT | WITHDRAW
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED

  // ==== Form DEPOSIT ====
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTarget, setDepositTarget] = useState(
    DEPOSIT_TARGETS[0]?.id || ""
  );
  const [depositProofFile, setDepositProofFile] = useState(null);
  const [depositSenderName, setDepositSenderName] = useState("");

  // ==== Form WITHDRAW ====
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawBankHolder, setWithdrawBankHolder] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // Ambil riwayat transaksi wallet
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

  // Inisialisasi: cek user, buat/ambil wallet, lalu load transaksi
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError("");

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

        // Jika user belum punya dompet, buat baru + simpan email
        if (!existing) {
          const { data: created, error: createErr } = await supabase
            .from("wallets")
            .insert({ user_id: user.id, user_email: user.email })
            .select("*")
            .single();

          if (createErr) {
            console.error("Error create wallet:", createErr.message);
            setLoadError(
              "Gagal membuat dompet baru. Cek konfigurasi database Supabase."
            );
            return;
          }
          currentWallet = created;
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

  // ==== Pengajuan DEPOSIT (rekening + bukti + nama pengirim) ====
  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    if (!depositTarget) {
      alert("Pilih rekening tujuan deposit.");
      return;
    }

    if (!depositSenderName.trim()) {
      alert("Isi nama pengirim (atas nama di rekening pengirim).");
      return;
    }

    const targetObj =
      DEPOSIT_TARGETS.find((t) => t.id === depositTarget) || null;
    const targetLabel = targetObj?.label || depositTarget;

    try {
      setActionLoading(true);

      // Upload bukti (jika ada)
      let proofImageUrl = null;

      if (depositProofFile) {
        const ext =
          depositProofFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${user.id}/${Date.now()}-deposit.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("deposit_proofs")
          .upload(filePath, depositProofFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) {
          console.error("Upload proof error:", uploadErr.message);
          alert(
            "Gagal mengunggah bukti transfer. Coba lagi atau kirim tanpa bukti."
          );
        } else {
          const { data: publicData } = supabase.storage
            .from("deposit_proofs")
            .getPublicUrl(filePath);
          proofImageUrl = publicData?.publicUrl || null;
        }
      }

      const before = wallet.balance ?? 0;
      const after = before + amount;

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "DEPOSIT",
          amount,
          balance_before: before,
          balance_after: after,
          status: "PENDING",
          note: "Pengajuan deposit menunggu persetujuan admin.",
          deposit_target: targetLabel,
          proof_image_url: proofImageUrl,
          sender_name: depositSenderName.trim(),
          user_email: user.email || null,
        });

      if (txErr) throw txErr;

      setDepositAmount("");
      setDepositProofFile(null);
      setDepositSenderName("");

      await loadTransactions(wallet.id);
      alert(
        "Pengajuan deposit terkirim dan menunggu persetujuan admin.\nAdmin akan mengecek mutasi & bukti transfer."
      );
    } catch (err) {
      console.error("Create deposit error:", err);
      alert("Gagal mengajukan deposit.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==== Pengajuan WITHDRAW (PENDING + data rekening) ====
  const handleCreateWithdraw = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

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

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
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
          user_email: user.email || null,
        });

      if (txErr) throw txErr;

      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawBankAccount("");
      setWithdrawBankHolder("");

      await loadTransactions(wallet.id);
      alert("Pengajuan penarikan terkirim dan menunggu persetujuan admin.");
    } catch (err) {
      console.error("Create withdraw error:", err);
      alert("Gagal mengajukan penarikan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter transaksi berdasarkan jenis & status
  const filteredTransactions = transactions.filter((tx) => {
    let okType = true;
    if (typeFilter === "DEPOSIT") okType = tx.type === "DEPOSIT";
    else if (typeFilter === "WITHDRAW") okType = tx.type === "WITHDRAW";

    let okStatus = true;
    if (statusFilter === "PENDING") {
      okStatus = tx.status === "PENDING";
    } else if (statusFilter === "APPROVED") {
      okStatus = tx.status === "APPROVED" || tx.status === "COMPLETED";
    } else if (statusFilter === "REJECTED") {
      okStatus = tx.status === "REJECTED";
    }

    return okType && okStatus;
  });

  // Ringkasan transaksi disetujui (dipakai untuk statistik kecil)
  const approvedDeposits = transactions
    .filter(
      (tx) =>
        tx.type === "DEPOSIT" &&
        (tx.status === "APPROVED" || tx.status === "COMPLETED")
    )
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const approvedWithdrawals = transactions
    .filter(
      (tx) =>
        tx.type === "WITHDRAW" &&
        (tx.status === "APPROVED" || tx.status === "COMPLETED")
    )
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const netFlow = approvedDeposits - approvedWithdrawals;

  // ==== RENDER: state loading / error ====
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

  // ==== RENDER: halaman wallet utama ====
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
                Wallet · Simpanan &amp; transaksi
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

        {/* Ringkasan saldo */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Wallet balance</p>
          <h1 className="nanad-dashboard-heading">
            Saldo dompet Nanad Invest kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Pengajuan deposit dan penarikan di halaman ini akan berstatus{" "}
            <strong>PENDING</strong> dan menunggu persetujuan admin. Saldo baru
            akan berubah setelah pengajuan disetujui secara manual.
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
          {/* Form DEPOSIT */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan deposit</h3>
              <p>
                Lakukan transfer ke salah satu rekening Nanad Invest di bawah
                ini, lalu isi nominal, nama pengirim, dan (opsional) unggah
                bukti transfer. Admin akan mengecek dan menyetujui secara
                manual.
              </p>
            </div>

            <form
              onSubmit={handleCreateDeposit}
              className="nanad-dashboard-deposit-form"
            >
              {/* Nominal */}
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

              {/* Atas nama pengirim */}
              <label className="nanad-dashboard-deposit-amount">
                Atas nama pengirim
                <input
                  type="text"
                  placeholder="nama pemilik rekening pengirim"
                  value={depositSenderName}
                  onChange={(e) => setDepositSenderName(e.target.value)}
                />
              </label>

              {/* Rekening tujuan + bukti transfer */}
              <div className="nanad-dashboard-deposit-row">
                <label>
                  Rekening tujuan deposit
                  <select
                    value={depositTarget}
                    onChange={(e) => setDepositTarget(e.target.value)}
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
                  >
                    {DEPOSIT_TARGETS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Bukti transfer (opsional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setDepositProofFile(e.target.files?.[0] || null)
                    }
                    style={{
                      width: "100%",
                      borderRadius: "999px",
                      border: "1px solid rgba(248, 250, 252, 0.08)",
                      background:
                        "radial-gradient(circle at top, rgba(255,255,255,0.06), rgba(15,23,42,1))",
                      padding: "0.3rem 0.8rem",
                      color: "white",
                      fontSize: "0.8rem",
                    }}
                  />
                </label>
              </div>

              {/* ⚠️ Teks peringatan di bawah dropdown rekening */}
              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.75rem", marginTop: "0.75rem" }}
              >
                Jika nomor rekening tujuan terlihat berbeda dari informasi
                resmi, tidak aktif, atau kamu ragu,{" "}
                <strong>jangan melakukan transfer</strong>. Segera hubungi
                admin melalui tombol <strong>Pengaduan WhatsApp</strong> di
                pojok kanan bawah untuk konfirmasi nomor rekening.
              </p>

              {/* Tombol submit */}
              <button
                type="submit"
                disabled={actionLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {actionLoading ? "Memproses..." : "Ajukan deposit"}
              </button>
            </form>
          </div>

          {/* Form WITHDRAW */}
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

        {/* Riwayat transaksi dompet */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi dompet</h3>
              <p>
                Termasuk pengajuan yang masih{" "}
                <strong>menunggu persetujuan admin</strong>. Kamu bisa menyaring
                berdasarkan jenis transaksi dan status di bawah ini.
              </p>
            </div>

            {/* Ringkasan transaksi disetujui */}
            <div
              className="nanad-dashboard-stat-grid"
              style={{ marginTop: "0.75rem" }}
            >
              <div className="nanad-dashboard-stat-card">
                <p className="nanad-dashboard-stat-label">
                  Total deposit disetujui
                </p>
                <p className="nanad-dashboard-stat-number">
                  {formatCurrency(approvedDeposits)}
                </p>
                <p
                  className="nanad-dashboard-body"
                  style={{ marginTop: "0.3rem", fontSize: "0.8rem" }}
                >
                  Akumulasi semua transaksi <strong>DEPOSIT</strong> dengan
                  status <strong>APPROVED / COMPLETED</strong> yang tercatat
                  pada riwayat ini.
                </p>
              </div>

              <div className="nanad-dashboard-stat-card">
                <p className="nanad-dashboard-stat-label">
                  Total penarikan disetujui
                </p>
                <p className="nanad-dashboard-stat-number">
                  {formatCurrency(approvedWithdrawals)}
                </p>
                <p
                  className="nanad-dashboard-body"
                  style={{ marginTop: "0.3rem", fontSize: "0.8rem" }}
                >
                  Akumulasi semua transaksi <strong>WITHDRAW</strong> yang sudah
                  disetujui admin dan tercatat selesai.
                </p>
              </div>

              <div className="nanad-dashboard-stat-card">
                <p className="nanad-dashboard-stat-label">
                  Aliran bersih disetujui
                </p>
                <p className="nanad-dashboard-stat-number">
                  {formatCurrency(netFlow)}
                </p>
                <p
                  className="nanad-dashboard-body"
                  style={{ marginTop: "0.3rem", fontSize: "0.8rem" }}
                >
                  Selisih antara{" "}
                  <strong>deposit disetujui - penarikan disetujui</strong>.
                  Nilai positif berarti dana lebih banyak masuk daripada keluar.
                </p>
              </div>
            </div>

            {/* Filter bar */}
            <div
              style={{
                marginTop: "0.75rem",
                marginBottom: "0.5rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                fontSize: "0.8rem",
              }}
            >
              <span
                style={{
                  opacity: 0.8,
                  marginRight: "0.25rem",
                }}
              >
                Jenis:
              </span>
              {[
                { key: "ALL", label: "Semua" },
                { key: "DEPOSIT", label: "Deposit" },
                { key: "WITHDRAW", label: "Penarikan" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setTypeFilter(btn.key)}
                  className={
                    typeFilter === btn.key
                      ? "nanad-dashboard-deposit-submit"
                      : "nanad-dashboard-logout"
                  }
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "999px",
                  }}
                >
                  {btn.label}
                </button>
              ))}

              <span
                style={{
                  opacity: 0.8,
                  marginLeft: "0.75rem",
                  marginRight: "0.25rem",
                }}
              >
                Status:
              </span>
              {[
                { key: "ALL", label: "Semua" },
                { key: "PENDING", label: "Pending" },
                { key: "APPROVED", label: "Disetujui" },
                { key: "REJECTED", label: "Ditolak" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setStatusFilter(btn.key)}
                  className={
                    statusFilter === btn.key
                      ? "nanad-dashboard-deposit-submit"
                      : "nanad-dashboard-logout"
                  }
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "0.75rem",
                    borderRadius: "999px",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Daftar transaksi */}
            {filteredTransactions.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
              >
                Belum ada transaksi yang cocok dengan filter yang dipilih.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {filteredTransactions.map((tx) => {
                  const created = new Date(tx.created_at).toLocaleString(
                    "id-ID",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  let statusLabel = tx.status;
                  let statusColor = "#e5e7eb";
                  let statusBg = "rgba(148,163,184,0.15)";

                  if (tx.status === "PENDING") {
                    statusLabel = "Menunggu persetujuan";
                    statusColor = "#facc15";
                    statusBg = "rgba(234,179,8,0.12)";
                  } else if (
                    tx.status === "APPROVED" ||
                    tx.status === "COMPLETED"
                  ) {
                    statusLabel = "Disetujui / selesai";
                    statusColor = "#4ade80";
                    statusBg = "rgba(34,197,94,0.12)";
                  } else if (tx.status === "REJECTED") {
                    statusLabel = "Ditolak";
                    statusColor = "#f87171";
                    statusBg = "rgba(248,113,113,0.12)";
                  }

                  const typeLabel =
                    tx.type === "DEPOSIT" ? "Deposit" : "Penarikan";
                  const typeBg =
                    tx.type === "DEPOSIT"
                      ? "rgba(59,130,246,0.18)"
                      : "rgba(236,72,153,0.18)";
                  const typeColor =
                    tx.type === "DEPOSIT" ? "#bfdbfe" : "#f9a8d4";

                  return (
                    <div key={tx.id} className="nanad-dashboard-deposits-row">
                      <div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            opacity: 0.9,
                            marginBottom: "0.15rem",
                          }}
                        >
                          {created}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.35rem",
                            marginTop: "0.1rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              background: typeBg,
                              color: typeColor,
                            }}
                          >
                            {typeLabel}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              background: statusBg,
                              color: statusColor,
                            }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.9rem", marginBottom: 4 }}>
                          {typeLabel} {formatCurrency(tx.amount)}
                        </div>

                        {tx.user_email && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                            Akun: {tx.user_email}
                          </div>
                        )}

                        {tx.sender_name && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                            Atas nama pengirim: {tx.sender_name}
                          </div>
                        )}

                        {tx.type === "DEPOSIT" && tx.deposit_target && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                            Rekening tujuan: {tx.deposit_target}
                          </div>
                        )}

                        {tx.type === "WITHDRAW" && tx.withdraw_bank_name && (
                          <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                            ke {tx.withdraw_bank_name} ·{" "}
                            {tx.withdraw_bank_account} (
                            {tx.withdraw_bank_holder})
                          </div>
                        )}

                        {tx.proof_image_url && (
                          <div style={{ marginTop: "0.2rem" }}>
                            <a
                              href={tx.proof_image_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: "0.75rem",
                                textDecoration: "underline",
                                opacity: 0.95,
                              }}
                            >
                              Lihat bukti transfer
                            </a>
                          </div>
                        )}

                        {tx.note && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              opacity: 0.9,
                              marginTop: "0.2rem",
                            }}
                          >
                            {tx.note}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(tx.amount)}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            opacity: 0.8,
                            marginTop: "0.15rem",
                          }}
                        >
                          Saldo sebelum: {formatCurrency(tx.balance_before)}
                          <br />
                          Saldo sesudah: {formatCurrency(tx.balance_after)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. All rights reserved.
          </span>
          <span>
            Fitur dompet dan approval ini masih dalam mode simulasi /
            pengembangan. Untuk operasi keuangan sebenarnya, tetap diperlukan
            integrasi resmi dan kepatuhan regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
