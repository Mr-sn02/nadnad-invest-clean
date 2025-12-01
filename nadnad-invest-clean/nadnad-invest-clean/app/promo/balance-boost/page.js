// app/promo/balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

// Helper format rupiah
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
  });
}

// Kode event, biar konsisten di tabel
const PROMO_CODE = "BALANCE_BOOST_30D_2025";

// Definisi tier
const TIERS = [
  {
    id: "BRONZE",
    name: "Bronze",
    description: "Setoran 100 ribu – < 1 juta",
    minAmount: 100_000,
    maxAmount: 999_999,
    winnersPerMonth: 30,
    bonusPercentMax: 1,
    maxBonus: 25_000,
  },
  {
    id: "SILVER",
    name: "Silver",
    description: "Setoran 1 juta – < 10 juta",
    minAmount: 1_000_000,
    maxAmount: 9_999_999,
    winnersPerMonth: 20,
    bonusPercentMax: 2,
    maxBonus: 150_000,
  },
  {
    id: "GOLD",
    name: "Gold",
    description: "Setoran 10 juta – < 50 juta",
    minAmount: 10_000_000,
    maxAmount: 49_999_999,
    winnersPerMonth: 10,
    bonusPercentMax: 3,
    maxBonus: 600_000,
  },
  {
    id: "DIAMOND",
    name: "Diamond",
    description: "Setoran 50 juta ke atas",
    minAmount: 50_000_000,
    maxAmount: null, // tidak dibatasi
    winnersPerMonth: 5,
    bonusPercentMax: 5,
    maxBonus: 1_500_000,
  },
];

export default function BalanceBoostPromoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [entries, setEntries] = useState([]);

  // Form ikut promo
  const [selectedTierId, setSelectedTierId] = useState("BRONZE");
  const [joinAmount, setJoinAmount] = useState("");
  const [joinNote, setJoinNote] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // --- Load user + wallet + data event ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError("");

      try {
        // 1) cek user login
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

        // 2) ambil dompet
        const { data: walletData, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("Error get wallet:", walletErr.message);
          setLoadError(
            "Gagal memuat dompet utama. Pastikan tabel 'wallets' tersedia."
          );
          return;
        }

        if (!walletData) {
          setLoadError(
            "Dompet belum tersedia. Buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(walletData);

        // 3) ambil semua entry promo user ini
        const { data: entryRows, error: entryErr } = await supabase
          .from("wallet_promo_balance_boost_entries")
          .select("*")
          .eq("user_id", user.id)
          .eq("promo_code", PROMO_CODE)
          .order("created_at", { ascending: false });

        if (entryErr) {
          console.error("Error load promo entries:", entryErr.message);
          setEntries([]);
        } else {
          setEntries(entryRows || []);
        }
      } catch (err) {
        console.error("Promo init error:", err);
        setLoadError("Terjadi kesalahan saat memuat halaman promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const currentTier = TIERS.find((t) => t.id === selectedTierId) || TIERS[0];

  // --- Aksi: ikut promo dari saldo dompet ---
  const handleJoinPromo = async (e) => {
    e.preventDefault();
    if (!wallet || !user) return;

    const rawAmount = Number(joinAmount);
    if (!rawAmount || rawAmount <= 0) {
      alert("Nominal setoran promo harus lebih besar dari 0.");
      return;
    }

    if (rawAmount < currentTier.minAmount) {
      alert(
        `Nominal minimal untuk tier ${currentTier.name} adalah ${formatCurrency(
          currentTier.minAmount
        )}.`
      );
      return;
    }

    if (currentTier.maxAmount && rawAmount > currentTier.maxAmount) {
      alert(
        `Nominal maksimal untuk tier ${currentTier.name} adalah ${formatCurrency(
          currentTier.maxAmount
        )}.`
      );
      return;
    }

    if (rawAmount > (wallet.balance || 0)) {
      alert(
        `Saldo dompet kamu tidak cukup. Saldo saat ini: ${formatCurrency(
          wallet.balance || 0
        )}.`
      );
      return;
    }

    try {
      setJoinLoading(true);

      // Hitung saldo baru
      const beforeBalance = wallet.balance || 0;
      const afterBalance = beforeBalance - rawAmount;

      // 1) update saldo dompet
      const { error: walletUpdateErr } = await supabase
        .from("wallets")
        .update({ balance: afterBalance })
        .eq("id", wallet.id)
        .eq("user_id", user.id);

      if (walletUpdateErr) {
        console.error("Update wallet error:", walletUpdateErr.message);
        alert("Gagal memotong saldo dompet. Coba lagi.");
        return;
      }

      // 2) catat transaksi di wallet_transactions (tipe PROMO_JOIN)
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "PROMO_JOIN",
        amount: rawAmount,
        balance_before: beforeBalance,
        balance_after: afterBalance,
        status: "COMPLETED",
        note: `Ikut promo Balance Boost 30 Hari (tier ${currentTier.name}).`,
        user_email: user.email || null,
        user_note: joinNote?.trim() || null,
        promo_code: PROMO_CODE,
        promo_tier: currentTier.id,
      });

      if (txErr) {
        console.error("Insert wallet_transactions error:", txErr.message);
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi. Cek manual di database."
        );
        // tetap lanjut buat entry promo, supaya jejaknya ada
      }

      // 3) simpan entry ke tabel promo
      const { error: entryErr } = await supabase
        .from("wallet_promo_balance_boost_entries")
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          wallet_id: wallet.id,
          promo_code: PROMO_CODE,
          tier_id: currentTier.id,
          tier_name: currentTier.name,
          base_amount: rawAmount,
          join_note: joinNote?.trim() || null,
          status: "ACTIVE", // admin bisa ubah nanti: COMPLETED / CANCELLED
        });

      if (entryErr) {
        console.error("Insert promo entry error:", entryErr.message);
        alert(
          "Saldo sudah dipotong, tetapi gagal menyimpan data event. Segera hubungi admin via Pengaduan WhatsApp."
        );
      }

      // refresh state dompet & entry
      setWallet((prev) =>
        prev ? { ...prev, balance: afterBalance } : prev
      );

      setJoinAmount("");
      setJoinNote("");

      const { data: entryRows, error: reloadErr } = await supabase
        .from("wallet_promo_balance_boost_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("promo_code", PROMO_CODE)
        .order("created_at", { ascending: false });

      if (!reloadErr) {
        setEntries(entryRows || []);
      }

      alert(
        `Kamu berhasil mendaftar ke promo Balance Boost (tier ${currentTier.name}). Saldo dompet dipotong ${formatCurrency(
          rawAmount
        )}. Admin akan mengatur bonus harian secara manual.`
      );
    } catch (err) {
      console.error("Join promo error:", err);
      alert("Terjadi kesalahan saat memproses pendaftaran promo.");
    } finally {
      setJoinLoading(false);
    }
  };

  // --- RENDER STATE LOADING / ERROR ---
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman promo Balance Boost...
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
            <p className="nanad-dashboard-eyebrow">Promo error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat halaman promo Dompet Nadnad.
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

  // --- RENDER HALAMAN UTAMA ---
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
                Event Promo · Balance Boost 30 Hari
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/wallet")}
            >
              Kembali ke Wallet
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

        {/* HERO / PENJELASAN SINGKAT */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo terbatas 3 bulan</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost 30 Hari · setor sekali, berpeluang dapat bonus harian.
          </h1>
          <p className="nanad-dashboard-body">
            Selama periode promo, kamu bisa menyetor dari{" "}
            <strong>Dompet Nadnad</strong> ke event ini sesuai tier pilihan.
            Dana pokokmu akan tetap tercatat sebagai bagian dari dompet, dan
            admin akan mengirimkan kembali pokok + bonus (jika terpilih){" "}
            <strong>secara manual selama 30 hari</strong> ke dompetmu.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Semua bonus dan pengembalian dana event akan dikirim kembali ke
                <strong> dompet atas email ini</strong>.
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Saldo dompet saat ini
              </p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem" }}
              >
                Saldo akan berkurang sebesar nominal setoran ketika kamu ikut
                event, dan akan ditambah lagi ketika admin mengirim pengembalian
                harian.
              </p>
            </div>
          </div>
        </section>

        {/* TIER + FORM IKUT PROMO */}
        <section className="nanad-dashboard-table-section">
          {/* Kiri: info tier */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Tier &amp; peluang bonus</h3>
              <p>
                Event ini bukan janji keuntungan. Bonus diberikan{" "}
                <strong>kepada sebagian peserta yang beruntung</strong> di
                setiap tier, dengan batas maksimal per orang.
              </p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {TIERS.map((tier) => (
                <div key={tier.id} className="nanad-dashboard-deposits-row">
                  <div>
                    <strong>{tier.name}</strong>
                    <br />
                    <small>{tier.description}</small>
                  </div>
                  <div style={{ fontSize: "0.8rem" }}>
                    <div>
                      Bonus hingga{" "}
                      <strong>{tier.bonusPercentMax}%</strong> dari setoran
                      (max{" "}
                      <strong>{formatCurrency(tier.maxBonus)}</strong>).
                    </div>
                    <div>
                      Sekitar{" "}
                      <strong>{tier.winnersPerMonth} pemenang</strong> per
                      bulan di tier ini.
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.78rem" }}>
                    <div>
                      Minimal:{" "}
                      <strong>{formatCurrency(tier.minAmount)}</strong>
                    </div>
                    <div>
                      Maksimal:{" "}
                      <strong>
                        {tier.maxAmount
                          ? formatCurrency(tier.maxAmount)
                          : "Tidak dibatasi"}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kanan: form ikut promo */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ikut event dari saldo Dompet Nadnad</h3>
              <p>
                Pilih tier sesuai nominal yang ingin kamu setor, lalu konfirmasi
                pemotongan dari saldo dompet.
              </p>
            </div>

            <form
              onSubmit={handleJoinPromo}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Pilih tier event
                <select
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: "999px",
                    border: "1px solid rgba(248,250,252,0.08)",
                    background:
                      "radial-gradient(circle at top, rgba(255,255,255,0.06), rgba(15,23,42,1))",
                    padding: "0.45rem 0.9rem",
                    color: "white",
                    fontSize: "0.8rem",
                  }}
                >
                  {TIERS.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} · {tier.description}
                    </option>
                  ))}
                </select>
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Nominal setoran event
                <input
                  type="number"
                  min={currentTier.minAmount}
                  step="1000"
                  placeholder={`Minimal ${formatCurrency(
                    currentTier.minAmount
                  )}`}
                  value={joinAmount}
                  onChange={(e) => setJoinAmount(e.target.value)}
                />
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan untuk dirimu sendiri (opsional)
                <textarea
                  placeholder="contoh: ikut promo dari budget tabungan rumah / dari bonus kerja."
                  value={joinNote}
                  onChange={(e) => setJoinNote(e.target.value)}
                  style={{ minHeight: "70px", resize: "vertical" }}
                />
              </label>

              <button
                type="submit"
                disabled={joinLoading}
                className="nanad-dashboard-deposit-submit"
              >
                {joinLoading ? "Memproses..." : "Setor dari dompet & ikuti event"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.76rem", marginTop: "0.4rem" }}
              >
                Dengan menekan tombol di atas, kamu menyetujui pemotongan saldo
                dari <strong>Dompet Nadnad</strong> sebesar nominal yang kamu
                isi. Pengembalian pokok + bonus (jika terpilih) akan dikirim
                kembali secara manual oleh admin selama 30 hari promo.
              </p>
            </form>
          </div>
        </section>

        {/* RIWAYAT KEIKUTSERTAAN USER */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Riwayat keikutsertaan kamu di promo ini</h3>
              <p>
                Termasuk setoran yang masih aktif dan yang sudah selesai /
                dibatalkan oleh admin.
              </p>
            </div>

            {entries.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada data. Setelah kamu ikut event, detail setoran akan
                muncul di sini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {entries.map((en) => {
                  const created = formatDateTime(en.created_at);
                  const tierName =
                    en.tier_name ||
                    TIERS.find((t) => t.id === en.tier_id)?.name ||
                    en.tier_id;

                  let statusLabel = en.status || "ACTIVE";
                  let statusColor = "#e5e7eb";

                  if (en.status === "ACTIVE") {
                    statusLabel = "Aktif";
                    statusColor = "#facc15";
                  } else if (en.status === "COMPLETED") {
                    statusLabel = "Selesai";
                    statusColor = "#4ade80";
                  } else if (en.status === "CANCELLED") {
                    statusLabel = "Dibatalkan";
                    statusColor = "#f87171";
                  }

                  return (
                    <div
                      key={en.id}
                      className="nanad-dashboard-deposits-row"
                    >
                      <div>
                        {created}
                        <br />
                        <span
                          style={{
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div>
                        <strong>{tierName}</strong>
                        <br />
                        <span style={{ fontSize: "0.8rem" }}>
                          Setoran event:{" "}
                          {formatCurrency(en.base_amount || 0)}
                        </span>
                        {en.join_note && (
                          <p
                            style={{
                              marginTop: "0.3rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            Catatan: {en.join_note}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          {formatCurrency(en.base_amount || 0)}
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          ID:{" "}
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.72rem",
                            }}
                          >
                            {en.id}
                          </span>
                        </div>
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
            © {new Date().getFullYear()} Dompet Nadnad. Promo Balance Boost 30
            Hari.
          </span>
          <span>
            Event ini bersifat promo &amp; hiburan. Tidak ada janji imbal
            hasil tetap. Bonus hanya diberikan kepada peserta yang terpilih
            sesuai kebijakan internal penyelenggara.
          </span>
        </footer>
      </div>
    </main>
  );
}
