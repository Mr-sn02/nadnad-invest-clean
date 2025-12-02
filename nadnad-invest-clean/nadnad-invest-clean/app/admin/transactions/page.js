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

  // ----- PENDING DEPOSIT / WITHDRAW -----
  const [pendingTx, setPendingTx] = useState([]);
  const [txErrorMsg, setTxErrorMsg] = useState("");
  const [actionId, setActionId] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});

  // ----- PENDING TRANSFER ANTAR DOMPET -----
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [transferErrorMsg, setTransferErrorMsg] = useState("");
  const [transferActionId, setTransferActionId] = useState(null);
  const [transferNotes, setTransferNotes] = useState({});
  const [transferWalletMap, setTransferWalletMap] = useState({});

  // ================== LOAD DATA =====================

  // Ambil semua transaksi PENDING (DEPOSIT + WITHDRAW)
  const loadPendingWalletTx = async () => {
    setTxErrorMsg("");

    const { data, error } = await supabase
      .from("wallet_transactions")
      .select(
        "id, created_at, type, amount, status, note, wallet_id, withdraw_bank_name, withdraw_bank_account, withdraw_bank_holder, deposit_target, proof_image_url, sender_name, user_email, user_note, admin_note"
      )
      .eq("status", "PENDING")
      // abaikan tipe TRANSFER_* kalau suatu saat ada
      .not("type", "in", "(TRANSFER_OUT,TRANSFER_IN)")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error load pending wallet tx:", error.message);
      setTxErrorMsg("Gagal memuat transaksi deposit/penarikan pending.");
      return;
    }

    setPendingTx(data || []);

    const prefill = {};
    (data || []).forEach((tx) => {
      if (tx.admin_note) prefill[tx.id] = tx.admin_note;
    });
    setAdminNotes(prefill);
  };

  // Ambil semua pengajuan transfer antar dompet yang masih PENDING
  const loadPendingTransfers = async () => {
    setTransferErrorMsg("");

    const { data, error } = await supabase
      .from("wallet_internal_transfers")
      .select(
        "id, from_wallet_id, to_wallet_id, amount, status, user_note, admin_note, created_at"
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error load pending internal transfers:", error.message);
      setTransferErrorMsg("Gagal memuat pengajuan transfer antar Dompet Nadnad.");
      return;
    }

    const rows = data || [];
    setPendingTransfers(rows);

    const notePrefill = {};
    rows.forEach((t) => {
      if (t.admin_note) notePrefill[t.id] = t.admin_note;
    });
    setTransferNotes(notePrefill);

    // ambil data dompet terkait untuk ditampilkan (email, nama, saldo)
    const walletIds = Array.from(
      new Set(
        rows
          .flatMap((t) => [t.from_wallet_id, t.to_wallet_id])
          .filter(Boolean)
      )
    );

    if (walletIds.length === 0) {
      setTransferWalletMap({});
      return;
    }

    const { data: wallets, error: wErr } = await supabase
      .from("wallets")
      .select("id, user_email, owner_name, account_number, balance")
      .in("id", walletIds);

    if (wErr) {
      console.error("Error load wallets for transfers:", wErr.message);
      // tidak fatal untuk UI, cukup kosongkan map
      setTransferWalletMap({});
      return;
    }

    const map = {};
    (wallets || []).forEach((w) => {
      map[w.id] = w;
    });
    setTransferWalletMap(map);
  };

  const reloadAll = async () => {
    await Promise.all([loadPendingWalletTx(), loadPendingTransfers()]);
  };

  // Inisialisasi halaman admin + cek akses
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setTxErrorMsg("");
      setTransferErrorMsg("");

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
        setTxErrorMsg("Gagal memuat halaman admin.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  // ================== APPROVE / REJECT DEPOSIT & WITHDRAW =====================

  const handleApprove = async (tx) => {
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
        newBalance = (w.balance ?? 0) + tx.amount;
      } else if (tx.type === "WITHDRAW") {
        if ((w.balance ?? 0) < tx.amount) {
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

          await loadPendingWalletTx();
          alert("Saldo tidak cukup. Pengajuan ditolak otomatis.");
          return;
        } else {
          newBalance = (w.balance ?? 0) - tx.amount;
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
          balance_before: w.balance ?? 0,
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

      await loadPendingWalletTx();
      alert("Transaksi disetujui dan saldo telah diperbarui.");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Terjadi kesalahan saat menyetujui transaksi.");
    } finally {
      setActionId(null);
    }
  };

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

      await loadPendingWalletTx();
      alert("Transaksi berhasil ditolak.");
    } catch (err) {
      console.error("Reject error:", err);
      alert("Terjadi kesalahan saat menolak transaksi.");
    } finally {
      setActionId(null);
    }
  };

  // ================== APPROVE / REJECT TRANSFER ANTAR DOMPET =====================

  const handleApproveTransfer = async (tr) => {
    setTransferActionId(tr.id);
    const adminNote = (transferNotes[tr.id] || "").trim();

    try {
      // Ambil dompet sumber & tujuan versi terbaru
      const { data: fromWallet, error: fromErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", tr.from_wallet_id)
        .single();

      if (fromErr || !fromWallet) {
        console.error("fromWallet not found:", fromErr?.message);
        alert("Dompet sumber tidak ditemukan.");
        return;
      }

      const { data: toWallet, error: toErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", tr.to_wallet_id)
        .single();

      if (toErr || !toWallet) {
        console.error("toWallet not found:", toErr?.message);
        alert("Dompet tujuan tidak ditemukan.");
        return;
      }

      const fromBalance = fromWallet.balance ?? 0;
      const toBalance = toWallet.balance ?? 0;
      const amount = Number(tr.amount) || 0;

      if (amount <= 0) {
        alert("Nominal transfer tidak valid.");
        return;
      }

      if (fromBalance < amount) {
        // saldo kurang → tandai REJECTED
        const reason = "Ditolak saat approval: saldo dompet sumber tidak mencukupi.";
        const mergedNote = reason + (adminNote ? ` | ${adminNote}` : "");

        const { error: trErr } = await supabase
          .from("wallet_internal_transfers")
          .update({
            status: "REJECTED",
            admin_note: mergedNote,
            processed_at: new Date().toISOString(),
          })
          .eq("id", tr.id);

        if (trErr) {
          console.error("Update transfer rejected error:", trErr.message);
          alert("Gagal mengubah status transfer.");
          return;
        }

        // coba update wallet_transactions (TRANSFER_OUT) jadi REJECTED kalau ada
        try {
          const { data: outTx, error: outErr } = await supabase
            .from("wallet_transactions")
            .select("id, note")
            .eq("wallet_id", tr.from_wallet_id)
            .eq("type", "TRANSFER_OUT")
            .eq("status", "PENDING")
            .eq("amount", amount)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (!outErr && outTx) {
            await supabase
              .from("wallet_transactions")
              .update({
                status: "REJECTED",
                note:
                  (outTx.note || "") +
                  " | Transfer antar dompet ditolak: saldo tidak cukup.",
                admin_note: mergedNote,
              })
              .eq("id", outTx.id);
          }
        } catch (e2) {
          console.error(
            "Gagal meng-update riwayat transaksi transfer (reject):",
            e2
          );
        }

        await loadPendingTransfers();
        alert("Saldo dompet sumber tidak cukup. Transfer ditolak.");
        return;
      }

      const newFromBalance = fromBalance - amount;
      const newToBalance = toBalance + amount;

      // Update saldo dompet sumber
      const { error: updFromErr } = await supabase
        .from("wallets")
        .update({ balance: newFromBalance })
        .eq("id", fromWallet.id);

      if (updFromErr) {
        console.error("Update fromWallet error:", updFromErr.message);
        alert("Gagal memperbarui saldo dompet sumber.");
        return;
      }

      // Update saldo dompet tujuan
      const { error: updToErr } = await supabase
        .from("wallets")
        .update({ balance: newToBalance })
        .eq("id", toWallet.id);

      if (updToErr) {
        console.error("Update toWallet error:", updToErr.message);
        alert("Gagal memperbarui saldo dompet tujuan.");
        return;
      }

      // Update status di wallet_internal_transfers
      const { error: trErr } = await supabase
        .from("wallet_internal_transfers")
        .update({
          status: "APPROVED",
          admin_note: adminNote || null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", tr.id);

      if (trErr) {
        console.error("Update internal transfer error:", trErr.message);
        alert("Gagal mengubah status transfer.");
        return;
      }

      // Coba sinkronkan ke wallet_transactions (jika kolom & tipe sudah diizinkan)
      try {
        // update baris TRANSFER_OUT yang PENDING (kalau ada)
        const { data: outTx, error: outErr } = await supabase
          .from("wallet_transactions")
          .select("id, note")
          .eq("wallet_id", tr.from_wallet_id)
          .eq("type", "TRANSFER_OUT")
          .eq("status", "PENDING")
          .eq("amount", amount)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!outErr && outTx) {
          await supabase
            .from("wallet_transactions")
            .update({
              status: "APPROVED",
              balance_before: fromBalance,
              balance_after: newFromBalance,
              note:
                (outTx.note || "") + " | Transfer antar dompet disetujui admin.",
              admin_note: adminNote || null,
            })
            .eq("id", outTx.id);
        }

        // buat riwayat di dompet tujuan (TRANSFER_IN)
        await supabase.from("wallet_transactions").insert({
          wallet_id: tr.to_wallet_id,
          type: "TRANSFER_IN",
          amount: amount,
          balance_before: toBalance,
          balance_after: newToBalance,
          status: "COMPLETED",
          note: "Terima transfer antar Dompet Nadnad (disetujui admin).",
          admin_note: adminNote || null,
        });
      } catch (e2) {
        console.error("Gagal menyinkronkan riwayat transaksi transfer:", e2);
        // tidak fatal untuk saldo; hanya history yang mungkin tidak lengkap
      }

      await loadPendingTransfers();
      alert("Transfer antar Dompet Nadnad disetujui dan saldo sudah diperbarui.");
    } catch (err) {
      console.error("Approve transfer error:", err);
      alert("Terjadi kesalahan saat menyetujui transfer.");
    } finally {
      setTransferActionId(null);
    }
  };

  const handleRejectTransfer = async (tr) => {
    setTransferActionId(tr.id);
    const adminNote = (transferNotes[tr.id] || "").trim();

    try {
      const mergedNote =
        "Transfer antar dompet ditolak admin." +
        (adminNote ? ` | ${adminNote}` : "");

      const { error: trErr } = await supabase
        .from("wallet_internal_transfers")
        .update({
          status: "REJECTED",
          admin_note: mergedNote,
          processed_at: new Date().toISOString(),
        })
        .eq("id", tr.id);

      if (trErr) {
        console.error("Reject internal transfer error:", trErr.message);
        alert("Gagal mengubah status transfer.");
        return;
      }

      // update baris TRANSFER_OUT di wallet_transactions (kalau ada)
      try {
        const amount = Number(tr.amount) || 0;

        const { data: outTx, error: outErr } = await supabase
          .from("wallet_transactions")
          .select("id, note")
          .eq("wallet_id", tr.from_wallet_id)
          .eq("type", "TRANSFER_OUT")
          .eq("status", "PENDING")
          .eq("amount", amount)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!outErr && outTx) {
          await supabase
            .from("wallet_transactions")
            .update({
              status: "REJECTED",
              note: (outTx.note || "") + " | " + mergedNote,
              admin_note: mergedNote,
            })
            .eq("id", outTx.id);
        }
      } catch (e2) {
        console.error(
          "Gagal meng-update riwayat transaksi transfer (reject):",
          e2
        );
      }

      await loadPendingTransfers();
      alert("Transfer antar Dompet Nadnad berhasil ditolak.");
    } catch (err) {
      console.error("Reject transfer error:", err);
      alert("Terjadi kesalahan saat menolak transfer.");
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
            <div className="nanad-dashboard-logo nanad-logo-n">N</div>
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
            Persetujuan deposit, penarikan, dan transfer.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini digunakan untuk menyetujui atau menolak pengajuan
            deposit, penarikan, dan transfer antar Dompet Nadnad. Saldo dompet
            hanya berubah ketika transaksi berstatus{" "}
            <strong>APPROVED</strong>.
          </p>
          <p className="nanad-dashboard-body" style={{ fontSize: "0.8rem" }}>
            Gunakan kolom <strong>catatan admin</strong> untuk meninggalkan
            alasan singkat setiap kali menyetujui atau menolak, agar riwayat
            lebih jelas bagi pengguna.
          </p>
        </section>

        {/* SECTION 1: DEPOSIT & WITHDRAW */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Transaksi deposit &amp; penarikan pending</h3>
              <p>Maksimal 50 pengajuan terbaru yang masih menunggu.</p>
            </div>

            {txErrorMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.5rem" }}
              >
                {txErrorMsg}
              </p>
            )}

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

        {/* SECTION 2: TRANSFER ANTAR DOMPET */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Pengajuan transfer antar Dompet Nadnad</h3>
              <p>
                Pengajuan ini dibuat ketika pengguna mengisi form{" "}
                <strong>Transfer antar Dompet Nadnad</strong> di halaman
                Dompet. Saldo kedua dompet baru berubah setelah kamu setujui di
                sini.
              </p>
            </div>

            {transferErrorMsg && (
              <p
                className="nanad-dashboard-body"
                style={{ color: "#fecaca", marginTop: "0.5rem" }}
              >
                {transferErrorMsg}
              </p>
            )}

            {pendingTransfers.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Tidak ada pengajuan transfer antar Dompet Nadnad yang pending.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {pendingTransfers.map((tr) => {
                  const fromW = transferWalletMap[tr.from_wallet_id];
                  const toW = transferWalletMap[tr.to_wallet_id];

                  return (
                    <div key={tr.id} className="nanad-dashboard-deposits-row">
                      {/* kiri: waktu + status */}
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
                          PENDING
                        </span>
                      </div>

                      {/* tengah: detail transfer */}
                      <div>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#38bdf8",
                          }}
                        >
                          Transfer antar Dompet Nadnad{" "}
                          {formatCurrency(tr.amount)}
                        </span>

                        <br />
                        <small>
                          <strong>Dari:</strong>{" "}
                          {fromW?.owner_name ||
                            fromW?.user_email ||
                            fromW?.account_number ||
                            tr.from_wallet_id}
                          {fromW?.account_number
                            ? ` · No. Dompet ${fromW.account_number}`
                            : ""}
                        </small>
                        <br />
                        <small>
                          <strong>Ke:</strong>{" "}
                          {toW?.owner_name ||
                            toW?.user_email ||
                            toW?.account_number ||
                            tr.to_wallet_id}
                          {toW?.account_number
                            ? ` · No. Dompet ${toW.account_number}`
                            : ""}
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

                        <div style={{ marginTop: "0.5rem" }}>
                          <small
                            style={{ display: "block", marginBottom: 4 }}
                          >
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
                            placeholder="contoh: saldo cukup, transfer ok · atau: data dompet tujuan dikonfirmasi via WhatsApp."
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

                      {/* kanan: tombol aksi */}
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
                          Tolak transfer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. All rights reserved.
          </span>
          <span>
            Fitur approval ini beroperasi untuk mendukung simulasi alur
            operasional Dompet Nadnad. Untuk pengelolaan dana nyata, tetap
            diperlukan infrastruktur dan pengawasan yang sesuai regulasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
