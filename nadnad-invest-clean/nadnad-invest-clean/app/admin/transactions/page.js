// app/admin/transactions/page.js
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

// 🔐 HANYA email di daftar ini yang boleh buka halaman admin
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

export default function AdminTransactionsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pendingTx, setPendingTx] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionId, setActionId] = useState(null);

  // Catatan admin per transaksi (state lokal di UI, key = tx.id)
  const [adminNotes, setAdminNotes] = useState({});

  // Ambil semua transaksi PENDING
  const loadPending = async () => {
    setErrorMsg("");

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(
        "id, created_at, type, amount, status, note, wallet_id, withdraw_bank_name, withdraw_bank_account, withdraw_bank_holder, deposit_target, proof_image_url, sender_name, user_email, user_note, admin_note"
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error load pending tx:", error.message);
      setErrorMsg("Gagal memuat transaksi pending.");
      return;
    }

    setPendingTx(data || []);

    // Prefill adminNotes dari admin_note yang sudah ada (kalau ada)
    const prefill = {};
    (data || []).forEach((tx) => {
      if (tx.admin_note) prefill[tx.id] = tx.admin_note;
    });
    setAdminNotes(prefill);
  };

  // Inisialisasi halaman admin + cek akses
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

        // Belum login -> ke /login
        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // 🔐 Cek: kalau email TIDAK ada di ADMIN_EMAILS -> balikin ke dashboard
        if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          router.push("/");
          return;
        }

        // Kalau lolos, load transaksi pending
        await loadPending();
      } catch (err) {
        console.error("Admin init error:", err);
        setErrorMsg("Gagal memuat halaman admin.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // APPROVE transaksi
  const handleApprove = async (tx) => {
    setActionId(tx.id);
    const adminNote = (adminNotes[tx.id] || "").trim();

    try {
      // Ambil wallet terbaru
      const { data: w, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", tx.wallet_id)
        .single();

      if (wErr || !w) {
        console.error("Wallet not found:", wErr?.message);
        alert("Wallet tidak ditemukan.");
        return;
      }

      let newBalance = w.balance;

      if (tx.type === "DEPOSIT") {
        newBalance = w.balance + tx.amount;
      } else if (tx.type === "WITHDRAW") {
        if (w.balance < tx.amount) {
          // saldo tidak cukup: otomatis REJECTED
          const autoNote =
            (tx.note || "") +
            " | Ditolak saat approval: saldo tidak mencukupi." +
            (adminNote ? ` | Catatan admin: ${adminNote}` : "");

          await supabase
            .from("wallet_transactions")
            .update({
              status: "REJECTED",
              note: autoNote,
              admin_note: adminNote || null,
            })
            .eq("id", tx.id);

          await loadPending();
          alert("Saldo tidak cukup. Pengajuan ditolak otomatis.");
          return;
        } else {
          newBalance = w.balance - tx.amount;
        }
      }

      // Update saldo wallet
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", w.id);

      if (updErr) {
        console.error("Update wallet error:", updErr.message);
        alert("Gagal memperbarui saldo wallet.");
        return;
      }

      // Update transaksi -> APPROVED
      const finalNote =
        (tx.note || "") +
        " | Disetujui admin." +
        (adminNote ? ` | Catatan admin: ${adminNote}` : "");

      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .update({
          status: "APPROVED",
          balance_before: w.balance,
          balance_after: newBalance,
          note: finalNote,
          admin_note: adminNote || null,
        })
        .eq("id", tx.id);

      if (txErr) {
        console.error("Update tx error:", txErr.message);
        alert("Gagal memperbarui status transaksi.");
        return;
      }

      await loadPending();
      alert("Transaksi disetujui dan saldo telah diperbarui.");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Terjadi kesalahan saat menyetujui transaksi.");
    } finally {
      setActionId(null);
    }
  };

  // REJECT transaksi
  const handleReject = async (tx) => {
    setActionId(tx.id);
    const adminNote = (adminNotes[tx.id] || "").trim();

    try {
      const finalNote =
        (tx.note || "") +
        " | Ditolak admin." +
        (adminNote ? ` | Catatan admin: ${adminNote}` : "");

      const { error } = await supabase
        .from("wallet_transactions")
        .update({
          status: "REJECTED",
          note: finalNote,
          admin_note: adminNote || null,
        })
        .eq("id", tx.id);

      if (error) {
        console.error("Reject error:", error.message);
        alert("Gagal mengubah status transaksi.");
        return;
      }

      await loadPending();
      alert("Transaksi berhasil ditolak.");
    } catch (err) {
      console.error("Reject error:", err);
      alert("Terjadi kesalahan saat menolak transaksi.");
    } finally {
      setActionId(null);
    }
  };

  // ================== RENDER ===========================
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman admin transaksi...
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
                Admin · Approval dompet
              </p>
            </div>
          </div>

          {/* Tombol-tombol kanan */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/admin/wallets")}
            >
              Edit saldo dompet
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

        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Wallet approvals</p>
          <h1 className="nanad-dashboard-heading">
            Persetujuan deposit &amp; penarikan.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini digunakan untuk menyetujui atau menolak pengajuan
            deposit dan penarikan. Saldo dompet hanya berubah ketika transaksi
            berstatus <strong>APPROVED</strong>.
          </p>
          <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
            Gunakan kolom <strong>catatan admin</strong> untuk meninggalkan
            alasan singkat setiap kali menyetujui atau menolak, agar riwayat
            lebih jelas bagi pengguna.
          </p>
        </section>

        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Transaksi pending</h3>
              <p>Maksimal 50 pengajuan terbaru yang masih menunggu.</p>
            </div>

            {errorMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.5rem" }}
              >
                {errorMsg}
              </p>
            )}

            {pendingTx.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada transaksi berstatus PENDING.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {pendingTx.map((tx) => (
                  <div key={tx.id} className="nanad-dashboard-deposits-row">
                    {/* Kolom kiri: waktu + status */}
                    <div>
                      {new Date(tx.created_at).toLocaleString("id-ID")}
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#facc15",
                        }}
                      >
                        PENDING
                      </span>
                    </div>

                    {/* Tengah: detail transaksi + catatan */}
                    <div>
                      {tx.type === "DEPOSIT" ? "Deposit" : "Penarikan"}{" "}
                      {formatCurrency(tx.amount)}

                      {tx.user_email && (
                        <>
                          <br />
                          <small>Akun: {tx.user_email}</small>
                        </>
                      )}

                      {tx.sender_name && (
                        <>
                          <br />
                          <small>Atas nama pengirim: {tx.sender_name}</small>
                        </>
                      )}

                      {tx.type === "DEPOSIT" && tx.deposit_target && (
                        <>
                          <br />
                          <small>Rekening tujuan: {tx.deposit_target}</small>
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

                      {tx.proof_image_url && (
                        <>
                          <br />
                          <a
                            href={tx.proof_image_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "0.75rem",
                              textDecoration: "underline",
                            }}
                          >
                            Lihat bukti transfer
                          </a>
                        </>
                      )}

                      {tx.user_note && (
                        <>
                          <br />
                          <small>
                            <strong>Catatan pengguna:</strong> {tx.user_note}
                          </small>
                        </>
                      )}

                      {tx.admin_note && (
                        <>
                          <br />
                          <small>
                            <strong>Catatan admin (sebelumnya):</strong>{" "}
                            {tx.admin_note}
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

                      {/* Textarea catatan admin untuk tindakan ini */}
                      <div style={{ marginTop: "0.5rem" }}>
                        <small style={{ display: "block", marginBottom: 4 }}>
                          Catatan admin (opsional, ikut disimpan saat Terima /
                          Tolak):
                        </small>
                        <textarea
                          value={adminNotes[tx.id] || ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [tx.id]: e.target.value,
                            }))
                          }
                          placeholder="contoh: mutasi sudah masuk, bukti jelas · atau: data rekening kurang jelas, diminta perbaikan."
                          style={{
                            width: "100%",
                            minHeight: "70px",
                            fontSize: "0.8rem",
                            borderRadius: "16px",
                            padding: "0.4rem 0.6rem",
                            border:
                              "1px solid rgba(248, 250, 252, 0.16)",
                            background:
                              "radial-gradient(circle at top, rgba(15,23,42,1), rgba(15,23,42,0.9))",
                          }}
                        />
                      </div>
                    </div>

                    {/* Kanan: tombol aksi */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        type="button"
                        disabled={actionId === tx.id}
                        className="nanad-dashboard-deposit-submit"
                        onClick={() => handleApprove(tx)}
                      >
                        {actionId === tx.id ? "Memproses..." : "Terima"}
                      </button>
                      <button
                        type="button"
                        disabled={actionId === tx.id}
                        className="nanad-dashboard-logout"
                        onClick={() => handleReject(tx)}
                      >
                        Tolak
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
            Fitur approval ini ditujukan untuk simulasi alur operasional.
            Untuk pengelolaan dana nyata, tetap diperlukan infrastruktur dan
            pengawasan yang sesuai regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
