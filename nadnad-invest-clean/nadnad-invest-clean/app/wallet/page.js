// app/wallet/page.js
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

// Rekening tujuan deposit (SILAKAN GANTI NOMOR & NAMA SESUAI REKENING ASLI)
const DEPOSIT_TARGETS = [
  {
    id: "BCA-UTAMA",
    label: "BCA · 1234567890 · a.n. MONEYMALL", // rekening utama
  },
  {
    id: "BRI-CABANG",
    label: "BRI · 5556667778 · a.n. Dompet Nadnad Bandung", // rekening cabang (brand baru)
  },
  {
    id: "DANA-SON",
    label: "DANA · 0812-0000-0000 · a.n. Bang Son", // e-wallet contoh
  },
];

// helper: generate 8 digit random
async function generateUniqueAccountNumber() {
  for (let i = 0; i < 5; i++) {
    const candidate = String(
      Math.floor(10000000 + Math.random() * 90000000)
    ); // 8 digit

    const { data, error } = await supabase
      .from("wallets")
      .select("id")
      .eq("account_number", candidate)
      .maybeSingle();

    if (!error && !data) return candidate;
  }
  throw new Error("Gagal menghasilkan nomor Dompet Nadnad unik.");
}

export default function WalletPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // ==== Form DEPOSIT ====
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTarget, setDepositTarget] = useState(
    DEPOSIT_TARGETS[0]?.id || ""
  );
  const [depositProofFile, setDepositProofFile] = useState(null);
  const [depositSenderName, setDepositSenderName] = useState("");
  const [depositUserNote, setDepositUserNote] = useState("");

  // ==== Form WITHDRAW ====
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawBankHolder, setWithdrawBankHolder] = useState("");
  const [withdrawUserNote, setWithdrawUserNote] = useState("");

  // ==== Form TRANSFER INTERNAL ====
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTargetAccount, setTransferTargetAccount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  // ==== Filter riwayat ====
  const [filterType, setFilterType] = useState("ALL"); // ALL | DEPOSIT | WITHDRAW | INTERNAL_TRANSFER_IN | INTERNAL_TRANSFER_OUT
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | PENDING | APPROVED | REJECTED

  // Ambil riwayat transaksi wallet
  const loadTransactions = async (walletId) => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error load transactions:", error.message);
      setLoadError(
        "Gagal memuat transaksi dompet. Pastikan tabel 'wallet_transactions' sudah ada."
      );
      return;
    }

    setTransactions(data || []);
  };

  // Inisialisasi: cek user, buat/ambil wallet, generate nomor dompet, lalu load transaksi
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

        // pastikan punya nomor Dompet Nadnad (account_number)
        if (!currentWallet.account_number) {
          try {
            const newAcc = await generateUniqueAccountNumber();
            const { data: updated, error: updErr } = await supabase
              .from("wallets")
              .update({ account_number: newAcc })
              .eq("id", currentWallet.id)
              .select("*")
              .single();

            if (updErr) {
              console.error("Update account_number error:", updErr.message);
            } else if (updated) {
              currentWallet = updated;
            }
          } catch (genErr) {
            console.error("Gagal generate nomor dompet:", genErr);
          }
        }

        setWallet(currentWallet);
        await loadTransactions(currentWallet.id);
      } catch (err) {
        console.error("Unexpected wallet init error:", err);
        setLoadError("Terjadi kesalahan saat memuat Dompet Nadnad.");
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
          user_note: depositUserNote.trim() || null,
        });

      if (txErr) throw txErr;

      setDepositAmount("");
      setDepositProofFile(null);
      setDepositSenderName("");
      setDepositUserNote("");

      await loadTransactions(wallet.id);
      alert(
        "Pengajuan deposit terkirim dan menunggu persetujuan admin.\nAdmin akan mengecek mutasi & bukti transfer."
      );
    } catch (err) {
      console.error("Create deposit error:", err);
      alert(
        "Gagal mengajukan deposit.\n\n" + (err?.message || "Unknown error")
      );
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

    if (amount > (wallet.balance ?? 0)) {
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
          user_note: withdrawUserNote.trim() || null,
        });

      if (txErr) throw txErr;

      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawBankAccount("");
      setWithdrawBankHolder("");
      setWithdrawUserNote("");

      await loadTransactions(wallet.id);
      alert("Pengajuan penarikan terkirim dan menunggu persetujuan admin.");
    } catch (err) {
      console.error("Create withdraw error:", err);
      alert(
        "Gagal mengajukan penarikan.\n\n" + (err?.message || "Unknown error")
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==== Pengajuan TRANSFER INTERNAL ====
  const handleInternalTransfer = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      alert("Nominal transfer harus lebih besar dari 0.");
      return;
    }

    if (amount > (wallet.balance ?? 0)) {
      alert(
        `Saldo saat ini ${formatCurrency(
          wallet.balance
        )}. Nominal transfer tidak boleh melebihi saldo.`
      );
      return;
    }

    const targetAcc = transferTargetAccount.trim();
    if (!targetAcc) {
      alert("Masukkan nomor Dompet Nadnad tujuan.");
      return;
    }

    if (wallet.account_number && targetAcc === wallet.account_number) {
      alert("Tidak bisa transfer ke Dompet Nadnad sendiri.");
      return;
    }

    try {
      setTransferLoading(true);

      // cari dompet tujuan berdasarkan nomor dompet
      const { data: targetWallet, error: targetErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("account_number", targetAcc)
        .maybeSingle();

      if (targetErr) {
        console.error("Cari wallet tujuan error:", targetErr);
        alert(
          "Gagal mencari Dompet Nadnad tujuan.\n\n" +
            (targetErr.message || "")
        );
        return;
      }

      if (!targetWallet) {
        alert("Nomor Dompet Nadnad tujuan tidak ditemukan.");
        return;
      }

      // 1) catat di tabel wallet_internal_transfers (PENDING)
      const { error: transferErr } = await supabase
        .from("wallet_internal_transfers")
        .insert({
          from_wallet_id: wallet.id,
          to_wallet_id: targetWallet.id,
          from_user_id: user.id,
          to_user_id: targetWallet.user_id ?? null,
          from_account_number: wallet.account_number,
          to_account_number: targetWallet.account_number,
          amount,
          status: "PENDING",
          user_note: transferNote.trim() || null,
          created_by_email: user.email || null,
        });

      if (transferErr) {
        console.error(
          "Insert wallet_internal_transfers error:",
          transferErr
        );
        alert(
          "Gagal membuat pengajuan transfer.\n\n" +
            (transferErr.message || "")
        );
        return;
      }

      // 2) catat 2 baris di wallet_transactions (OUT & IN) sebagai PENDING
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert([
          {
            wallet_id: wallet.id,
            type: "INTERNAL_TRANSFER_OUT",
            amount,
            balance_before: wallet.balance ?? 0,
            balance_after: wallet.balance ?? 0,
            status: "PENDING",
            note: `Pengajuan transfer ke Dompet Nadnad ${targetWallet.account_number}`,
            user_email: user.email || null,
            user_note: transferNote.trim() || null,
          },
          {
            wallet_id: targetWallet.id,
            type: "INTERNAL_TRANSFER_IN",
            amount,
            balance_before: targetWallet.balance ?? 0,
            balance_after: targetWallet.balance ?? 0,
            status: "PENDING",
            note: `Pengajuan transfer dari Dompet Nadnad ${wallet.account_number}`,
            user_email: targetWallet.user_email || null,
            user_note: transferNote.trim() || null,
          },
        ]);

      if (txErr) {
        console.error(
          "Insert wallet_transactions (internal) error:",
          txErr
        );
        alert(
          "Pengajuan transfer tersimpan, tetapi gagal mencatat riwayat transaksi.\n\n" +
            (txErr.message || "")
        );
      }

      setTransferAmount("");
      setTransferTargetAccount("");
      setTransferNote("");

      await loadTransactions(wallet.id);

      alert(
        `Pengajuan transfer antar Dompet Nadnad berhasil dibuat.\n\n` +
          `Dari: ${wallet.account_number}\n` +
          `Ke: ${targetWallet.account_number}\n` +
          `Nominal: ${formatCurrency(amount)}\n\n` +
          `Status masih PENDING dan menunggu persetujuan admin.`
      );
    } catch (err) {
      console.error("Unexpected internal transfer error:", err);
      alert(
        "Terjadi kesalahan saat pengajuan transfer.\n\n" +
          (err?.message || "")
      );
    } finally {
      setTransferLoading(false);
    }
  };

  // ==== RENDER: state loading / error ====
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat Dompet Nadnad...</p>
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
              Gagal memuat Dompet Nadnad.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {loadError}
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

  // Filter transaksi di client
  const filteredTransactions = transactions.filter((tx) => {
    const matchType =
      filterType === "ALL"
        ? true
        : tx.type === filterType ||
          (filterType === "DEPOSIT" && tx.type === "DEPOSIT") ||
          (filterType === "WITHDRAW" && tx.type === "WITHDRAW");
    const matchStatus =
      filterStatus === "ALL" ? true : tx.status === filterStatus;
    return matchType && matchStatus;
  });

  // ==== RENDER: halaman wallet utama ====
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Dompet pintar · Saldo &amp; transaksi
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/profile")}
            >
              Profil &amp; Keamanan
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Kembali ke dashboard
            </button>
          </div>
        </header>

        {/* Ringkasan saldo */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Saldo dompet pintar</p>
          <h1 className="nanad-dashboard-heading">
            Saldo Dompet Nadnad kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Pengajuan deposit, penarikan, dan transfer di halaman ini akan
            berstatus <strong>PENDING</strong> dan menunggu persetujuan admin.
            Saldo baru akan berubah setelah pengajuan disetujui secara manual.
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

          {/* Info pemilik Dompet Nadnad */}
          <section
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              padding: "0.9rem 1.1rem",
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.5)",
              background:
                "radial-gradient(circle at top, rgba(148,163,184,0.10), rgba(15,23,42,1))",
              fontSize: "0.85rem",
            }}
          >
            {/* Nama pengguna / label dompet */}
            <div style={{ marginBottom: "0.6rem" }}>
              <div style={{ opacity: 0.8 }}>Nama pengguna Dompet Nadnad</div>
              <input
                type="text"
                value={wallet?.owner_name || ""}
                onChange={(e) =>
                  setWallet((prev) =>
                    prev ? { ...prev, owner_name: e.target.value } : prev
                  )
                }
                onBlur={async (e) => {
                  const newName = e.target.value.trim();
                  if (!wallet || !newName || newName === wallet.owner_name)
                    return;

                  try {
                    const { error } = await supabase
                      .from("wallets")
                      .update({ owner_name: newName })
                      .eq("id", wallet.id);

                    if (error) {
                      console.error(
                        "Update owner_name error:",
                        error.message
                      );
                      alert("Gagal menyimpan nama pengguna.");
                    }
                  } catch (err) {
                    console.error("Unexpected owner_name error:", err);
                    alert("Terjadi kesalahan saat menyimpan nama pengguna.");
                  }
                }}
                placeholder="contoh: Nadnad Family, Dana Umum, dll."
                style={{
                  marginTop: "0.25rem",
                  width: "100%",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.8)",
                  background:
                    "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,1))",
                  padding: "0.4rem 0.8rem",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Nomor rekening Dompet Nadnad */}
            <div>
              <div style={{ opacity: 0.8 }}>
                Nomor Dompet Nadnad (seperti no. rekening)
              </div>
              <div
                style={{
                  marginTop: "0.25rem",
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  letterSpacing: "0.12em",
                }}
              >
                {wallet?.account_number || "— belum tersedia —"}
              </div>
              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}
              >
                Nomor ini bisa kamu bagikan ke pengguna lain Dompet Nadnad
                untuk kirim saldo internal. Admin akan menyetujui sebelum saldo
                benar-benar berpindah.
              </p>
            </div>
          </section>
        </section>

        {/* DEPOSIT, WITHDRAW, TRANSFER INTERNAL */}
        <section className="nanad-dashboard-table-section">
          {/* Form DEPOSIT */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan deposit</h3>
              <p>
                Lakukan transfer ke salah satu rekening Dompet Nadnad di bawah
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

              {/* Catatan pengguna */}
              <label className="nanad-dashboard-deposit-amount">
                Catatan tambahan (opsional)
                <textarea
                  placeholder="contoh: setor untuk tabungan pendidikan / setor pertama, mohon dibantu."
                  value={depositUserNote}
                  onChange={(e) => setDepositUserNote(e.target.value)}
                  style={{
                    minHeight: "70px",
                    resize: "vertical",
                  }}
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
                <strong>jangan melakukan transfer</strong>. Segera hubungi admin
                melalui tombol <strong>Pengaduan WhatsApp</strong> di pojok
                kanan bawah untuk konfirmasi nomor rekening.
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

              <label className="nanad-dashboard-deposit-amount">
                Catatan tambahan (opsional)
                <textarea
                  placeholder="contoh: tarik untuk kebutuhan darurat / pembayaran tertentu."
                  value={withdrawUserNote}
                  onChange={(e) => setWithdrawUserNote(e.target.value)}
                  style={{
                    minHeight: "70px",
                    resize: "vertical",
                  }}
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

        {/* TRANSFER INTERNAL */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Transfer antar Dompet Nadnad</h3>
              <p>
                Gunakan fitur ini untuk mengirim saldo internal ke Dompet
                Nadnad lain menggunakan nomor Dompet Nadnad (seperti nomor
                rekening). Sama seperti fitur lain, pengajuan ini{" "}
                <strong>akan dicek dan disetujui admin terlebih dahulu</strong>.
              </p>
            </div>

            <form
              onSubmit={handleInternalTransfer}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal transfer
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="contoh: 100000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Nomor Dompet Nadnad tujuan
                <input
                  type="text"
                  placeholder="contoh: 12345678"
                  value={transferTargetAccount}
                  onChange={(e) => setTransferTargetAccount(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan tambahan (opsional)
                <textarea
                  placeholder="contoh: transfer untuk iuran arisan / bayar tagihan."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  style={{ minHeight: "70px", resize: "vertical" }}
                />
              </label>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.75rem", marginTop: "0.75rem" }}
              >
                Pastikan nomor Dompet Nadnad tujuan benar sebelum mengajukan.
                Seperti fitur lain, admin akan melihat pengajuan ini sebelum
                saldo antardompet benar-benar disesuaikan.
              </p>

              <button
                type="submit"
                disabled={transferLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {transferLoading
                  ? "Mengirim pengajuan transfer..."
                  : "Mengajukan transfer..."}
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
                <strong>menunggu persetujuan admin</strong>.
              </p>
            </div>

            {/* Filter bar */}
            <div
              style={{
                marginTop: "0.8rem",
                marginBottom: "0.4rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <span style={{ opacity: 0.7 }}>Jenis:</span>
                {["ALL", "DEPOSIT", "WITHDRAW"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border:
                        filterType === t
                          ? "1px solid rgba(250,204,21,0.9)"
                          : "1px solid rgba(148,163,184,0.4)",
                      background:
                        filterType === t
                          ? "radial-gradient(circle at top, rgba(250,204,21,0.35), rgba(15,23,42,1))"
                          : "rgba(15,23,42,0.6)",
                      cursor: "pointer",
                    }}
                  >
                    {t === "ALL"
                      ? "Semua"
                      : t === "DEPOSIT"
                      ? "Deposit"
                      : "Penarikan"}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <span style={{ opacity: 0.7 }}>Status:</span>
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    style={{
                      padding: "0.25rem 0.7rem",
                      borderRadius: "999px",
                      border:
                        filterStatus === s
                          ? "1px solid rgba(56,189,248,0.9)"
                          : "1px solid rgba(148,163,184,0.4)",
                      background:
                        filterStatus === s
                          ? "radial-gradient(circle at top, rgba(56,189,248,0.35), rgba(15,23,42,1))"
                          : "rgba(15,23,42,0.6)",
                      cursor: "pointer",
                    }}
                  >
                    {s === "ALL"
                      ? "Semua"
                      : s === "PENDING"
                      ? "Pending"
                      : s === "APPROVED"
                      ? "Disetujui"
                      : "Ditolak"}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada transaksi sesuai filter.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {filteredTransactions.map((tx) => {
                  const created = tx.created_at
                    ? new Date(tx.created_at).toLocaleString("id-ID")
                    : "-";

                  let statusLabel = tx.status;
                  let statusColor = "#e5e7eb";

                  if (tx.status === "PENDING") {
                    statusLabel = "Menunggu persetujuan";
                    statusColor = "#facc15";
                  } else if (
                    tx.status === "APPROVED" ||
                    tx.status === "COMPLETED"
                  ) {
                    statusLabel = "Disetujui / selesai";
                    statusColor = "#4ade80";
                  } else if (tx.status === "REJECTED") {
                    statusLabel = "Ditolak";
                    statusColor = "#f87171";
                  }

                  let typeLabel = "Transaksi";
                  let typeColor = "#38bdf8";

                  if (tx.type === "DEPOSIT") {
                    typeLabel = "Deposit";
                    typeColor = "#4ade80";
                  } else if (tx.type === "WITHDRAW") {
                    typeLabel = "Penarikan";
                    typeColor = "#fb923c";
                  } else if (tx.type === "INTERNAL_TRANSFER_OUT") {
                    typeLabel = "Transfer keluar";
                    typeColor = "#f97316";
                  } else if (tx.type === "INTERNAL_TRANSFER_IN") {
                    typeLabel = "Transfer masuk";
                    typeColor = "#22c55e";
                  }

                  return (
                    <div key={tx.id} className="nanad-dashboard-deposits-row">
                      {/* Kolom kiri: waktu + status */}
                      <div>
                        {created}
                        <br />
                        <span
                          style={{
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Kolom tengah: detail */}
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: typeColor,
                          }}
                        >
                          {typeLabel} {formatCurrency(tx.amount)}
                        </span>

                        {tx.user_email && (
                          <>
                            <br />
                            <small>Akun: {tx.user_email}</small>
                          </>
                        )}

                        {tx.sender_name && (
                          <>
                            <br />
                            <small>
                              Atas nama pengirim: {tx.sender_name}
                            </small>
                          </>
                        )}

                        {tx.type === "DEPOSIT" && tx.deposit_target && (
                          <>
                            <br />
                            <small>
                              Rekening tujuan: {tx.deposit_target}
                            </small>
                          </>
                        )}

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

                        {tx.user_note && (
                          <>
                            <br />
                            <small>
                              <strong>Catatan kamu:</strong> {tx.user_note}
                            </small>
                          </>
                        )}

                        {tx.admin_note && (
                          <>
                            <br />
                            <small>
                              <strong>Catatan admin:</strong> {tx.admin_note}
                            </small>
                          </>
                        )}

                        {tx.note && (
                          <>
                            <br />
                            <small>
                              <strong>Catatan sistem:</strong> {tx.note}
                            </small>
                          </>
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

                        <div style={{ marginTop: "0.2rem" }}>
                          <Link
                            href={`/wallet/receipt/${tx.id}`}
                            style={{
                              fontSize: "0.75rem",
                              textDecoration: "underline",
                              opacity: 0.95,
                              display: "inline-block",
                              marginTop: "0.1rem",
                            }}
                          >
                            Lihat bukti transaksi (struk)
                          </Link>
                        </div>
                      </div>

                      {/* Kolom kanan: nominal singkat */}
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {formatCurrency(tx.amount)}
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
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Fitur dompet dan approval ini beroperasi secara penuh untuk
            mendukung transaksi keuangan. Seluruh proses akan disesuaikan
            dengan integrasi resmi dan ketentuan regulasi yang berlaku.
          </span>
        </footer>
      </div>
    </main>
  );
}
