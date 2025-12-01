// app/promo/balance-boost/join/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../../lib/supabaseClient";

// helper format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// helper tanggal
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

// helper default label bulan, contoh: "Jan 2026"
function getDefaultMonthLabel() {
  const now = new Date();
  return now.toLocaleDateString("id-ID", {
    month: "short",
    year: "numeric",
  });
}

// helper tentukan tier berdasarkan nominal
function determineTier(amount) {
  if (!amount || amount < 100000) return "NONE";
  if (amount >= 100000 && amount < 1000000) return "BRONZE";
  if (amount >= 1000000 && amount < 10000000) return "SILVER";
  if (amount >= 10000000 && amount < 50000000) return "GOLD";
  if (amount >= 50000000) return "DIAMOND";
  return "NONE";
}

function tierLabel(tier) {
  switch (tier) {
    case "BRONZE":
      return "Bronze (Rp 100.000 – < Rp 1.000.000)";
    case "SILVER":
      return "Silver (Rp 1.000.000 – < Rp 10.000.000)";
    case "GOLD":
      return "Gold (Rp 10.000.000 – < Rp 50.000.000)";
    case "DIAMOND":
      return "Diamond (Rp 50.000.000 ke atas)";
    default:
      return "Belum masuk tier (minimal Rp 100.000)";
  }
}

export default function BalanceBoostJoinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [participant, setParticipant] = useState(null);
  const [entries, setEntries] = useState([]);

  const [joinLoading, setJoinLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // form setoran promo
  const [promoAmount, setPromoAmount] = useState("");
  const [promoMonth, setPromoMonth] = useState(getDefaultMonthLabel());
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoInfo, setPromoInfo] = useState("");

  const promoPeriodLabel = "Periode contoh: 1 Januari – 31 Maret 2026";

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");
      setInfoMsg("");
      setPromoError("");
      setPromoInfo("");

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

        // 2) ambil wallet user
        const { data: existingWallet, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Error get wallet:", wErr.message);
          setErrorMsg(
            "Gagal memuat dompet utama. Pastikan tabel 'wallets' sudah dibuat."
          );
          return;
        }

        if (!existingWallet) {
          setErrorMsg(
            "Dompet belum tersedia. Silakan buka halaman Wallet terlebih dahulu agar dompet dibuat otomatis."
          );
          return;
        }

        setWallet(existingWallet);

        // 3) cek apakah user sudah terdaftar sebagai peserta promo
        const { data: participantRow, error: pErr } = await supabase
          .from("promo_balance_boost_participants")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (pErr) {
          console.error("Error get participant:", pErr.message);
        } else {
          setParticipant(participantRow || null);
          if (participantRow) {
            setInfoMsg("Kamu sudah terdaftar sebagai peserta Balance Boost.");
          }
        }

        // 4) ambil riwayat setoran promo user
        const { data: entryRows, error: eErr } = await supabase
          .from("promo_balance_boost_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (eErr) {
          console.error("Error load promo entries:", eErr.message);
        } else {
          setEntries(entryRows || []);
        }
      } catch (err) {
        console.error("BalanceBoost join init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman event.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleJoinEvent = async () => {
    if (!user || !wallet) {
      setErrorMsg(
        "Akun atau dompet belum terbaca. Coba refresh halaman atau buka ulang dashboard."
      );
      return;
    }

    setErrorMsg("");
    setInfoMsg("");

    try {
      setJoinLoading(true);

      const { data, error } = await supabase
        .from("promo_balance_boost_participants")
        .upsert(
          {
            user_id: user.id,
            wallet_id: wallet.id,
            user_email: user.email || null,
            status: "ACTIVE",
            joined_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.error("Join promo error:", error.message);
        setErrorMsg(
          "Gagal mendaftar ke event Balance Boost. Coba beberapa saat lagi."
        );
        return;
      }

      setParticipant(data);
      setInfoMsg(
        "Berhasil mendaftar ke event Balance Boost. Setoranmu ke Dompet Nadnad selama periode promo akan menjadi dasar peluang hadiah (tanpa janji menang)."
      );
    } catch (err) {
      console.error("Join promo error (unexpected):", err);
      setErrorMsg("Terjadi kesalahan saat memproses pendaftaran.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSubmitPromoEntry = async (e) => {
    e.preventDefault();
    if (!user || !wallet) return;

    setPromoError("");
    setPromoInfo("");

    const amount = Number(promoAmount);
    if (!amount || amount <= 0) {
      setPromoError("Nominal setoran harus lebih besar dari 0.");
      return;
    }

    if (amount < 100000) {
      setPromoError("Minimal nominal untuk event ini adalah Rp 100.000.");
      return;
    }

    const tier = determineTier(amount);
    if (tier === "NONE") {
      setPromoError("Nominal belum masuk salah satu tier promo.");
      return;
    }

    try {
      setPromoLoading(true);

      const { data, error } = await supabase
        .from("promo_balance_boost_entries")
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          user_email: user.email || null,
          amount,
          tier,
          month_label: promoMonth || null,
          status: "PENDING",
        })
        .select()
        .single();

      if (error) {
        console.error("Insert promo entry error:", error.message);
        setPromoError(
          "Gagal mencatat setoran promo. Coba beberapa saat lagi."
        );
        return;
      }

      setEntries((prev) => [data, ...prev]);
      setPromoAmount("");
      setPromoInfo(
        "Setoran promo tercatat. Admin Dompet Nadnad akan menggunakan data ini sebagai dasar perhitungan peluang hadiah (bukan janji keuntungan tetap)."
      );
    } catch (err) {
      console.error("Insert promo entry error (unexpected):", err);
      setPromoError("Terjadi kesalahan saat menyimpan setoran promo.");
    } finally {
      setPromoLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman event Balance Boost...
          </p>
        </div>
      </main>
    );
  }

  if (errorMsg && !participant && !wallet) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Event error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat halaman event Balance Boost.
            </h1>
            <p className="nanad-dashboard-body" style={{ color: "#fecaca" }}>
              {errorMsg}
            </p>
            <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.6rem" }}>
              <button
                type="button"
                className="nanad-dashboard-deposit-submit"
                onClick={() => router.push("/wallet")}
              >
                Buka halaman Dompet
              </button>
              <button
                type="button"
                className="nanad-dashboard-logout"
                onClick={() => router.push("/dashboard")}
              >
                Kembali ke dashboard
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const alreadyJoined = Boolean(participant);
  const numericPromoAmount = Number(promoAmount) || 0;
  const currentTier = determineTier(numericPromoAmount);

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
                Event · Balance Boost Participation
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Link href="/promo/balance-boost" className="nanad-dashboard-logout">
              Detail promo
            </Link>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </button>
          </div>
        </header>

        {/* INFO & STATUS */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Balance Boost Event</p>
          <h1 className="nanad-dashboard-heading">
            Daftar sebagai peserta &amp; catat setoran promo dari Dompet Nadnad.
          </h1>
          <p className="nanad-dashboard-body">
            Setelah mendaftar sebagai peserta, kamu bisa mencatat{" "}
            <strong>setoran promo</strong> yang ingin dihitung untuk event.
            Sistem akan mengkategorikan setoranmu ke Tier Bronze / Silver /
            Gold / Diamond sebagai dasar peluang hadiah (bukan janji
            keuntungan).
          </p>

          <p
            className="nanad-dashboard-body"
            style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#e5e7eb" }}
          >
            {promoPeriodLabel} — sesuaikan teks periode ini dengan rencana
            waktumu.
          </p>

          <div className="nanad-dashboard-stat-grid" style={{ marginTop: "1rem" }}>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Akun terhubung</p>
              <p className="nanad-dashboard-stat-number">
                {user?.email || "-"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
              >
                Setoran yang kamu catat di Dompet Nadnad menggunakan akun ini
                akan dikaitkan dengan event jika kamu terdaftar.
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
                style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
              >
                Saldo ini adalah pencatatan administratif di Dompet Nadnad,
                bukan saldo resmi rekening bank/e-wallet.
              </p>
            </div>

            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Status event kamu</p>
              <p className="nanad-dashboard-stat-number">
                {alreadyJoined ? "Terdaftar sebagai peserta" : "Belum terdaftar"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
              >
                {alreadyJoined && participant?.joined_at
                  ? `Bergabung sejak: ${formatDateTime(participant.joined_at)}`
                  : "Klik tombol di bawah untuk mendaftar sebagai peserta Balance Boost."}
              </p>
            </div>
          </div>
        </section>

        {/* AKSI: DAFTAR + SETOR PROMO */}
        <section className="nanad-dashboard-table-section">
          {/* Panel daftar event */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>1. Daftar sebagai peserta Balance Boost</h3>
              <p>
                Cukup satu kali klik untuk 1 akun selama periode promo. Setelah
                itu kamu tinggal setor seperti biasa lewat Dompet Nadnad dan
                mencatat setoran promo di panel sebelah.
              </p>
            </div>

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.86rem" }}
            >
              <ul style={{ paddingLeft: "1.1rem", marginBottom: "0.75rem" }}>
                <li>
                  Pendaftaran ini tidak memindahkan uang ke mana pun, hanya
                  menandai akunmu sebagai <strong>peserta event</strong>.
                </li>
                <li>
                  Pemenang dan bonus ditentukan oleh admin Dompet Nadnad sesuai
                  mekanisme undian/seleksi yang diumumkan resmi.
                </li>
                <li>
                  Bonus, bila ada, akan dicatat sebagai penyesuaian saldo di
                  dompetmu.
                </li>
              </ul>

              <button
                type="button"
                className={
                  alreadyJoined
                    ? "nanad-dashboard-logout"
                    : "nanad-dashboard-deposit-submit"
                }
                disabled={joinLoading || alreadyJoined}
                onClick={alreadyJoined ? undefined : handleJoinEvent}
              >
                {alreadyJoined
                  ? "Kamu sudah terdaftar sebagai peserta"
                  : joinLoading
                  ? "Mendaftarkan..."
                  : "Daftar ikut Balance Boost"}
              </button>

              {infoMsg && (
                <p
                  className="nanad-dashboard-body"
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.78rem",
                    color: "#bbf7d0",
                  }}
                >
                  {infoMsg}
                </p>
              )}
              {errorMsg && (
                <p
                  className="nanad-dashboard-body"
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.78rem",
                    color: "#fecaca",
                  }}
                >
                  {errorMsg}
                </p>
              )}
            </div>
          </div>

          {/* Panel setoran promo */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>2. Catat setoran promo dari Dompet Nadnad</h3>
              <p>
                Setelah kamu setor ke rekening/e-wallet dan mencatatnya sebagai{" "}
                <strong>Deposit</strong> di halaman Dompet, kamu bisa
                mendaftarkan nominal tersebut sebagai{" "}
                <strong>setoran promo</strong> di sini. Sistem akan
                mengkategorikan tier otomatis.
              </p>
            </div>

            <form
              onSubmit={handleSubmitPromoEntry}
              className="nanad-dashboard-deposit-form"
              style={{ marginTop: "0.9rem" }}
            >
              <label className="nanad-dashboard-deposit-amount">
                Nominal setoran promo (Rp)
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder="contoh: 1000000"
                  value={promoAmount}
                  onChange={(e) => setPromoAmount(e.target.value)}
                />
              </label>

              <div className="nanad-dashboard-deposit-row">
                <label>
                  Bulan / periode
                  <input
                    type="text"
                    placeholder="contoh: Jan 2026"
                    value={promoMonth}
                    onChange={(e) => setPromoMonth(e.target.value)}
                  />
                </label>
                <div style={{ fontSize: "0.8rem" }}>
                  Perkiraan tier:
                  <br />
                  <strong>{tierLabel(currentTier)}</strong>
                </div>
              </div>

              {promoError && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#fecaca", fontSize: "0.78rem" }}
                >
                  {promoError}
                </p>
              )}
              {promoInfo && (
                <p
                  className="nanad-dashboard-body"
                  style={{ color: "#bbf7d0", fontSize: "0.78rem" }}
                >
                  {promoInfo}
                </p>
              )}

              <button
                type="submit"
                className="nanad-dashboard-deposit-submit"
                disabled={promoLoading || !alreadyJoined}
              >
                {alreadyJoined
                  ? promoLoading
                    ? "Mencatat setoran promo..."
                    : "Catat setoran promo"
                  : "Daftar event dulu untuk mencatat setoran promo"}
              </button>

              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.6rem", fontSize: "0.78rem" }}
              >
                Catatan: form ini hanya menandai nominal mana yang ingin kamu
                ikutkan ke event sebagai dasar peluang hadiah. Dana nyata tetap
                berada di rekening / e-wallet, dan Dompet Nadnad hanya mencatat
                secara administratif.
              </p>
            </form>
          </div>
        </section>

        {/* RIWAYAT SETORAN PROMO */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>3. Riwayat setoran promo kamu</h3>
              <p>
                Daftar nominal yang pernah kamu daftarkan sebagai setoran promo
                Balance Boost, termasuk status dan bonus (jika ada).
              </p>
            </div>

            {entries.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.8rem" }}
              >
                Belum ada setoran promo tercatat. Isi form di atas untuk
                menambahkan.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.8rem" }}
              >
                <div className="nanad-dashboard-deposits-header">
                  <div>Tanggal</div>
                  <div>Nominal &amp; Tier</div>
                  <div>Periode</div>
                  <div>Status &amp; Bonus</div>
                </div>

                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="nanad-dashboard-deposits-row"
                  >
                    <div>{formatDateTime(entry.created_at)}</div>
                    <div>
                      {formatCurrency(entry.amount)} <br />
                      <small>{tierLabel(entry.tier)}</small>
                    </div>
                    <div>{entry.month_label || "-"}</div>
                    <div style={{ fontSize: "0.8rem" }}>
                      <strong>Status:</strong> {entry.status}
                      <br />
                      {entry.bonus_amount
                        ? `Bonus: ${formatCurrency(entry.bonus_amount)}`
                        : "Belum ada bonus"}
                      {entry.bonus_note && (
                        <>
                          <br />
                          <small>Catatan: {entry.bonus_note}</small>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Balance Boost Event.
          </span>
          <span>
            Event promosi bersifat terbatas dan dapat diubah/dihentikan setelah
            periode berakhir. Tidak ada janji keuntungan tetap, bonus adalah
            hadiah promosi bagi sebagian pengguna yang beruntung.
          </span>
        </footer>
      </div>
    </main>
  );
}
