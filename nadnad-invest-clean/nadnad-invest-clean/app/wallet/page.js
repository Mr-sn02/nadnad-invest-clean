// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

// Email admin sementara (bisa diganti pakai role di DB nanti)
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Format tanggal + jam
function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Generate nomor Dompet Nadnad 8 digit (string)
function generateAccountNumber() {
  let num = "";
  for (let i = 0; i < 8; i += 1) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

export default function WalletPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Form deposit
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTarget, setDepositTarget] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Form withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");
  const [withdrawBankAccount, setWithdrawBankAccount] = useState("");
  const [withdrawBankHolder, setWithdrawBankHolder] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const isAdmin =
    user && user.email && ADMIN_EMAILS.includes(user.email);

  // Ambil ulang riwayat transaksi untuk wallet tertentu
  const reloadTransactions = async (walletId) => {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Load transactions error:", error.message);
      return;
    }

    setTransactions(data || []);
  };

  // Inisialisasi: cek user, siapkan dompet, muat transaksi
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
          console.error("getUser error:", error.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Cari dompet berdasarkan user_id
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        let currentWallet = existing;

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setLoadError(
            "Gagal memuat dompet utama. Pastikan tabel 'wallets' sudah dibuat."
          );
          return;
        }

        // Username dari metadata (hasil register)
        const metaUsername =
          user.user_metadata?.username ||
          user.user_metadata?.Username ||
          null;

        // Jika belum ada dompet → buat baru
        if (!currentWallet) {
          const accountNumber = generateAccountNumber();

          const { data: created, error: createErr } = await supabase
            .from("wallets")
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0,
              owner_name:
                metaUsername || user.email?.split("@")[0] || null,
              account_number: accountNumber,
            })
            .select("*")
            .single();

          if (createErr) {
            console.error("Create wallet error:", createErr.message);
            setLoadError(
              "Gagal membuat dompet baru. Coba beberapa saat lagi atau hubungi admin."
            );
            return;
          }

          currentWallet = created;
        } else {
          // Kalau dompet sudah ada tapi belum punya nomor account_number → generate
          if (!currentWallet.account_number) {
            const newAcc = generateAccountNumber();
            const { data: updated, error: accErr } = await supabase
              .from("wallets")
              .update({ account_number: newAcc })
              .eq("id", currentWallet.id)
              .select("*")
              .single();

            if (accErr) {
              console.error(
                "Update account_number error:",
                accErr.message
              );
            } else {
              currentWallet = updated;
            }
          }

          // Kalau owner_name masih kosong dan ada username → isi otomatis
          if (!currentWallet.owner_name && metaUsername) {
            const { data: updatedOwner, error: ownerErr } = await supabase
              .from("wallets")
              .update({ owner_name: metaUsername })
              .eq("id", currentWallet.id)
              .select("*")
              .single();

            if (ownerErr) {
              console.error(
                "Auto-set owner_name error:",
                ownerErr.message
              );
            } else {
              currentWallet = updatedOwner;
            }
          }
        }

        setWallet(currentWallet);

        // Muat transaksi dompet
        await reloadTransactions(currentWallet.id);
      } catch (err) {
        console.error("Wallet init error:", err);
        setLoadError(
          "Terjadi kesalahan saat memuat Dompet Nadnad. Coba refresh halaman."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // Ganti nama pemilik dompet (owner_name)
  const handleOwnerNameBlur = async (e) => {
    if (!wallet) return;
    const newName = e.target.value.trim();
    if (!newName || newName === wallet.owner_name) return;

    try {
      const { error } = await supabase
        .from("wallets")
        .update({ owner_name: newName })
        .eq("id", wallet.id);

      if (error) {
        console.error("Update owner_name error:", error.message);
        alert("Gagal menyimpan nama pengguna Dompet Nadnad.");
        return;
      }

      setWallet((prev) =>
        prev ? { ...prev, owner_name: newName } : prev
      );
    } catch (err) {
      console.error("Unexpected owner_name error:", err);
      alert("Terjadi kesalahan saat menyimpan nama pengguna.");
    }
  };

  // Kirim pengajuan deposit
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    try {
      setDepositLoading(true);

      const { error } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          user_email: user.email,
          type: "DEPOSIT",
          amount,
          status: "PENDING",
          user_note: depositNote || null,
          deposit_target: depositTarget || null,
        });

      if (error) {
        console.error("Create deposit error:", error.message);
        alert("Gagal membuat pengajuan deposit.");
        return;
      }

      setDepositAmount("");
      setDepositNote("");
      setDepositTarget("");

      await reloadTransactions(wallet.id);

      alert(
        "Pengajuan deposit berhasil dibuat. Admin akan meninjau dan menyetujui secara manual."
      );
    } catch (err) {
      console.error("Unexpected deposit error:", err);
      alert("Terjadi kesalahan saat membuat pengajuan deposit.");
    } finally {
      setDepositLoading(false);
    }
  };

  // Kirim pengajuan penarikan
  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      alert("Nominal penarikan harus lebih besar dari 0.");
      return;
    }

    if (!withdrawBankName.trim() || !withdrawBankAccount.trim()) {
      alert(
        "Nama bank / e-wallet dan nomor rekening / akun tujuan wajib diisi."
      );
      return;
    }

    // Opsional: cek terhadap saldo saat ini (hanya peringatan, tidak mengunci)
    if (wallet.balance && amount > wallet.balance) {
      const ok = confirm(
        "Nominal penarikan melebihi saldo yang tertera di Dompet Nadnad. Tetap ajukan?"
      );
      if (!ok) return;
    }

    try {
      setWithdrawLoading(true);

      const { error } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          user_email: user.email,
          type: "WITHDRAW",
          amount,
          status: "PENDING",
          user_note: withdrawNote || null,
          withdraw_bank_name: withdrawBankName.trim(),
          withdraw_bank_account: withdrawBankAccount.trim(),
          withdraw_bank_holder: withdrawBankHolder.trim() || null,
        });

      if (error) {
        console.error("Create withdraw error:", error.message);
        alert("Gagal membuat pengajuan penarikan.");
        return;
      }

      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawBankAccount("");
      setWithdrawBankHolder("");
      setWithdrawNote("");

      await reloadTransactions(wallet.id);

      alert(
        "Pengajuan penarikan berhasil dibuat. Admin akan meninjau dan menyetujui secara manual."
      );
    } catch (err) {
      console.error("Unexpected withdraw error:", err);
      alert("Terjadi kesalahan saat membuat pengajuan penarikan.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat Dompet Nadnad kamu...
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
              Gagal memuat Dompet Nadnad.
            </h1>
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca" }}
            >
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

  const usernameMeta =
    user?.user_metadata?.username ||
    user?.user_metadata?.Username ||
    "-";

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Ruang saldo utama &amp; pengajuan transaksi
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/promo/balance-boost")}
            >
              Lihat promo
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* RINGKASAN & IDENTITAS DOMPET */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Dompet utama</p>
          <h1 className="nanad-dashboard-heading">
            Kelola saldo &amp; pengajuan dari Dompet Nadnad kamu.
          </h1>
          <p className="nanad-dashboard-body">
            Setiap setoran dan penarikan dicatat sebagai{" "}
            <strong>pengajuan berstatus PENDING</strong> terlebih dahulu.
            Admin akan meninjau satu per satu sebelum saldo Dompet Nadnad
            diperbarui, agar lebih aman dan terkendali.
          </p>

          {/* Kartu ringkasan */}
          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun terhubung</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Email ini digunakan sebagai identitas loginmu di Dompet
                Nadnad.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Username Dompet Nadnad
              </p>
              <p className="nanad-dashboard-stat-number">
                {usernameMeta}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Username diatur saat pendaftaran dan bisa kamu jadikan
                identitas publik saat berbagi nomor Dompet Nadnad.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Saldo Dompet Nadnad
              </p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Saldo ini akan berubah setelah{" "}
                <strong>pengajuan disetujui admin</strong>. Dana nyata tetap
                berada di rekening resmi/bank/e-wallet kamu.
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
              <div style={{ opacity: 0.8 }}>
                Nama pengguna Dompet Nadnad
              </div>
              <input
                type="text"
                value={wallet?.owner_name || ""}
                onChange={(e) =>
                  setWallet((prev) =>
                    prev ? { ...prev, owner_name: e.target.value } : prev
                  )
                }
                onBlur={handleOwnerNameBlur}
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
                untuk kirim saldo internal (fitur kirim sesama pengguna akan
                menggunakan nomor ini).
              </p>
            </div>
          </section>
        </section>

        {/* FORM PENGAJUAN + RIWAYAT */}
        <section className="nanad-dashboard-table-section">
          {/* Kolom kiri: pengajuan deposit & withdraw */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Pengajuan setoran &amp; penarikan</h3>
              <p>
                Ajukan deposit ke Dompet Nadnad atau penarikan ke rekening
                tujuan. Admin akan memproses secara manual.
              </p>
            </div>

            {/* Form deposit */}
            <form
              onSubmit={handleSubmitDeposit}
              className="nanad-dashboard-deposit-form"
              style={{ marginTop: "0.75rem" }}
            >
              <h4
                className="nanad-dashboard-stat-label"
                style={{ marginBottom: "0.35rem" }}
              >
                Pengajuan deposit ke Dompet Nadnad
              </h4>

              <label className="nanad-dashboard-deposit-amount">
                Nominal deposit
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="contoh: 100000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Rekening tujuan Dompet Nadnad / catatan transfer
                <input
                  type="text"
                  placeholder="contoh: BCA 123456 a.n. Nadnad, atau e-wallet, dll."
                  value={depositTarget}
                  onChange={(e) => setDepositTarget(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan untuk admin (opsional)
                <input
                  type="text"
                  placeholder="contoh: Setoran awal dompet bersama, atau lainnya"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={depositLoading}
              >
                {depositLoading
                  ? "Mengajukan deposit..."
                  : "Ajukan deposit"}
              </button>
            </form>

            {/* Form withdraw */}
            <form
              onSubmit={handleSubmitWithdraw}
              className="nanad-dashboard-deposit-form"
              style={{ marginTop: "1.2rem" }}
            >
              <h4
                className="nanad-dashboard-stat-label"
                style={{ marginBottom: "0.35rem" }}
              >
                Pengajuan penarikan dari Dompet Nadnad
              </h4>

              <label className="nanad-dashboard-deposit-amount">
                Nominal penarikan
                <input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="contoh: 150000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Bank / e-wallet tujuan
                  <input
                    type="text"
                    placeholder="contoh: BCA, BRI, Mandiri, Dana, OVO"
                    value={withdrawBankName}
                    onChange={(e) =>
                      setWithdrawBankName(e.target.value)
                    }
                  />
                </label>
                <label>
                  No. rekening / akun
                  <input
                    type="text"
                    placeholder="contoh: 1234567890"
                    value={withdrawBankAccount}
                    onChange={(e) =>
                      setWithdrawBankAccount(e.target.value)
                    }
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Atas nama (opsional)
                <input
                  type="text"
                  placeholder="contoh: Nadnad Official"
                  value={withdrawBankHolder}
                  onChange={(e) =>
                    setWithdrawBankHolder(e.target.value)
                  }
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan untuk admin (opsional)
                <input
                  type="text"
                  placeholder="contoh: Penarikan sebagian untuk kebutuhan X"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="nanad-dashboard-logout"
                disabled={withdrawLoading}
              >
                {withdrawLoading
                  ? "Mengajukan penarikan..."
                  : "Ajukan penarikan"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Catatan: semua pengajuan akan berstatus{" "}
                <strong>PENDING</strong> hingga admin memverifikasi dan
                mengubah status menjadi APPROVED / REJECTED.
              </p>
            </form>
          </div>

          {/* Kolom kanan: riwayat transaksi */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat transaksi Dompet Nadnad</h3>
              <p>
                Ringkasan pengajuan deposit, penarikan, atau penyesuaian
                (ADJUST) yang terkait dengan dompet ini.
              </p>
            </div>

            {transactions.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.8rem" }}
              >
                Belum ada transaksi tercatat untuk Dompet Nadnad ini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                <div className="nanad-dashboard-deposits-row">
                  <div>
                    <strong>Tanggal</strong>
                  </div>
                  <div>
                    <strong>Jenis</strong>
                  </div>
                  <div>
                    <strong>Nominal</strong>
                  </div>
                  <div>
                    <strong>Status</strong>
                  </div>
                  <div>
                    <strong>Aksi</strong>
                  </div>
                </div>

                {transactions.map((tx) => {
                  const typeLabel =
                    tx.type === "DEPOSIT"
                      ? "Deposit"
                      : tx.type === "WITHDRAW"
                      ? "Penarikan"
                      : tx.type || "-";

                  let statusLabel = tx.status || "-";
                  let statusColor = "#e5e7eb";

                  if (tx.status === "PENDING") {
                    statusLabel = "Pending";
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

                  return (
                    <div
                      key={tx.id}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>{formatDateTime(tx.created_at)}</div>
                      <div>{typeLabel}</div>
                      <div>{formatCurrency(tx.amount)}</div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: statusColor,
                          fontWeight: 500,
                        }}
                      >
                        {statusLabel}
                      </div>
                      <div>
                        <Link
                          href={`/wallet/receipt/${tx.id}`}
                          className="nanad-dashboard-logout"
                          style={{ fontSize: "0.76rem" }}
                        >
                          Lihat bukti
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. All rights
            reserved.
          </span>
          <span>
            Dompet Nadnad adalah ruang pencatatan &amp; simulasi alur dana
            pribadi. Dana nyata tetap berada di rekening resmi dan di luar
            aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
