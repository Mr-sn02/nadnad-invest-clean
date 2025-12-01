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

export default function BalanceBoostJoinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [participant, setParticipant] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Sesuaikan ini manual
  const promoPeriodLabel = "Periode contoh: 1 Januari – 31 Maret 2026";

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");
      setInfoMsg("");

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
            Daftar sebagai peserta &amp; lanjut setor lewat Dompet Nadnad.
          </h1>
          <p className="nanad-dashboard-body">
            Halaman ini hanya mencatat bahwa akun kamu{" "}
            <strong>ikut serta</strong> dalam <strong>Balance Boost Event</strong>. Setelah
            terdaftar, setoran ke <strong>Dompet Nadnad</strong> selama periode promo
            akan dipakai sebagai dasar perhitungan peluang hadiah,{" "}
            <strong>tanpa janji keuntungan pasti</strong>.
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

        {/* AKSI: DAFTAR + SETOR */}
        <section className="nanad-dashboard-table-section">
          {/* Panel daftar event */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>1. Daftar sebagai peserta Balance Boost</h3>
              <p>
                Cukup satu kali klik untuk 1 akun selama periode promo. Setelah
                itu kamu tinggal setor seperti biasa lewat halaman Dompet.
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
                  Bonus, bila ada, akan dicatat sebagai transaksi khusus di
                  dompetmu (misalnya label: <strong>BONUS_PROMO</strong>).
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

          {/* Panel setor lewat Dompet */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>2. Lanjut setor lewat Dompet Nadnad</h3>
              <p>
                Semua setoran tetap dilakukan di luar aplikasi (bank/e-wallet),
                lalu dicatat di halaman Dompet sebagai deposit.
              </p>
            </div>

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.86rem" }}
            >
              <ol style={{ paddingLeft: "1.25rem", marginBottom: "0.75rem" }}>
                <li>
                  Transfer nyata ke rekening yang kamu gunakan sesuai
                  kesepakatan pengelolaan dana.
                </li>
                <li>
                  Buka halaman <strong>Wallet / Dompet Nadnad</strong>.
                </li>
                <li>
                  Ajukan <strong>Deposit</strong>, isi nominal sesuai transfer,
                  unggah bukti, dan tunggu approval admin.
                </li>
              </ol>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
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

              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.6rem", fontSize: "0.78rem" }}
              >
                Dompet Nadnad hanya{" "}
                <strong>alat pencatatan &amp; simulasi</strong>. Dana nyata
                tetap berada di rekening resmi kamu / pengelola. Event ini
                adalah bentuk apresiasi, bukan kontrak investasi.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Dompet Nadnad. Balance Boost Event.
          </span>
          <span>
            Event promosi bersifat terbatas dan dapat diubah/dihentikan setelah
            periode berakhir. Tidak ada janji keuntungan tetap.
          </span>
        </footer>
      </div>
    </main>
  );
}
