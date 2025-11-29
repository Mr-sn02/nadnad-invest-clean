// app/wallet/receipt/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient"; // ✅ ini yang benar

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

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

// Biar admin tetap bisa lihat semua receipt
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

export default function WalletReceiptPage({ params }) {
  const router = useRouter();
  const { id } = params; // id transaksi

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tx, setTx] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg("");

      try:
        // 1) Pastikan user login
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

        setViewer(user);

        // 2) Ambil transaksi
        const { data: txData, error: txErr } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("id", id)
          .single();

        if (txErr || !txData) {
          console.error("Tx not found:", txErr?.message);
          setErrorMsg("Transaksi tidak ditemukan.");
          return;
        }

        // 3) Ambil dompet terkait (untuk cek kepemilikan & info tambahan)
        const { data: walletData, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("id", txData.wallet_id)
          .single();

        if (wErr) {
          console.error("Wallet load error:", wErr.message);
        }

        // 4) Proteksi: hanya pemilik dompet atau admin yang boleh lihat
        const isAdmin =
          user.email && ADMIN_EMAILS.includes(user.email);
        if (walletData && walletData.user_id !== user.id && !isAdmin) {
          setErrorMsg("Kamu tidak memiliki akses ke bukti transaksi ini.");
          return;
        }

        setTx(txData);
        setWallet(walletData || null);
      } catch (err) {
        console.error("Receipt load error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat bukti transaksi.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      load();
    }
  }, [id, router]);

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat bukti transaksi...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg || !tx) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Receipt error</p>
            <h1 className="nanad-dashboard-heading">
              Bukti transaksi tidak dapat ditampilkan.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg || "Data transaksi tidak ditemukan."}
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/wallet")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke wallet
            </button>
          </section>
        </div>
      </main>
    );
  }

  const createdAt = formatDateTime(tx.created_at);
  const typeLabel = tx.type === "DEPOSIT" ? "Deposit" : "Penarikan";

  let statusLabel = tx.status;
  let statusColor = "#e5e7eb";

  if (tx.status === "PENDING") {
    statusLabel = "Pending";
    statusColor = "#facc15";
  } else if (tx.status === "APPROVED" || tx.status === "COMPLETED") {
    statusLabel = "Disetujui / selesai";
    statusColor = "#4ade80";
  } else if (tx.status === "REJECTED") {
    statusLabel = "Ditolak";
    statusColor = "#f87171";
  }

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header sederhana */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Bukti transaksi dompet
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Kembali ke wallet
            </button>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => window.print()}
            >
              Cetak / Simpan PDF
            </button>
          </div>
        </header>

        {/* Kartu bukti transaksi */}
        <section
          style={{
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: "640px",
              width: "100%",
              background: "rgba(15,23,42,0.95)",
              borderRadius: "24px",
              padding: "1.5rem 1.75rem",
              border: "1px solid rgba(248,250,252,0.08)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header struk */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.2rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    opacity: 0.8,
                    marginBottom: "0.3rem",
                  }}
                >
                  Bukti transaksi
                </p>
                <h1
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 600,
                  }}
                >
                  {typeLabel} dompet Nanad Invest
                </h1>
                <p
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.8,
                    marginTop: "0.3rem",
                  }}
                >
                  Disajikan sebagai ringkasan resmi transaksi untuk keperluan
                  dokumentasi pribadi.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.5)",
                    marginBottom: "0.35rem",
                  }}
                >
                  NANAD INVEST
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  ID transaksi:
                  <br />
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.72rem",
                    }}
                  >
                    {tx.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Info utama */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "0.75rem 1.25rem",
                fontSize: "0.85rem",
                padding: "0.9rem 1rem",
                borderRadius: "18px",
                background:
                  "radial-gradient(circle at top, rgba(148,163,184,0.15), rgba(15,23,42,1))",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <div style={{ opacity: 0.7 }}>Jenis transaksi</div>
                <div style={{ fontWeight: 500 }}>{typeLabel}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>Status</div>
                <div
                  style={{
                    fontWeight: 500,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>Tanggal & waktu</div>
                <div>{createdAt}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>Nominal</div>
                <div style={{ fontWeight: 600 }}>
                  {formatCurrency(tx.amount)}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>Pemilik akun</div>
                <div>{tx.user_email || "-"}</div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>ID dompet</div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  {tx.wallet_id}
                </div>
              </div>
            </div>

            {/* Detail tambahan: rekening dsb */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.4fr)",
                gap: "1rem",
                fontSize: "0.8rem",
                marginBottom: "1.1rem",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    marginBottom: "0.4rem",
                    opacity: 0.9,
                  }}
                >
                  Detail sumber / tujuan
                </h3>

                {tx.type === "DEPOSIT" ? (
                  <>
                    <p style={{ opacity: 0.7, marginBottom: "0.1rem" }}>
                      Rekening tujuan Nanad Invest:
                    </p>
                    <p style={{ marginBottom: "0.4rem" }}>
                      {tx.deposit_target || "-"}
                    </p>

                    <p style={{ opacity: 0.7, marginBottom: "0.1rem" }}>
                      Atas nama pengirim:
                    </p>
                    <p>{tx.sender_name || "-"}</p>
                  </>
                ) : (
                  <>
                    <p style={{ opacity: 0.7, marginBottom: "0.1rem" }}>
                      Rekening / e-wallet tujuan:
                    </p>
                    <p style={{ marginBottom: "0.4rem" }}>
                      {tx.withdraw_bank_name
                        ? `${tx.withdraw_bank_name} · ${tx.withdraw_bank_account}`
                        : "-"}
                    </p>

                    <p style={{ opacity: 0.7, marginBottom: "0.1rem" }}>
                      Atas nama penerima:
                    </p>
                    <p>{tx.withdraw_bank_holder || "-"}</p>
                  </>
                )}
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    marginBottom: "0.4rem",
                    opacity: 0.9,
                  }}
                >
                  Catatan & ringkasan
                </h3>

                <p style={{ marginBottom: "0.3rem" }}>
                  <strong>Catatan pengguna:</strong>{" "}
                  <span style={{ opacity: 0.9 }}>
                    {tx.user_note || "— tidak ada catatan khusus dari pengguna —"}
                  </span>
                </p>

                <p style={{ marginBottom: "0.3rem" }}>
                  <strong>Catatan admin:</strong>{" "}
                  <span style={{ opacity: 0.9 }}>
                    {tx.admin_note || "— belum ada catatan admin —"}
                  </span>
                </p>

                <p style={{ marginBottom: "0.3rem" }}>
                  <strong>Catatan sistem:</strong>{" "}
                  <span style={{ opacity: 0.9 }}>
                    {tx.note || "—"}
                  </span>
                </p>
              </div>
            </div>

            {/* Jika ada bukti gambar */}
            {tx.proof_image_url && (
              <div
                style={{
                  borderTop: "1px dashed rgba(148,163,184,0.5)",
                  paddingTop: "0.9rem",
                  marginTop: "0.4rem",
                  fontSize: "0.78rem",
                }}
              >
                <p style={{ marginBottom: "0.35rem" }}>
                  Bukti transfer yang diunggah:
                </p>
                <a
                  href={tx.proof_image_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "underline",
                    opacity: 0.95,
                  }}
                >
                  Buka gambar bukti transfer
                </a>
              </div>
            )}

            {/* Footer kecil struk */}
            <div
              style={{
                borderTop: "1px solid rgba(30,64,175,0.5)",
                marginTop: "1.2rem",
                paddingTop: "0.6rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                opacity: 0.8,
              }}
            >
              <span>
                © {new Date().getFullYear()} Nanad Invest · Bukti transaksi
                dompet.
              </span>
              <span>
                Dokumen ini tidak menjamin imbal hasil dan hanya untuk
                keperluan pencatatan personal.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
