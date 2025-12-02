
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

  // Deposit / Withdraw
  const [pendingTx, setPendingTx] = useState([]);
  const [adminNotes, setAdminNotes] = useState({});
  const [actionId, setActionId] = useState(null);

  // Transfer internal Dompet Nadnad
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferNotes, setTransferNotes] = useState({});
  const [transferActionId, setTransferActionId] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");

  // ================== LOAD DATA =======================

  // Ambil semua transaksi DEPOSIT / WITHDRAW yang masih PENDING
  const loadPendingTransactions = async () => {
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
      setErrorMsg("Gagal memuat transaksi pending (deposit/penarikan).");
      setPendingTx([]);
      setAdminNotes({});
      return;
    }

    setPendingTx(data || []);

    const prefill = {};
    (data || []).forEach((tx) => {
      if (tx.admin_note) prefill[tx.id] = tx.admin_note;
    });
    setAdminNotes(prefill);
  };

  // Ambil semua pengajuan transfer internal yang masih PENDING
  const loadPendingTransfers = async () => {
    const { data, error } = await supabase
      .from("wallet_internal_transfers")
      .select(
        "id, created_at, from_wallet_id, to_wallet_id, from_account_number, to_account_number, amount, status, user_note, admin_note"
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error load pending internal transfers:", error.message);
      setErrorMsg((prev) =>
        prev || "Gagal memuat pengajuan transfer antar Dompet Nadnad."
      );
      setPendingTransfers([]);
      setTransferNotes({});
      return;
    }

    setPendingTransfers(data || []);

    const prefill = {};
    (data || []).forEach((tr) => {
      if (tr.admin_note) prefill[tr.id] = tr.admin_note;
    });
    setTransferNotes(prefill);
  };

  const reloadAll = async () => {
    await loadPendingTransactions();
    await loadPendingTransfers();
  };

  // ================== INIT / CEK ADMIN =================

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
          router.push("/");
          return;
        }

        await reloadAll();
      } catch (err) {
        console.error("Admin init error:", err);
        setErrorMsg("Gagal memuat halaman admin.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ================== APPROVE / REJECT DEPOSIT/WITHDRAW =============

  const handleApprove = async (tx) => {
    if (
      !window.confirm(
        `Setujui pengajuan ${
          tx.type === "DEPOSIT" ? "DEPOSIT" : "PENARIKAN"
        } sebesar ${formatCurrency(tx.amount)}?`
      )
    ) {
      return;
    }

    setActionId(tx.id);
    const adminNote = (adminNotes[tx.id] || "").trim();

    try {
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

      let newBalance = w.balance ?? 0;

      if (tx.type === "DEPOSIT") {
        newBalance = newBalance + tx.amount;
      } else if (tx.type === "WITHDRAW") {
        if (newBalance < tx.amount) {
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

          await reloadAll();
          alert(
            "Saldo wallet tidak cukup. Pengajuan penarikan ditolak otomatis."
          );
          return;
        } else {
          newBalance = newBalance - tx.amount;
        }
      }

      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", w.id);

      if (updErr) {
        console.error("Update wallet error:", updErr.message);
        alert("Gagal memperbarui saldo wallet.");
        return;
      }

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

      await reloadAll();
      alert("Transaksi disetujui dan saldo telah diperbarui.");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Terjadi kesalahan saat menyetujui transaksi.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (tx) => {
    if (
      !window.confirm(
        `Tolak pengajuan ${
          tx.type === "DEPOSIT" ? "DEPOSIT" : "PENARIKAN"
        } sebesar ${formatCurrency(tx.amount)}?`
      )
    ) {
      return;
    }

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

      await reloadAll();
      alert("Transaksi berhasil ditolak.");
    } catch (err) {
      console.error("Reject error:", err);
      alert("Terjadi kesalahan saat menolak transaksi.");
    } finally {
      setActionId(null);
    }
  };

  // ================== APPROVE / REJECT TRANSFER INTERNAL =============

  const handleApproveTransfer = async (tr) => {
    if (
      !window.confirm(
        `Setujui pengajuan transfer antar Dompet Nadnad sebesar ${formatCurrency(
          tr.amount
        )}?\nSaldo wallet sumber akan berkurang dan saldo wallet tujuan akan bertambah.`
      )
    ) {
      return;
    }

    setTransferActionId(tr.id);
    const adminNote = (transferNotes[tr.id] || "").trim();

    try {
      const amount = Number(tr.amount) || 0;
      if (amount <= 0) {
        alert("Nominal transfer tidak valid.");
        return;
      }

      // Ambil wallet sumber & tujuan
      const { data: fromWallet, error: fromErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", tr.from_wallet_id)
        .single();

      if (fromErr || !fromWallet) {
        console.error("fromWallet not found:", fromErr?.message);
        alert("Wallet sumber tidak ditemukan.");
        return;
      }

      const { data: toWallet, error: toErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", tr.to_wallet_id)
        .single();

      if (toErr || !toWallet) {
        console.error("toWallet not found:", toErr?.message);
        alert("Wallet tujuan tidak ditemukan.");
        return;
      }

      const fromBefore = fromWallet.balance ?? 0;
      const toBefore = toWallet.balance ?? 0;

      if (fromBefore < amount) {
        const { error: updTrErr } = await supabase
          .from("wallet_internal_transfers")
          .update({
            status: "REJECTED",
            admin_note:
              (adminNote || "") +
              (adminNote ? " " : "") +
              "[Ditolak otomatis: saldo wallet sumber tidak mencukupi]",
          })
          .eq("id", tr.id);

        if (updTrErr) {
          console.error(
            "Update transfer to REJECTED (insufficient) error:",
            updTrErr.message
          );
        }

        await loadPendingTransfers();
        alert(
          "Saldo wallet sumber tidak cukup. Pengajuan transfer ditandai DITOLAK."
        );
        return;
      }

      const fromAfter = fromBefore - amount;
      const toAfter = toBefore + amount;

      // Update saldo kedua wallet
      const { error: updFrom } = await supabase
        .from("wallets")
        .update({ balance: fromAfter })
        .eq("id", fromWallet.id);

      if (updFrom) {
        console.error("Update fromWallet error:", updFrom.message);
        alert("Gagal memperbarui saldo wallet sumber.");
        return;
      }

      const { error: updTo } = await supabase
        .from("wallets")
        .update({ balance: toAfter })
        .eq("id", toWallet.id);

      if (updTo) {
        console.error("Update toWallet error:", updTo.message);
        alert("Gagal memperbarui saldo wallet tujuan.");
        return;
      }

      // Catat di wallet_transactions (type tetap DEPOSIT/WITHDRAW -> aman utk CHECK)
      const baseSystemNote = `Transfer internal Dompet Nadnad #${tr.id}`;
      const userNotePart = tr.user_note
        ? ` | Catatan pengguna: ${tr.user_note}`
        : "";
      const adminNotePart = adminNote ? ` | Catatan admin: ${adminNote}` : "";

      const outNote =
        `${baseSystemNote} · Saldo keluar ke ${tr.to_account_number}.` +
        userNotePart +
        adminNotePart;

      const inNote =
        `${baseSystemNote} · Saldo masuk dari ${tr.from_account_number}.` +
        userNotePart +
        adminNotePart;

      const { error: txErr } = await supabase.from("wallet_transactions").insert([
        {
          wallet_id: fromWallet.id,
          type: "WITHDRAW",
          amount: amount,
          balance_before: fromBefore,
          balance_after: fromAfter,
          status: "APPROVED",
          note: outNote,
          user_email: fromWallet.user_email || null,
          admin_note: adminNote || null,
        },
        {
          wallet_id: toWallet.id,
          type: "DEPOSIT",
          amount: amount,
          balance_before: toBefore,
          balance_after: toAfter,
          status: "APPROVED",
          note: inNote,
          user_email: toWallet.user_email || null,
          admin_note: adminNote || null,
        },
      ]);

      if (txErr) {
        console.error(
          "Insert wallet_transactions for transfer error:",
          txErr.message
        );
        alert(
          "Saldo kedua wallet sudah disesuaikan, tetapi gagal mencatat riwayat transaksi. Segera cek manual di database."
        );
      }

      // Update status transfer -> APPROVED
      const { error: updTr } = await supabase
        .from("wallet_internal_transfers")
        .update({
          status: "APPROVED",
          admin_note: adminNote || null,
        })
        .eq("id", tr.id);

      if (updTr) {
        console.error("Update transfer status error:", updTr.message);
        alert(
          "Transfer disetujui, tetapi gagal memperbarui status di tabel transfer. Cek manual di database."
        );
      }

      await loadPendingTransfers();
      alert(
        "Pengajuan transfer antar Dompet Nadnad disetujui. Saldo kedua dompet telah diperbarui."
      );
    } catch (err) {
      console.error("Approve transfer error:", err);
      alert("Terjadi kesalahan saat memproses persetujuan transfer.");
    } finally {
      setTransferActionId(null);
    }
  };

  const handleRejectTransfer = async (tr) => {
    if (
      !window.confirm(
        `Tolak pengajuan transfer antar Dompet Nadnad sebesar ${formatCurrency(
          tr.amount
        )}? Saldo kedua dompet tidak akan berubah.`
      )
    ) {
      return;
    }

    setTransferActionId(tr.id);
    const adminNote = (transferNotes[tr.id] || "").trim();

    try {
      const { error } = await supabase
        .from("wallet_internal_transfers")
        .update({
          status: "REJECTED",
          admin_note: adminNote || null,
        })
        .eq("id", tr.id);

      if (error) {
        console.error("Reject transfer error:", error.message);
        alert("Gagal mengubah status pengajuan transfer.");
        return;
      }

      await loadPendingTransfers();
      alert("Pengajuan transfer antar Dompet Nadnad berhasil ditolak.");
    } catch (err) {
      console.error("Reject transfer error:", err);
      alert("Terjadi kesalahan saat menolak pengajuan transfer.");
    } finally {
      setTransferActionId(null);
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
              <p className="nanad-dashboard-brand-title">Dompet Nadnad</p>
              <p className="nanad-dashboard-brand-sub">
                Admin · Approval dompet &amp; transfer
              </p>
            </div>
          </div>

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
            Persetujuan deposit, penarikan &amp; transfer internal.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini digunakan untuk menyetujui atau menolak pengajuan
            deposit, penarikan, serta transfer antar Dompet Nadnad. Saldo
            dompet hanya berubah ketika status pengajuan sudah{" "}
            <strong>APPROVED</strong>.
          </p>
          <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
            Gunakan kolom <strong>catatan admin</strong> untuk meninggalkan
            alasan singkat setiap kali menyetujui atau menolak, agar riwayat
            lebih jelas bagi pengguna.
          </p>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.4rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* ====== SECTION 1: DEPOSIT / WITHDRAW ====== */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Transaksi pending: Deposit &amp; Penarikan</h3>
              <p>Maksimal 50 pengajuan terbaru yang masih menunggu.</p>
            </div>

            {pendingTx.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada transaksi deposit/penarikan berstatus PENDING.
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

                    {/* Tengah: detail + catatan */}
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

                      {/* Catatan admin untuk aksi ini */}
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

        {/* ====== SECTION 2: TRANSFER INTERNAL ====== */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Pengajuan transfer antar Dompet Nadnad</h3>
              <p>
                Transfer internal yang masih berstatus{" "}
                <strong>PENDING</strong>. Saldo dompet sumber &amp; tujuan hanya
                berubah setelah pengajuan disetujui.
              </p>
            </div>

            {pendingTransfers.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada pengajuan transfer internal berstatus PENDING.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {pendingTransfers.map((tr) => (
                  <div key={tr.id} className="nanad-dashboard-deposits-row">
                    {/* Kiri: waktu + status */}
                    <div>
                      {new Date(tr.created_at).toLocaleString("id-ID")}
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#facc15",
                        }}
                      >
                        PENDING TRANSFER
                      </span>
                    </div>

                    {/* Tengah: detail transfer */}
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        Transfer {formatCurrency(tr.amount)}
                      </span>
                      <br />
                      <small>
                        Dari Dompet Nadnad: {tr.from_account_number}
                        <br />
                        Ke Dompet Nadnad: {tr.to_account_number}
                      </small>

                      {tr.user_note && (
                        <>
                          <br />
                          <small>
                            <strong>Catatan pengguna:</strong> {tr.user_note}
                          </small>
                        </>
                      )}

                      {tr.admin_note && (
                        <>
                          <br />
                          <small>
                            <strong>Catatan admin (sebelumnya):</strong>{" "}
                            {tr.admin_note}
                          </small>
                        </>
                      )}

                      {/* Catatan admin untuk aksi ini */}
                      <div style={{ marginTop: "0.5rem" }}>
                        <small style={{ display: "block", marginBottom: 4 }}>
                          Catatan admin (opsional, ikut disimpan saat Terima /
                          Tolak):
                        </small>
                        <textarea
                          value={transferNotes[tr.id] || ""}
                          onChange={(e) =>
                            setTransferNotes((prev) => ({
                              ...prev,
                              [tr.id]: e.target.value,
                            }))
                          }
                          placeholder="contoh: iuran arisan bulan ini · atau: diminta klarifikasi tujuan transfer."
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
                        disabled={transferActionId === tr.id}
                        className="nanad-dashboard-deposit-submit"
                        onClick={() => handleApproveTransfer(tr)}
                      >
                        {transferActionId === tr.id
                          ? "Memproses..."
                          : "Terima transfer"}
                      </button>
                      <button
                        type="button"
                        disabled={transferActionId === tr.id}
                        className="nanad-dashboard-logout"
                        onClick={() => handleRejectTransfer(tr)}
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
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Fitur approval ini ditujukan untuk mengelola alur dompet internal.
            Untuk pengelolaan dana nyata tetap diperlukan infrastruktur dan
            pengawasan sesuai regulasi yang berlaku.
          </span>
        </footer>
      </div>
    </main>
  );
}
