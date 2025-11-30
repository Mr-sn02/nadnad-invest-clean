// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "../../../lib/supabaseClient";

// format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function ArisanGroupPage({ params }) {
  const router = useRouter();
  const groupId = params.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [contributions, setContributions] = useState([]);

  const [currentMember, setCurrentMember] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [payingRoundId, setPayingRoundId] = useState(null);
  const [winnerRoundId, setWinnerRoundId] = useState(null);
  const [winnerSelection, setWinnerSelection] = useState({}); // roundId -> memberId

  // ===== LOAD DATA AWAL =====
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) user
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

        // 2) grup
        const { data: g, error: gErr } = await supabase
          .from("arisan_groups")
          .select("*")
          .eq("id", groupId)
          .maybeSingle();

        if (gErr) {
          console.error("load group error:", gErr.message);
          setErrorMsg("Gagal memuat grup arisan.");
          return;
        }
        if (!g) {
          setErrorMsg("Grup arisan tidak ditemukan.");
          return;
        }
        setGroup(g);

        // 3) members
        const { data: mData, error: mErr } = await supabase
          .from("arisan_members")
          .select("*")
          .eq("group_id", groupId)
          .order("joined_at", { ascending: true });

        if (mErr) {
          console.error("load members error:", mErr.message);
          setErrorMsg("Gagal memuat anggota arisan.");
          return;
        }

        setMembers(mData || []);

        const me = mData?.find((m) => m.user_id === user.id) || null;
        setCurrentMember(me || null);

        // 4) rounds
        const { data: rData, error: rErr } = await supabase
          .from("arisan_rounds")
          .select("*")
          .eq("group_id", groupId)
          .order("round_number", { ascending: true });

        if (rErr) {
          console.error("load rounds error:", rErr.message);
          setErrorMsg("Gagal memuat putaran arisan.");
          return;
        }
        setRounds(rData || []);

        // 5) contributions
        const { data: cData, error: cErr } = await supabase
          .from("arisan_contributions")
          .select("*")
          .eq("group_id", groupId);

        if (cErr) {
          console.error("load contributions error:", cErr.message);
        } else {
          setContributions(cData || []);
        }

        // 6) wallet user saat ini (untuk setor iuran)
        const { data: existingWallet, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("wallet error:", wErr.message);
        }

        let currentWallet = existingWallet || null;

        if (!currentWallet) {
          const { data: created, error: cWalletErr } = await supabase
            .from("wallets")
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0,
              currency: "IDR",
            })
            .select("*")
            .single();

          if (cWalletErr) {
            console.error("create wallet error:", cWalletErr.message);
          } else {
            currentWallet = created;
          }
        }

        setWallet(currentWallet);
      } catch (err) {
        console.error("Arisan group init error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat grup arisan.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, groupId]);

  // helper: cek apakah user sudah bayar untuk round tertentu
  const hasPaidForRound = (roundId) => {
    if (!currentMember) return false;
    return contributions.some(
      (c) => c.round_id === roundId && c.member_id === currentMember.id
    );
  };

  // helper: ambil nama/email member
  const getMemberLabel = (memberId) => {
    const m = members.find((mm) => mm.id === memberId);
    if (!m) return "-";
    return m.user_email || m.user_id || "Anggota";
  };

  const isOwner = currentMember?.role === "OWNER";

  // ===== GABUNG KE GRUP =====
  const handleJoinGroup = async () => {
    if (!user || !group) return;
    if (currentMember) {
      alert("Kamu sudah menjadi anggota grup ini.");
      return;
    }

    setJoinLoading(true);
    try {
      const { data, error } = await supabase
        .from("arisan_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          user_email: user.email,
          role: "MEMBER",
        })
        .select("*")
        .single();

      if (error) {
        console.error("join group error:", error.message);
        alert("Gagal bergabung ke grup arisan.");
        return;
      }

      setCurrentMember(data);
      setMembers((prev) => [...prev, data]);
      alert("Berhasil bergabung ke grup arisan.");
    } catch (err) {
      console.error("join group unexpected error:", err);
      alert("Terjadi kesalahan saat bergabung ke grup.");
    } finally {
      setJoinLoading(false);
    }
  };

  // ===== SETOR IURAN DARI DOMPET (user sendiri) =====
  const handlePayContribution = async (round) => {
    if (!user || !group || !currentMember || !wallet) {
      alert("Data belum lengkap. Coba muat ulang halaman.");
      return;
    }

    if (round.status === "COMPLETED") {
      alert("Putaran ini sudah selesai.");
      return;
    }

    if (hasPaidForRound(round.id)) {
      alert("Kamu sudah menyetor iuran untuk putaran ini.");
      return;
    }

    const amount = group.per_round_amount;
    if (!amount || amount <= 0) {
      alert("Konfigurasi iuran per putaran tidak valid.");
      return;
    }

    if (wallet.balance < amount) {
      alert(
        `Saldo dompet kamu saat ini ${formatCurrency(
          wallet.balance
        )}. Saldo tidak cukup untuk menyetor iuran sebesar ${formatCurrency(
          amount
        )}.`
      );
      return;
    }

    try {
      setPayingRoundId(round.id);

      const before = wallet.balance;
      const after = before - amount;

      // 1) catat transaksi wallet (WITHDRAW, completed)
      const { data: tx, error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "WITHDRAW",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Setoran arisan ${group.name} putaran ke-${round.round_number}`,
          user_email: user.email,
        })
        .select("*")
        .single();

      if (txErr) {
        console.error("wallet tx error:", txErr.message);
        alert("Gagal mencatat transaksi dompet.");
        return;
      }

      // 2) update saldo wallet
      const { data: updatedWallet, error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id)
        .select("*")
        .single();

      if (wErr) {
        console.error("update wallet error:", wErr.message);
        alert(
          "Transaksi tercatat, tetapi gagal memperbarui saldo dompet. Hubungi admin."
        );
        return;
      }

      setWallet(updatedWallet);

      // 3) catat kontribusi arisan
      const { data: contrib, error: cErr } = await supabase
        .from("arisan_contributions")
        .insert({
          group_id: group.id,
          round_id: round.id,
          member_id: currentMember.id,
          amount,
          status: "PAID",
        })
        .select("*")
        .single();

      if (cErr) {
        console.error("create contribution error:", cErr.message);
        alert(
          "Saldo sudah terpotong, tetapi gagal mencatat setoran arisan. Hubungi admin."
        );
        return;
      }

      setContributions((prev) => [...prev, contrib]);

      alert(
        `Setoran arisan putaran ke-${round.round_number} berhasil dicatat dari dompet Nanad Invest kamu.`
      );
    } catch (err) {
      console.error("pay contribution error:", err);
      alert("Terjadi kesalahan saat menyetor iuran arisan.");
    } finally {
      setPayingRoundId(null);
    }
  };

  // ===== TETAPKAN PEMENANG + TOP-UP DOMPET PEMENANG (OWNER) =====
  const handleSetWinner = async (round) => {
    if (!isOwner || !group) {
      alert("Hanya pemilik grup yang dapat menetapkan pemenang.");
      return;
    }

    if (round.status === "COMPLETED" || round.winner_member_id) {
      alert("Putaran ini sudah memiliki pemenang.");
      return;
    }

    const selectedMemberId = winnerSelection[round.id];
    if (!selectedMemberId) {
      alert("Pilih anggota pemenang untuk putaran ini terlebih dahulu.");
      return;
    }

    const winnerMember = members.find((m) => m.id === selectedMemberId);
    if (!winnerMember) {
      alert("Data pemenang tidak ditemukan.");
      return;
    }

    const potAmount = group.per_round_amount * (members.length || 1);

    try {
      setWinnerRoundId(round.id);

      // 1) ambil / buat dompet pemenang
      const { data: existingWallet, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", winnerMember.user_id)
        .maybeSingle();

      if (wErr) {
        console.error("winner wallet error:", wErr.message);
        alert("Gagal memuat dompet pemenang.");
        return;
      }

      let winnerWallet = existingWallet || null;

      if (!winnerWallet) {
        const { data: created, error: cErr } = await supabase
          .from("wallets")
          .insert({
            user_id: winnerMember.user_id,
            user_email: winnerMember.user_email,
            balance: 0,
            currency: "IDR",
          })
          .select("*")
          .single();

        if (cErr) {
          console.error("create winner wallet error:", cErr.message);
          alert("Gagal membuat dompet untuk pemenang.");
          return;
        }
        winnerWallet = created;
      }

      const before = winnerWallet.balance ?? 0;
      const after = before + potAmount;

      // 2) catat transaksi dompet (DEPOSIT ke pemenang)
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: winnerWallet.id,
          type: "DEPOSIT",
          amount: potAmount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `Pencairan arisan ${group.name} putaran ke-${round.round_number}`,
          user_email: winnerMember.user_email,
        });

      if (txErr) {
        console.error("winner tx error:", txErr.message);
        alert("Gagal mencatat transaksi dompet pemenang.");
        return;
      }

      // 3) update saldo dompet pemenang
      const { error: updErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", winnerWallet.id);

      if (updErr) {
        console.error("update winner wallet error:", updErr.message);
        alert(
          "Pencairan tercatat, tetapi gagal memperbarui saldo dompet pemenang. Hubungi admin."
        );
        return;
      }

      // 4) update putaran: tetapkan pemenang + status COMPLETED
      const { data: updatedRound, error: rErr } = await supabase
        .from("arisan_rounds")
        .update({
          winner_member_id: winnerMember.id,
          status: "COMPLETED",
        })
        .eq("id", round.id)
        .select("*")
        .single();

      if (rErr) {
        console.error("update round error:", rErr.message);
        alert("Gagal memperbarui status putaran arisan.");
        return;
      }

      setRounds((prev) =>
        prev.map((r) => (r.id === updatedRound.id ? updatedRound : r))
      );

      alert(
        `Pemenang putaran ke-${round.round_number} ditetapkan.\nSaldo dompet pemenang telah ditambahkan ${formatCurrency(
          potAmount
        )}.`
      );
    } catch (err) {
      console.error("set winner error:", err);
      alert("Terjadi kesalahan saat menetapkan pemenang.");
    } finally {
      setWinnerRoundId(null);
    }
  };

  // ===== RENDER LOADING / ERROR =====
  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat grup arisan...</p>
        </div>
      </main>
    );
  }

  if (!group || errorMsg === "Grup arisan tidak ditemukan.") {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">{errorMsg}</p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={() => router.push("/arisan")}
              style={{ marginTop: "0.75rem" }}
            >
              Kembali ke daftar arisan
            </button>
          </section>
        </div>
      </main>
    );
  }

  // ===== RENDER UTAMA =====
  return (
    <main className="nanad-dashboard-page">
      <div className="nanad-dashboard-shell">
        {/* Header */}
        <header className="nanad-dashboard-header">
          <div className="nanad-dashboard-brand">
            <div className="nanad-dashboard-logo">N</div>
            <div>
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Arisan · {group.name}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/arisan")}
            >
              Kembali ke daftar arisan
            </button>
            <button
              type="button"
              className="nanad-dashboard-logout"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard utama
            </button>
          </div>
        </header>

        {/* Info grup */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Detail grup</p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            ID Grup: <strong>{group.group_code}</strong> · Iuran per putaran:{" "}
            <strong>{formatCurrency(group.per_round_amount)}</strong> · Total
            putaran:{" "}
            <strong>{group.total_rounds}</strong>{" "}
            {group.start_date && (
              <>
                · Mulai:{" "}
                {new Date(group.start_date).toLocaleDateString("id-ID")}
              </>
            )}
          </p>

          {currentMember ? (
            <p className="nanad-dashboard-body" style={{ marginTop: "0.4rem" }}>
              Kamu tergabung sebagai{" "}
              <strong>
                {currentMember.role === "OWNER" ? "pemilik grup" : "anggota"}
              </strong>
              . Saldo dompet kamu saat ini{" "}
              <strong>
                {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
              </strong>
              .
            </p>
          ) : (
            <div
              style={{
                marginTop: "0.6rem",
                padding: "0.75rem 0.9rem",
                borderRadius: "1rem",
                border: "1px solid rgba(248,250,252,0.16)",
                background:
                  "radial-gradient(circle at top, rgba(248,250,252,0.05), rgba(15,23,42,1))",
              }}
            >
              <p className="nanad-dashboard-body" style={{ margin: 0 }}>
                Kamu belum tergabung sebagai anggota grup ini. Untuk dapat
                menyetor iuran dan berkesempatan menjadi pemenang putaran,
                silakan gabung terlebih dahulu.
              </p>
              <button
                type="button"
                className="nanad-dashboard-deposit-submit"
                style={{ marginTop: "0.6rem" }}
                disabled={joinLoading}
                onClick={handleJoinGroup}
              >
                {joinLoading ? "Memproses..." : "Gabung ke grup ini"}
              </button>
            </div>
          )}

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.4rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* Dua kolom: Putaran & Anggota */}
        <section className="nanad-dashboard-table-section">
          {/* Putaran & iuran */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran & iuran</h3>
              <p>
                Setoran iuran dilakukan dari saldo dompet Nanad Invest. Pemenang
                putaran akan menerima saldo otomatis sesuai total iuran putaran.
              </p>
            </div>

            {rounds.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada putaran tercatat untuk grup ini.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((round) => {
                  const paid = hasPaidForRound(round.id);
                  const winnerLabel = round.winner_member_id
                    ? getMemberLabel(round.winner_member_id)
                    : null;

                  return (
                    <div key={round.id} className="nanad-dashboard-deposits-row">
                      <div>
                        Putaran ke-{round.round_number}
                        <br />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color:
                              round.status === "COMPLETED"
                                ? "#4ade80"
                                : "#facc15",
                          }}
                        >
                          {round.status === "COMPLETED"
                            ? "Selesai"
                            : "Belum selesai"}
                        </span>
                        {round.scheduled_date && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.75rem" }}>
                              Jadwal:{" "}
                              {new Date(
                                round.scheduled_date
                              ).toLocaleDateString("id-ID")}
                            </span>
                          </>
                        )}
                      </div>

                      <div>
                        Iuran per peserta:{" "}
                        <strong>
                          {formatCurrency(group.per_round_amount)}
                        </strong>
                        <br />
                        Total peserta saat ini:{" "}
                        <strong>{members.length}</strong>
                        <br />
                        Total dana putaran (simulasi):{" "}
                        <strong>
                          {formatCurrency(
                            group.per_round_amount * (members.length || 1)
                          )}
                        </strong>
                        {winnerLabel && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.8rem" }}>
                              Pemenang: <strong>{winnerLabel}</strong>
                            </span>
                          </>
                        )}
                        {currentMember && (
                          <>
                            <br />
                            <span style={{ fontSize: "0.8rem" }}>
                              Statusmu:{" "}
                              {paid
                                ? "Sudah menyetor iuran putaran ini."
                                : "Belum menyetor iuran putaran ini."}
                            </span>
                          </>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {/* Tombol setor iuran (user masuk & putaran belum selesai) */}
                        {currentMember && round.status !== "COMPLETED" && (
                          <button
                            type="button"
                            className="nanad-dashboard-deposit-submit"
                            disabled={payingRoundId === round.id || paid}
                            onClick={() => handlePayContribution(round)}
                          >
                            {paid
                              ? "Sudah setor"
                              : payingRoundId === round.id
                              ? "Memproses..."
                              : "Setor iuran"}
                          </button>
                        )}

                        {/* Area pemilihan pemenang (owner) */}
                        {isOwner && round.status !== "COMPLETED" && (
                          <div style={{ marginTop: "0.3rem" }}>
                            <select
                              value={winnerSelection[round.id] || ""}
                              onChange={(e) =>
                                setWinnerSelection((prev) => ({
                                  ...prev,
                                  [round.id]: e.target.value || undefined,
                                }))
                              }
                              style={{
                                width: "100%",
                                borderRadius: "999px",
                                border:
                                  "1px solid rgba(148,163,184,0.7)",
                                background:
                                  "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,1))",
                                padding: "0.3rem 0.6rem",
                                fontSize: "0.75rem",
                                color: "white",
                                marginBottom: "0.25rem",
                              }}
                            >
                              <option value="">Pilih pemenang…</option>
                              {members.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.user_email || m.user_id}
                                  {m.role === "OWNER" ? " (Owner)" : ""}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="nanad-dashboard-logout"
                              disabled={winnerRoundId === round.id}
                              onClick={() => handleSetWinner(round)}
                            >
                              {winnerRoundId === round.id
                                ? "Memproses…"
                                : "Tetapkan pemenang"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daftar anggota */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup</h3>
              <p>Daftar seluruh anggota arisan beserta perannya.</p>
            </div>

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota yang tergabung.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {members.map((m) => (
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>
                      Bergabung{" "}
                      {m.joined_at
                        ? new Date(m.joined_at).toLocaleDateString("id-ID")
                        : "-"}
                    </div>
                    <div>
                      <strong>{m.user_email || m.user_id}</strong>
                      <br />
                      <span style={{ fontSize: "0.8rem" }}>
                        {m.role === "OWNER" ? "Pemilik grup" : "Anggota"}
                      </span>
                    </div>
                    <div />
                  </div>
                ))}
              </div>
            )}

            <p
              className="nanad-dashboard-body"
              style={{ fontSize: "0.75rem", marginTop: "0.8rem" }}
            >
              Pengaturan anggota lanjutan (misalnya mengeluarkan anggota,
              mengganti urutan penerima, dsb.) dapat didiskusikan dan
              disepakati di luar aplikasi. Modul ini berfokus pada pencatatan,
              bukan pengaturan hukum.
            </p>
          </div>
        </section>

        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Setiap pencairan arisan di sini bersifat simulasi saldo di dalam
            Nanad Invest. Pastikan aliran dana nyata tetap dicatat dan
            diawasi sesuai kesepakatan bersama.
          </span>
        </footer>
      </div>
    </main>
  );
}
