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

      const { error: txErr } = await supabase.from("wallet_transactions").insert({
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
            onClick={() => router.push("/")}
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

        {/* Riwayat transaksi dompet - versi tabel sederhana */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi dompet</h3>
              <p>
                Termasuk pengajuan yang masih{" "}
                <strong>menunggu persetujuan admin</strong>.
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
                style={{
                  marginTop: "0.75rem",
                  overflow: "hidden",
                  borderRadius: "24px",
                  border: "1px solid rgba(148,163,184,0.3)",
                  background:
                    "radial-gradient(circle at top, rgba(15,23,42,1), rgba(2,6,23,1))",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      fontSize: "0.75rem",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead
                      style={{
                        background:
                          "linear-gradient(to right, rgba(30,64,175,0.35), rgba(15,23,42,0.95))",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.6rem 1rem",
                            fontWeight: 500,
                          }}
                        >
                          Tanggal
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.6rem 1rem",
                            fontWeight: 500,
                          }}
                        >
                          Tipe
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "0.6rem 1rem",
                            fontWeight: 500,
                          }}
                        >
                          Nominal
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.6rem 1rem",
                            fontWeight: 500,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.6rem 1rem",
                            fontWeight: 500,
                          }}
                        >
                          Detail
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => {
                        const created = tx.created_at
                          ? new Date(tx.created_at).toLocaleString("id-ID")
                          : "-";

                        let statusLabel = tx.status || "-";
                        let statusBg = "rgba(148,163,184,0.15)";
                        let statusColor = "#e5e7eb";

                        if (tx.status === "PENDING") {
                          statusLabel = "Menunggu persetujuan";
                          statusBg = "rgba(250,204,21,0.15)";
                          statusColor = "#fde68a";
                        } else if (
                          tx.status === "APPROVED" ||
                          tx.status === "COMPLETED"
                        ) {
                          statusLabel = "Disetujui / selesai";
                          statusBg = "rgba(34,197,94,0.12)";
                          statusColor = "#bbf7d0";
                        } else if (tx.status === "REJECTED") {
                          statusLabel = "Ditolak";
                          statusBg = "rgba(248,113,113,0.12)";
                          statusColor = "#fecaca";
                        }

                        const typeLabel =
                          tx.type === "DEPOSIT" ? "Deposit" : "Penarikan";

                        let detailLines = [];

                        if (tx.type === "DEPOSIT" && tx.deposit_target) {
                          detailLines.push(`Rekening tujuan: ${tx.deposit_target}`);
                        }
                        if (tx.type === "WITHDRAW" && tx.withdraw_bank_name) {
                          detailLines.push(
                            `Ke ${tx.withdraw_bank_name} · ${tx.withdraw_bank_account || ""} (${tx.withdraw_bank_holder || "-"})`
                          );
                        }
                        if (tx.sender_name) {
                          detailLines.push(`A/n pengirim: ${tx.sender_name}`);
                        }
                        if (tx.note) {
                          detailLines.push(tx.note);
                        }

                        return (
                          <tr
                            key={tx.id || idx}
                            style={{
                              backgroundColor:
                                idx % 2 === 0
                                  ? "rgba(15,23,42,1)"
                                  : "rgba(15,23,42,0.85)",
                            }}
                          >
                            <td
                              style={{
                                padding: "0.6rem 1rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {created}
                            </td>
                            <td style={{ padding: "0.6rem 1rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: "999px",
                                  padding: "0.1rem 0.6rem",
                                  border: "1px solid rgba(148,163,184,0.5)",
                                  fontSize: "0.7rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {typeLabel}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "0.6rem 1rem",
                                textAlign: "right",
                              }}
                            >
                              {formatCurrency(tx.amount)}
                            </td>
                            <td style={{ padding: "0.6rem 1rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: "999px",
                                  padding: "0.1rem 0.6rem",
                                  backgroundColor: statusBg,
                                  color: statusColor,
                                  fontSize: "0.7rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "0.6rem 1rem",
                                fontSize: "0.7rem",
                                lineHeight: 1.4,
                              }}
                            >
                              {detailLines.length === 0 ? (
                                <span>-</span>
                              ) : (
                                detailLines.map((line, i) => (
                                  <div key={i}>{line}</div>
                                ))
                              )}
                              {tx.proof_image_url && (
                                <div style={{ marginTop: "0.2rem" }}>
                                  <a
                                    href={tx.proof_image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      textDecoration: "underline",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    Lihat bukti transfer
                                  </a>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div
                  style={{
                    padding: "0.6rem 1rem",
                    borderTop: "1px solid rgba(148,163,184,0.3)",
                    fontSize: "0.7rem",
                    color: "rgba(148,163,184,0.9)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    Riwayat transaksi ini bersumber dari tabel{" "}
                    <code>wallet_transactions</code>.
                  </span>
                  <span style={{ fontStyle: "italic" }}>
                    Simulasi tampilan · Bukan catatan transaksi resmi lembaga
                    keuangan.
                  </span>
                </div>
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
