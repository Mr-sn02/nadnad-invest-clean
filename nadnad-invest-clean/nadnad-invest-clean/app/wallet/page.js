// app/wallet/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";

// 🔐 Daftar email admin (sementara, sampai pakai role di DB)
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// 🧮 Buat nomor "Dompet Nadnad" 8 digit yang unik
async function generateUniqueAccountNumber() {
  // coba maksimal 5x
  for (let i = 0; i < 5; i++) {
    const num = Math.floor(10000000 + Math.random() * 90000000).toString();

    const { data, error } = await supabase
      .from("wallets")
      .select("id")
      .eq("account_number", num)
      .maybeSingle();

    if (!error && !data) {
      return num; // belum dipakai
    }
  }

  throw new Error("Gagal membuat nomor Dompet Nadnad yang unik.");
}

export default function WalletPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  // form deposit
  const [depAmount, setDepAmount] = useState("");
  const [depTarget, setDepTarget] = useState("");
  const [depSenderName, setDepSenderName] = useState("");
  const [depNote, setDepNote] = useState("");
  const [depSubmitting, setDepSubmitting] = useState(false);

  // form withdraw
  const [wdAmount, setWdAmount] = useState("");
  const [wdBankName, setWdBankName] = useState("");
  const [wdBankAccount, setWdBankAccount] = useState("");
  const [wdBankHolder, setWdBankHolder] = useState("");
  const [wdNote, setWdNote] = useState("");
  const [wdSubmitting, setWdSubmitting] = useState(false);

  // ambil riwayat transaksi
  const loadTransactions = async (walletId) => {
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Load transactions error:", error.message);
        return;
      }

      setTransactions(data || []);
    } catch (err) {
      console.error("Unexpected load transactions error:", err);
    } finally {
      setTxLoading(false);
    }
  };

  // init: cek user + ambil/buat dompet
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");

      try {
        // 1) cek user login
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) {
          console.error("getUser error:", userErr.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // 2) cari dompet milik user
        const { data: existing, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setError("Gagal memuat dompet.");
          return;
        }

        // 3a) kalau BELUM ada dompet → buat baru
        if (!existing) {
          const accountNumber = await generateUniqueAccountNumber();
          const defaultName =
            user.email?.split("@")[0] || "Pengguna Dompet Nadnad";

          const { data: newWallet, error: insertErr } = await supabase
            .from("wallets")
            .insert({
              user_id: user.id,
              balance: 0,
              owner_name: defaultName,
              account_number: accountNumber,
            })
            .select("*")
            .single();

          if (insertErr) {
            console.error("Create wallet error:", insertErr.message);
            setError("Gagal membuat dompet baru.");
            return;
          }

          setWallet(newWallet);
          await loadTransactions(newWallet.id);
        } else {
          // 3b) sudah ada dompet → pastikan punya nomor rekening
          let updatedWallet = existing;

          if (!existing.account_number) {
            try {
              const accountNumber = await generateUniqueAccountNumber();
              const { data: updated, error: updErr } = await supabase
                .from("wallets")
                .update({ account_number: accountNumber })
                .eq("id", existing.id)
                .select("*")
                .single();

              if (updErr) {
                console.error(
                  "Update wallet account_number error:",
                  updErr.message
                );
              } else {
                updatedWallet = updated;
              }
            } catch (genErr) {
              console.error("Generate account_number error:", genErr);
            }
          }

          setWallet(updatedWallet);
          await loadTransactions(updatedWallet.id);
        }
      } catch (err) {
        console.error("Wallet init error:", err);
        setError("Terjadi kesalahan saat memuat dompet.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const isAdmin =
    user && user.email && ADMIN_EMAILS.includes(user.email);

  // logout kecil di header
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Gagal logout. Coba lagi.");
    }
  };

  // 👉 simpan nama pengguna (owner_name) saat blur
  const handleOwnerNameBlur = async (newName) => {
    if (!wallet) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === wallet.owner_name) return;

    try {
      const { data, error } = await supabase
        .from("wallets")
        .update({ owner_name: trimmed })
        .eq("id", wallet.id)
        .select("*")
        .single();

      if (error) {
        console.error("Update owner_name error:", error.message);
        alert("Gagal menyimpan nama pengguna dompet.");
        return;
      }

      setWallet(data);
    } catch (err) {
      console.error("Unexpected owner_name error:", err);
      alert("Terjadi kesalahan saat menyimpan nama pengguna dompet.");
    }
  };

  // 👉 pengajuan DEPOSIT (status PENDING, saldo BELUM berubah)
  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(depAmount);
    if (!amount || amount <= 0) {
      alert("Nominal deposit harus lebih besar dari 0.");
      return;
    }

    try {
      setDepSubmitting(true);

      const { data, error } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          user_email: user.email,
          type: "DEPOSIT",
          status: "PENDING",
          amount,
          deposit_target: depTarget.trim() || null,
          sender_name: depSenderName.trim() || null,
          user_note: depNote.trim() || null,
          note: "Pengajuan deposit via dashboard Dompet Nadnad.",
        })
        .select("*")
        .single();

      if (error) {
        console.error("Create deposit tx error:", error.message);
        alert("Gagal mengirim pengajuan deposit. Coba lagi.");
        return;
      }

      setDepAmount("");
      setDepTarget("");
      setDepSenderName("");
      setDepNote("");

      await loadTransactions(wallet.id);

      alert(
        `Pengajuan deposit berhasil dikirim.\n\nNominal: ${formatCurrency(
          amount
        )}\nStatus: PENDING (menunggu review admin).`
      );
    } catch (err) {
      console.error("Unexpected deposit error:", err);
      alert("Terjadi kesalahan saat mengirim pengajuan deposit.");
    } finally {
      setDepSubmitting(false);
    }
  };

  // 👉 pengajuan WITHDRAW (status PENDING, saldo BELUM berkurang)
  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const amount = Number(wdAmount);
    if (!amount || amount <= 0) {
      alert("Nominal penarikan harus lebih besar dari 0.");
      return;
    }

    if (amount > (wallet.balance || 0)) {
      const ok = confirm(
        "Nominal penarikan melebihi saldo di Dompet Nadnad.\n\nTetap kirim pengajuan? (Admin akan mengecek manual sebelum menyetujui.)"
      );
      if (!ok) return;
    }

    if (!wdBankName.trim() || !wdBankAccount.trim() || !wdBankHolder.trim()) {
      alert("Nama bank/e-wallet, nomor, dan atas nama wajib diisi.");
      return;
    }

    try {
      setWdSubmitting(true);

      const { data, error } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          user_email: user.email,
          type: "WITHDRAW",
          status: "PENDING",
          amount,
          withdraw_bank_name: wdBankName.trim(),
          withdraw_bank_account: wdBankAccount.trim(),
          withdraw_bank_holder: wdBankHolder.trim(),
          user_note: wdNote.trim() || null,
          note: "Pengajuan penarikan via dashboard Dompet Nadnad.",
        })
        .select("*")
        .single();

      if (error) {
        console.error("Create withdraw tx error:", error.message);
        alert("Gagal mengirim pengajuan penarikan. Coba lagi.");
        return;
      }

      setWdAmount("");
      setWdBankName("");
      setWdBankAccount("");
      setWdBankHolder("");
      setWdNote("");

      await loadTransactions(wallet.id);

      alert(
        `Pengajuan penarikan berhasil dikirim.\n\nNominal: ${formatCurrency(
          amount
        )}\nStatus: PENDING (menunggu review admin).`
      );
    } catch (err) {
      console.error("Unexpected withdraw error:", err);
      alert("Terjadi kesalahan saat mengirim pengajuan penarikan.");
    } finally {
      setWdSubmitting(false);
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

  if (error || !wallet) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Wallet error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat Dompet Nadnad.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {error || "Dompet tidak ditemukan."}
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
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Pencatatan setoran &amp; penarikan saldo
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
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/promo/balance-boost")}
            >
              Promo &amp; Event
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={handleLogout}
            >
              Keluar
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
            Admin akan meninjau secara manual sebelum saldo diperbarui.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet</p>
              <p className="nanad-dashboard-stat-number">
                {formatCurrency(wallet.balance || 0)}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Saldo ini adalah hasil setoran &amp; penarikan{" "}
                <strong>yang sudah disetujui admin.</strong>
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun terhubung</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Gunakan email ini untuk login ke Dompet Nadnad.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Peran</p>
              <p className="nanad-dashboard-stat-number">
                {isAdmin ? "Admin & Member" : "Member"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Admin dapat menyetujui pengajuan dan mengatur saldo dompet
                anggota secara terkontrol.
              </p>
            </div>
          </div>

          {/* Info pemilik & nomor rekening Dompet Nadnad */}
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
            <div style={{ marginBottom: "0.6rem" }}>
              <div style={{ opacity: 0.8 }}>Nama pengguna Dompet Nadnad</div>
              <input
                type="text"
                value={wallet.owner_name || ""}
                onChange={(e) =>
                  setWallet((prev) =>
                    prev ? { ...prev, owner_name: e.target.value } : prev
                  )
                }
                onBlur={(e) => handleOwnerNameBlur(e.target.value)}
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
                {wallet.account_number || "— belum tersedia —"}
              </div>
              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.75rem", marginTop: "0.35rem" }}
              >
                Nomor ini nanti bisa digunakan untuk kirim saldo sesama pengguna
                Dompet Nadnad (fitur kirim internal bisa ditambahkan di tahap
                berikutnya).
              </p>
            </div>
          </section>
        </section>

        {/* FORM DEPOSIT & WITHDRAW + RIWAYAT */}
        <section className="nanad-dashboard-table-section">
          {/* Form deposit */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan deposit ke Dompet Nadnad</h3>
              <p>
                Isi nominal yang ingin kamu setorkan. Setelah transfer nyata di
                rekening / e-wallet, kirim pengajuan agar admin bisa
                mencocokkan dan memperbarui saldo.
              </p>
            </div>

            <form
              onSubmit={handleSubmitDeposit}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal deposit
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="contoh: 250000"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Rekening / e-wallet tujuan (Nanad)
                  <input
                    type="text"
                    placeholder="contoh: BCA 1234xxxx a.n. Nadnad"
                    value={depTarget}
                    onChange={(e) => setDepTarget(e.target.value)}
                  />
                </label>
                <label>
                  Atas nama pengirim
                  <input
                    type="text"
                    placeholder="Nama di rekening kamu"
                    value={depSenderName}
                    onChange={(e) => setDepSenderName(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Catatan tambahan (opsional)
                <input
                  type="text"
                  placeholder="contoh: setor via m-banking, paket event, dsb."
                  value={depNote}
                  onChange={(e) => setDepNote(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={depSubmitting}
                className="nanad-dashboard-deposit-submit"
              >
                {depSubmitting ? "Mengirim pengajuan..." : "Kirim pengajuan deposit"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Saldo <strong>belum</strong> bertambah sampai admin
                menyetujui pengajuanmu dan mencocokkan dengan bukti transfer
                nyata.
              </p>
            </form>
          </div>

          {/* Form withdraw */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ajukan penarikan dari Dompet Nadnad</h3>
              <p>
                Ajukan penarikan ke rekening / e-wallet kamu. Admin akan
                mengecek saldo dan mengirim dana manual sebelum menandai
                pengajuan sebagai selesai.
              </p>
            </div>

            <form
              onSubmit={handleSubmitWithdraw}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal penarikan
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="contoh: 200000"
                  value={wdAmount}
                  onChange={(e) => setWdAmount(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Bank / e-wallet tujuan
                  <input
                    type="text"
                    placeholder="contoh: BCA, BRI, DANA, OVO"
                    value={wdBankName}
                    onChange={(e) => setWdBankName(e.target.value)}
                  />
                </label>
                <label>
                  Nomor rekening / e-wallet
                  <input
                    type="text"
                    placeholder="nomor tujuan penarikan"
                    value={wdBankAccount}
                    onChange={(e) => setWdBankAccount(e.target.value)}
                  />
                </label>
              </div>

              <label className="nanad-dashboard-deposit-amount">
                Atas nama penerima
                <input
                  type="text"
                  placeholder="Nama di rekening / e-wallet"
                  value={wdBankHolder}
                  onChange={(e) => setWdBankHolder(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan tambahan (opsional)
                <input
                  type="text"
                  placeholder="contoh: tarik untuk kebutuhan A, event B, dll."
                  value={wdNote}
                  onChange={(e) => setWdNote(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={wdSubmitting}
                className="nanad-dashboard-logout"
              >
                {wdSubmitting ? "Mengirim pengajuan..." : "Kirim pengajuan penarikan"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Saldo <strong>belum</strong> berkurang sampai admin
                memproses pengiriman dana dan menyetujui pengajuan ini.
              </p>
            </form>
          </div>
        </section>

        {/* RIWAYAT TRANSAKSI */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat pengajuan &amp; transaksi dompet</h3>
              <p>
                Menampilkan pengajuan deposit, penarikan, dan penyesuaian saldo
                (ADJUST) yang tercatat di Dompet Nadnad kamu.
              </p>
            </div>

            {txLoading ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Memuat riwayat transaksi...
              </p>
            ) : transactions.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada transaksi tercatat di Dompet Nadnad ini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {transactions.map((tx) => {
                  const typeLabel =
                    tx.type === "DEPOSIT"
                      ? "Deposit"
                      : tx.type === "WITHDRAW"
                      ? "Penarikan"
                      : tx.type === "ADJUST"
                      ? "Penyesuaian"
                      : tx.type || "-";

                  let statusColor = "#e5e7eb";
                  let statusLabel = tx.status || "-";

                  if (tx.status === "PENDING") {
                    statusColor = "#facc15";
                    statusLabel = "PENDING";
                  } else if (
                    tx.status === "APPROVED" ||
                    tx.status === "COMPLETED"
                  ) {
                    statusColor = "#4ade80";
                    statusLabel = "SELESAI";
                  } else if (tx.status === "REJECTED") {
                    statusColor = "#f87171";
                    statusLabel = "DITOLAK";
                  }

                  const dateLabel = tx.created_at
                    ? new Date(tx.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <div key={tx.id} className="nanad-dashboard-deposits-row">
                      <div>
                        <strong>{typeLabel}</strong>
                        <br />
                        <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>
                          {dateLabel}
                        </span>
                      </div>
                      <div>
                        <div>{formatCurrency(tx.amount)}</div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: statusColor,
                            marginTop: "0.15rem",
                          }}
                        >
                          {statusLabel}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.8rem" }}>
                          {tx.user_note ||
                            tx.note ||
                            "— tidak ada catatan khusus —"}
                        </div>
                        <Link
                          href={`/wallet/receipt/${tx.id}`}
                          style={{
                            fontSize: "0.78rem",
                            textDecoration: "underline",
                            marginTop: "0.3rem",
                            display: "inline-block",
                          }}
                        >
                          Lihat bukti transaksi
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
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Dompet Nadnad berfungsi sebagai ruang pencatatan &amp; perencanaan
            dana. Saldo resmi tetap mengacu pada mutasi rekening bank / e-wallet
            masing-masing pengguna.
          </span>
        </footer>
      </div>
    </main>
  );
}
