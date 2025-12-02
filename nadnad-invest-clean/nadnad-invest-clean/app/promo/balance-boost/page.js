// app/promo/balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

// tier event
const TIERS = [
  {
    id: "BRONZE",
    name: "Bronze",
    rangeLabel: "Rp 100.000 – < Rp 1.000.000",
    min: 100_000,
    max: 999_999,
    bonusPercent: 10,
    winnersPerMonth: 100000,
    bonusCap: 100_000_000,
  },
  {
    id: "SILVER",
    name: "Silver",
    rangeLabel: "Rp 1.000.000 – < Rp 10.000.000",
    min: 1_000_000,
    max: 9_999_999,
    bonusPercent: 20,
    winnersPerMonth: 100000,
    bonusCap: 100_000_000,
  },
  {
    id: "GOLD",
    name: "Gold",
    rangeLabel: "Rp 10.000.000 – < Rp 50.000.000",
    min: 10_000_000,
    max: 49_999_999,
    bonusPercent: 25,
    winnersPerMonth: 100000,
    bonusCap: 100_000_000,
  },
  {
    id: "DIAMOND",
    name: "Diamond",
    rangeLabel: "≥ Rp 50.000.000",
    min: 50_000_000,
    max: 999_999_999_999, // batas atas besar saja
    bonusPercent: 30,
    winnersPerMonth: 100000,
    bonusCap: 10_000_000_000,
  },
];

function formatCurrency(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function BalanceBoostPromoPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedTierId, setSelectedTierId] = useState("BRONZE");
  const [amountStr, setAmountStr] = useState("");
  const [userNote, setUserNote] = useState("");
  const [joining, setJoining] = useState(false);

  const [myEvents, setMyEvents] = useState([]);

  // ambil user, wallet, dan event promo miliknya
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
          console.error("getUser error:", error.message);
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: walletRow, error: walletErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (walletErr) {
          console.error("wallet load error:", walletErr.message);
          setErrorMsg(
            "Gagal memuat Dompet Nadnad. Pastikan tabel 'wallets' sudah dibuat."
          );
          return;
        }

        if (!walletRow) {
          setErrorMsg(
            "Dompet belum tersedia. Silakan buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(walletRow);

        const { data: events, error: evErr } = await supabase
          .from("promo_events")
          .select("*")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false });

        if (evErr) {
          console.error("Load promo_events error:", evErr.message);
        } else {
          setMyEvents(events || []);
        }
      } catch (err) {
        console.error("Promo init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const selectedTier = TIERS.find((t) => t.id === selectedTierId) || TIERS[0];

  const handleJoinPromo = async (e) => {
    e.preventDefault();
    if (!user || !wallet) return;

    setJoining(true);

    try {
      const amount = Number(amountStr);
      if (!amount || amount <= 0) {
        alert("Nominal setoran wajib diisi dan harus lebih besar dari 0.");
        return;
      }

      if (amount < selectedTier.min || amount > selectedTier.max) {
        alert(
          `Nominal untuk tier ${selectedTier.name} harus di antara ` +
            `${formatCurrency(selectedTier.min)} dan ${formatCurrency(
              selectedTier.max
            )}.`
        );
        return;
      }

      if ((wallet.balance || 0) < amount) {
        alert(
          "Saldo Dompet Nadnad tidak cukup untuk mengikuti promo dengan nominal tersebut."
        );
        return;
      }

      // 1) potong saldo dompet
      const newBalance = (wallet.balance || 0) - amount;

      const { error: updateErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (updateErr) {
        console.error("Update wallet (join promo) error:", updateErr.message);
        alert("Gagal memotong saldo Dompet Nadnad. Coba lagi.");
        return;
      }

      // 2) simpan event promo
      const { data: promoRow, error: promoErr } = await supabase
        .from("promo_events")
        .insert({
          user_id: user.id,
          user_email: user.email,
          wallet_id: wallet.id,
          tier: selectedTier.id,
          base_amount: amount,
          note: userNote.trim() || null,
          status: "ACTIVE",
        })
        .select()
        .single();

      if (promoErr) {
        console.error("Insert promo_events error:", promoErr.message);
        alert(
          "Saldo sudah dipotong, tetapi gagal menyimpan data promo. Segera hubungi admin via Pengaduan WhatsApp."
        );
        // tetap update state saldo, karena saldo sudah benar-benar berkurang
      }

      // 3) catat ke wallet_transactions (tipe WITHDRAW)
      const { error: txErr } = await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "WITHDRAW",
        amount,
        status: "APPROVED",
        user_email: user.email,
        note: `Ikut promo Balance Boost (tier ${selectedTier.name}).`,
        user_note: userNote.trim() || null,
      });

      if (txErr) {
        console.error("Insert wallet_transactions error:", txErr.message);
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi di riwayat. Cek manual di database."
        );
      }

      // update state di FE
      setWallet((prev) =>
        prev ? { ...prev, balance: newBalance } : prev
      );
      if (promoRow) {
        setMyEvents((prev) => [promoRow, ...prev]);
      }

      alert(
        `Kamu berhasil mendaftar ke promo Balance Boost (tier ${selectedTier.name}). ` +
          `Saldo Dompet Nadnad dipotong ${formatCurrency(
            amount
          )}. Admin akan mengatur cicilan pokok + bonus harian secara manual.`
      );

      setAmountStr("");
      setUserNote("");
    } catch (err) {
      console.error("Join promo unexpected error:", err);
      alert("Terjadi kesalahan saat memproses pendaftaran promo.");
    } finally {
      setJoining(false);
    }
  };

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

  if (errorMsg) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Promo error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat promo Balance Boost.
            </h1>
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca" }}
            >
              {errorMsg}
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
                Promo · Balance Boost Event (3 bulan)
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

        {/* INTRO + SALDO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Promo spesial 3 bulan</p>
          <h1 className="nanad-dashboard-heading">
            Balance Boost – event pengembalian bertahap dengan peluang bonus.
          </h1>
          <p className="nanad-dashboard-body">
            Selama periode promo, dana yang kamu &quot;titipkan&quot; akan
            dikembalikan setiap hari selama 30 hari, lengkap dengan keuntungan
            event sebesar 10% hingga 30% sesuai tier yang kamu pilih. Seluruh 
            proses pengembalian dilakukan secara teratur dan transparan untuk
            menjamin keamanan serta kenyamanan pengguna.
          </p>

          <div className="nanad-dashboard-stat-grid">
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun terhubung</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo Dompet Nadnad</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Rp 0"}
              </p>
            </div>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">
                Event yang pernah kamu ikuti
              </p>
              <p className="nanad-dashboard-stat-number">
                {myEvents.length} event
              </p>
            </div>
          </div>
        </section>

        {/* FORM IKUT PROMO + INFO TIER */}
        <section className="nanad-dashboard-table-section">
          {/* Kiri: form ikut promo */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Ikut promo Balance Boost</h3>
              <p>
                Pilih tier, tentukan nominal yang di-setor dari Dompet Nadnad,
                lalu konfirmasi. Saldo akan langsung dipotong dan dicatat di
                riwayat transaksi.
              </p>
            </div>

            <form
              onSubmit={handleJoinPromo}
              className="nanad-dashboard-deposit-form"
            >
              <label className="nanad-dashboard-deposit-amount">
                Pilih tier
                <select
                  value={selectedTierId}
                  onChange={(e) => setSelectedTierId(e.target.value)}
                >
                  {TIERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.rangeLabel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Nominal yang ingin kamu setorkan ke event
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder={`Contoh: ${selectedTier.min}`}
                />
                <span
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    marginTop: "0.2rem",
                    opacity: 0.8,
                  }}
                >
                  Range tier {selectedTier.name}:{" "}
                  <strong>{selectedTier.rangeLabel}</strong>. Pastikan nominal
                  berada di dalam range tersebut dan tidak melebihi saldo Dompet
                  Nadnad.
                </span>
              </label>

              <label className="nanad-dashboard-deposit-amount">
                Catatan untuk admin (opsional)
                <textarea
                  rows={3}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Contoh: saya ingin ikut 3 bulan penuh, mohon info jadwal cicilan via WA."
                  style={{ resize: "vertical" }}
                />
              </label>

              <button
                type="submit"
                disabled={joining}
                className="nanad-dashboard-deposit-submit"
              >
                {joining ? "Memproses..." : "Setor dari Dompet & Ikut Promo"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ fontSize: "0.78rem", marginTop: "0.6rem" }}
              >
                Dengan menekan tombol di atas, kamu menyetujui bahwa dana akan
                dipotong dari saldo <strong>Dompet Nadnad</strong> sebesar
                nominal yang kamu isi. Pengembalian pokok + bonus akan dikirim
                kembali ke dompet dalam 30 kali pengiriman selama 30 hari{" "}
                <strong>Secara Otomatis</strong>.
              </p>
            </form>
          </div>

          {/* Kanan: detail tier & riwayat singkat */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Struktur tier &amp; peluang bonus</h3>
              <p>
                Bonus tidak dijanjikan ke semua peserta. Hanya sebagian pengguna
                yang dipilih setiap bulan, sesuai kapasitas bakar dana promo.
              </p>
            </div>

            <div
              className="nanad-dashboard-deposits-rows"
              style={{ marginTop: "0.75rem" }}
            >
              {TIERS.map((t) => (
                <div key={t.id} className="nanad-dashboard-deposits-row">
                  <div>
                    <strong>{t.name}</strong>
                    <br />
                    <span style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                      {t.rangeLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem" }}>
                    <p style={{ margin: 0 }}>
                      👤 Kuota:{" "}
                      <strong>{t.winnersPerMonth} pemenang / bulan</strong>
                    </p>
                    <p style={{ margin: 0 }}>
                      🎁 Bonus: hingga{" "}
                      <strong>{t.bonusPercent}%</strong> dari total setoran
                    </p>
                    <p style={{ margin: 0 }}>
                      🔒 Batas bonus per user:{" "}
                      <strong>{formatCurrency(t.bonusCap)}</strong>
                    </p>
                  </div>
                  <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                    Bonus dibagikan berdasarkan kebijakan internal Dompet
                    Nadnad. Tidak ada janji pasti semua peserta akan mendapatkan
                    bonus. Pokok tetap dikembalikan melalui cicilan harian.
                  </div>
                </div>
              ))}
            </div>

            {myEvents.length > 0 && (
              <>
                <hr
                  style={{
                    margin: "1rem 0 0.75rem",
                    borderColor: "rgba(148,163,184,0.4)",
                  }}
                />
                <h4 style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}>
                  Event yang pernah kamu ikuti
                </h4>
                <div
                  className="nanad-dashboard-deposits-rows"
                  style={{ maxHeight: "220px", overflowY: "auto" }}
                >
                  {myEvents.map((ev) => (
                    <div key={ev.id} className="nanad-dashboard-deposits-row">
                      <div>
                        <strong>{ev.tier}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color:
                              ev.status === "ACTIVE"
                                ? "#4ade80"
                                : "#e5e7eb",
                          }}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem" }}>
                        <p style={{ margin: 0 }}>
                          Pokok disetor: {formatCurrency(ev.base_amount)}
                        </p>
                        <p style={{ margin: 0 }}>
                          Tanggal ikut:{" "}
                          {new Date(ev.joined_at).toLocaleString("id-ID")}
                        </p>
                        {ev.note && (
                          <p
                            style={{
                              margin: 0,
                              marginTop: "0.25rem",
                              opacity: 0.9,
                            }}
                          >
                            Catatan: {ev.note}
                          </p>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                        Rekap cicilan dan bonus harian dikelola di panel admin.
                        Jika ada pertanyaan, gunakan tombol Pengaduan WhatsApp di
                        aplikasi utama.
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad · Promo Balance Boost.
          </span>
          <span>
            Event ini bersifat promo / bakar dana terbatas. Tidak ada janji
            keuntungan tetap. Semua pengembalian pokok + bonus dilakukan secara
            manual oleh admin dan bisa dihentikan sewaktu-waktu setelah periode
            promo berakhir.
          </span>
        </footer>
      </div>
    </main>
  );
}
