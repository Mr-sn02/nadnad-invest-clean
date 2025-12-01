// app/admin/promo-balance-boost/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

// daftar admin (sementara, sama seperti halaman admin lain)
const ADMIN_EMAILS = ["sonnnn603@gmail.com"];

function formatCurrency(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function PromoBalanceBoostAdminPage() {
  const router = useRouter();

  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [events, setEvents] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState({}); // id -> { basePaid, bonusPaid }

  // form cicilan per-event: id -> { base, bonus, note }
  const [formByEvent, setFormByEvent] = useState({});
  const [sendingId, setSendingId] = useState(null);

  // --- LOAD ADMIN + DATA ---
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

        setAdminUser(user);

        const adminFlag =
          !!user.email && ADMIN_EMAILS.includes(user.email);
        setIsAdmin(adminFlag);

        if (!adminFlag) {
          setErrorMsg(
            "Halaman ini hanya dapat diakses oleh admin Dompet Nadnad."
          );
          return;
        }

        // load promo_events
        const { data: evs, error: evErr } = await supabase
          .from("promo_events")
          .select("*")
          .order("joined_at", { ascending: false });

        if (evErr) {
          console.error("Load promo_events error:", evErr.message);
          setErrorMsg("Gagal memuat data promo_events.");
          return;
        }

        setEvents(evs || []);

        // kalau tidak ada event, selesai
        if (!evs || evs.length === 0) {
          setPayoutSummary({});
          return;
        }

        const ids = evs.map((e) => e.id);

        // load semua payout untuk event-event ini
        const { data: pays, error: payErr } = await supabase
          .from("promo_payouts")
          .select("promo_event_id, amount_base, amount_bonus")
          .in("promo_event_id", ids);

        if (payErr) {
          console.error("Load promo_payouts error:", payErr.message);
          setErrorMsg(
            "Gagal memuat data pencairan promo. Cek console/log."
          );
          return;
        }

        const sums = {};
        (pays || []).forEach((p) => {
          const id = p.promo_event_id;
          if (!sums[id]) {
            sums[id] = { basePaid: 0, bonusPaid: 0 };
          }
          sums[id].basePaid += Number(p.amount_base) || 0;
          sums[id].bonusPaid += Number(p.amount_bonus) || 0;
        });

        setPayoutSummary(sums);
      } catch (err) {
        console.error("Admin promo init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat halaman admin promo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleInputChange = (eventId, field, value) => {
    setFormByEvent((prev) => {
      const current = prev[eventId] || { base: "", bonus: "", note: "" };
      return {
        ...prev,
        [eventId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSendPayout = async (ev) => {
    if (!adminUser || !isAdmin) return;

    const currentForm = formByEvent[ev.id] || {
      base: "",
      bonus: "",
      note: "",
    };

    const base = Number(currentForm.base) || 0;
    const bonus = Number(currentForm.bonus) || 0;
    const note = (currentForm.note || "").trim();

    if (base <= 0 && bonus <= 0) {
      alert("Isi minimal nominal pokok atau bonus (>0) untuk dikirim.");
      return;
    }

    const sum = payoutSummary[ev.id] || { basePaid: 0, bonusPaid: 0 };
    const alreadyBase = Number(sum.basePaid) || 0;
    const remainingBase = Math.max(
      0,
      Number(ev.base_amount) - alreadyBase
    );

    if (base > remainingBase && remainingBase > 0) {
      const ok = confirm(
        `Nominal pokok hari ini (${formatCurrency(
          base
        )}) melebihi sisa pokok yang belum dikembalikan (${formatCurrency(
          remainingBase
        )}). Lanjutkan?`
      );
      if (!ok) return;
    }

    setSendingId(ev.id);

    try {
      // 1) ambil dompet user
      const { data: walletRow, error: walletErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", ev.wallet_id)
        .single();

      if (walletErr || !walletRow) {
        console.error("Load wallet for payout error:", walletErr?.message);
        alert("Gagal memuat dompet user. Cicilan tidak dikirim.");
        return;
      }

      const payoutTotal = base + bonus;
      const newBalance = (walletRow.balance || 0) + payoutTotal;

      // 2) update saldo dompet
      const { error: updateErr } = await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletRow.id);

      if (updateErr) {
        console.error("Update wallet balance error:", updateErr.message);
        alert(
          "Gagal mengubah saldo dompet. Cicilan tidak dikirim. Coba lagi."
        );
        return;
      }

      // 3) catat ke promo_payouts
      const { error: payoutErr } = await supabase
        .from("promo_payouts")
        .insert({
          promo_event_id: ev.id,
          user_id: ev.user_id,
          wallet_id: ev.wallet_id,
          amount_base: base,
          amount_bonus: bonus,
          admin_id: adminUser.id,
          admin_email: adminUser.email,
          note: note || null,
        });

      if (payoutErr) {
        console.error("Insert promo_payouts error:", payoutErr.message);
        alert(
          "Saldo sudah diperbarui, tetapi gagal menyimpan log promo_payouts. Cek manual di database."
        );
      }

      // 4) catat ke wallet_transactions
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: ev.wallet_id,
          type: "ADJUST",
          amount: payoutTotal,
          status: "COMPLETED",
          user_email: ev.user_email,
          note: `Pencairan promo Balance Boost (pokok: ${formatCurrency(
            base
          )}, bonus: ${formatCurrency(bonus)})`,
          admin_note: note || null,
        });

      if (txErr) {
        console.error(
          "Insert wallet_transactions (payout) error:",
          txErr.message
        );
        alert(
          "Saldo sudah diperbarui, tetapi gagal mencatat transaksi dompet. Cek manual di database."
        );
      }

      // 5) update status event jika pokok sudah lunas
      const newBasePaid = alreadyBase + base;
      const newBonusPaid = (sum.bonusPaid || 0) + bonus;

      let newStatus = ev.status;
      if (
        Number(ev.base_amount) > 0 &&
        newBasePaid >= Number(ev.base_amount)
      ) {
        newStatus = "COMPLETED";

        const { error: evUpdateErr } = await supabase
          .from("promo_events")
          .update({
            status: "COMPLETED",
          })
          .eq("id", ev.id);

        if (evUpdateErr) {
          console.error(
            "Update promo_events status error:",
            evUpdateErr.message
          );
          alert(
            "Cicilan terkirim, tapi gagal memperbarui status event menjadi COMPLETED. Cek manual di database."
          );
        }
      }

      // 6) update state lokal
      setPayoutSummary((prev) => ({
        ...prev,
        [ev.id]: {
          basePaid: newBasePaid,
          bonusPaid: newBonusPaid,
        },
      }));

      setEvents((prev) =>
        prev.map((x) =>
          x.id === ev.id
            ? {
                ...x,
                status: newStatus,
              }
            : x
        )
      );

      // kosongkan form untuk event ini
      setFormByEvent((prev) => ({
        ...prev,
        [ev.id]: { base: "", bonus: "", note: "" },
      }));

      alert(
        `Cicilan promo telah dikirim ke Dompet Nadnad user.\n` +
          `Pokok: ${formatCurrency(base)} · Bonus: ${formatCurrency(
            bonus
          )}.`
      );
    } catch (err) {
      console.error("Send payout unexpected error:", err);
      alert("Terjadi kesalahan saat mengirim cicilan promo.");
    } finally {
      setSendingId(null);
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">
            Memuat halaman admin Balance Boost...
          </p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Admin only</p>
            <h1 className="nanad-dashboard-heading">
              Akses ditolak untuk halaman admin promo.
            </h1>
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca" }}
            >
              {errorMsg ||
                "Hanya akun yang terdaftar sebagai admin Dompet Nadnad yang dapat membuka halaman ini."}
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

  if (errorMsg) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Admin promo error</p>
            <h1 className="nanad-dashboard-heading">
              Gagal memuat data promo Balance Boost.
            </h1>
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca" }}
            >
              {errorMsg}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const activeEvents = events.filter((e) => e.status === "ACTIVE");
  const nonActiveEvents = events.filter((e) => e.status !== "ACTIVE");

  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* HEADER */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">
                Dompet Nadnad · Admin
              </p>
              <p className="nanad-dashboard-brand-sub">
                Panel cicilan harian promo Balance Boost
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <Link href="/dashboard" className="nanad-dashboard-logout">
              Dashboard
            </Link>
            <Link href="/wallet" className="nanad-dashboard-logout">
              Dompet pengguna
            </Link>
            <Link
              href="/promo/balance-boost"
              className="nanad-dashboard-logout"
            >
              Halaman promo user
            </Link>
          </div>
        </header>

        {/* INTRO */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Admin · Balance Boost</p>
          <h1 className="nanad-dashboard-heading">
            Kelola pengembalian pokok &amp; bonus promo secara manual.
          </h1>
          <p className="nanad-dashboard-body">
            Dari panel ini, admin dapat mengirim cicilan harian ke Dompet
            Nadnad masing-masing user berdasarkan event promo yang mereka
            ikuti. Setiap pengiriman akan:
          </p>
          <ul
            className="nanad-dashboard-body"
            style={{ paddingLeft: "1.1rem", marginTop: "0.4rem" }}
          >
            <li>
              Menambah saldo Dompet Nadnad user (pokok + bonus, jika ada).
            </li>
            <li>
              Mencatat log di tabel <code>promo_payouts</code>.
            </li>
            <li>
              Mencatat transaksi di <code>wallet_transactions</code>.
            </li>
            <li>
              Menandai event menjadi <strong>COMPLETED</strong> jika pokok
              telah dikembalikan penuh.
            </li>
          </ul>
        </section>

        {/* AKTIF */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Event aktif (status = ACTIVE)</h3>
              <p>
                Gunakan kolom di kanan setiap baris untuk mengirim cicilan
                harian. Nominal pokok + bonus fleksibel sesuai strategi promo.
              </p>
            </div>

            {activeEvents.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada event promo berstatus ACTIVE.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {activeEvents.map((ev) => {
                  const sum = payoutSummary[ev.id] || {
                    basePaid: 0,
                    bonusPaid: 0,
                  };
                  const basePaid = Number(sum.basePaid) || 0;
                  const bonusPaid = Number(sum.bonusPaid) || 0;
                  const remainingBase = Math.max(
                    0,
                    Number(ev.base_amount) - basePaid
                  );

                  const form = formByEvent[ev.id] || {
                    base: "",
                    bonus: "",
                    note: "",
                  };

                  return (
                    <div key={ev.id} className="nanad-dashboard-deposits-row">
                      {/* INFO USER + EVENT */}
                      <div>
                        <strong>{ev.user_email || ev.user_id}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "0.78rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {ev.tier} · EVENT AKTIF
                        </span>
                        <br />
                        <small>
                          Bergabung:{" "}
                          {new Date(ev.joined_at).toLocaleString("id-ID")}
                        </small>
                        <br />
                        <small>ID event: {ev.id}</small>
                      </div>

                      {/* RINGKASAN POKOK/BONUS */}
                      <div style={{ fontSize: "0.8rem" }}>
                        <p style={{ margin: 0 }}>
                          Pokok disetor:{" "}
                          <strong>{formatCurrency(ev.base_amount)}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Pokok sudah dikembalikan:{" "}
                          <strong>{formatCurrency(basePaid)}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Sisa pokok:{" "}
                          <strong>{formatCurrency(remainingBase)}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Total bonus sudah dibayar:{" "}
                          <strong>{formatCurrency(bonusPaid)}</strong>
                        </p>
                        {ev.note && (
                          <p
                            style={{
                              marginTop: "0.25rem",
                              marginBottom: 0,
                              opacity: 0.9,
                            }}
                          >
                            Catatan user: {ev.note}
                          </p>
                        )}
                      </div>

                      {/* FORM CICILAN HARI INI */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          fontSize: "0.8rem",
                          minWidth: "240px",
                        }}
                      >
                        <label>
                          Pokok hari ini
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={form.base}
                            onChange={(e) =>
                              handleInputChange(
                                ev.id,
                                "base",
                                e.target.value
                              )
                            }
                            placeholder="contoh: 100000"
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label>
                          Bonus hari ini
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={form.bonus}
                            onChange={(e) =>
                              handleInputChange(
                                ev.id,
                                "bonus",
                                e.target.value
                              )
                            }
                            placeholder="boleh 0 kalau tidak ada"
                            style={{ width: "100%" }}
                          />
                        </label>
                        <label>
                          Catatan admin
                          <input
                            type="text"
                            value={form.note}
                            onChange={(e) =>
                              handleInputChange(
                                ev.id,
                                "note",
                                e.target.value
                              )
                            }
                            placeholder="misal: cicilan hari ke-3"
                            style={{ width: "100%" }}
                          />
                        </label>

                        <button
                          type="button"
                          className="nanad-dashboard-deposit-submit"
                          style={{
                            fontSize: "0.78rem",
                            padding: "0.45rem 0.9rem",
                            marginTop: "0.15rem",
                          }}
                          disabled={sendingId === ev.id}
                          onClick={() => handleSendPayout(ev)}
                        >
                          {sendingId === ev.id
                            ? "Memproses..."
                            : "Kirim cicilan hari ini"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* EVENT SELESAI / NON-AKTIF */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Event selesai / non-aktif</h3>
              <p>
                Daftar event dengan status <strong>COMPLETED</strong> atau{" "}
                <strong>CANCELLED</strong>. Hanya untuk arsip; tidak bisa
                dikirimi cicilan baru.
              </p>
            </div>

            {nonActiveEvents.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada event yang selesai atau dibatalkan.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{
                  marginTop: "0.75rem",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                {nonActiveEvents.map((ev) => {
                  const sum = payoutSummary[ev.id] || {
                    basePaid: 0,
                    bonusPaid: 0,
                  };
                  const basePaid = Number(sum.basePaid) || 0;
                  const bonusPaid = Number(sum.bonusPaid) || 0;

                  return (
                    <div key={ev.id} className="nanad-dashboard-deposits-row">
                      <div>
                        <strong>{ev.user_email || ev.user_id}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "0.78rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {ev.tier} · {ev.status}
                        </span>
                        <br />
                        <small>
                          Bergabung:{" "}
                          {new Date(ev.joined_at).toLocaleString("id-ID")}
                        </small>
                        <br />
                        <small>ID event: {ev.id}</small>
                      </div>
                      <div style={{ fontSize: "0.8rem" }}>
                        <p style={{ margin: 0 }}>
                          Pokok disetor:{" "}
                          <strong>{formatCurrency(ev.base_amount)}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Total pokok dikembalikan:{" "}
                          <strong>{formatCurrency(basePaid)}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                          Total bonus dibayar:{" "}
                          <strong>{formatCurrency(bonusPaid)}</strong>
                        </p>
                        {ev.note && (
                          <p
                            style={{
                              marginTop: "0.25rem",
                              marginBottom: 0,
                              opacity: 0.9,
                            }}
                          >
                            Catatan user: {ev.note}
                          </p>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          opacity: 0.85,
                          textAlign: "right",
                        }}
                      >
                        Event ini sudah tidak menerima cicilan baru. Jika
                        perlu koreksi manual, lakukan melalui halaman
                        &quot;Kelola dompet&quot; dan beri catatan administrasi
                        yang jelas.
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
            © {new Date().getFullYear()} Dompet Nadnad · Admin promo Balance
            Boost.
          </span>
          <span>
            Gunakan panel ini dengan hati-hati. Selalu cocokan kembali total
            cicilan dan bonus dengan rencana promo awal agar dana bakar tetap
            terkontrol.
          </span>
        </footer>
      </div>
    </main>
  );
}
