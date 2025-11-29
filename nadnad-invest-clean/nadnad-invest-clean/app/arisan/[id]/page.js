// app/arisan/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";

// Format rupiah
function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Format tanggal singkat
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArisanDetailPage() {
  const router = useRouter();
  const params = useParams(); // { id: '12345' }
  const rawId = params?.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [role, setRole] = useState(null);

  const [wallet, setWallet] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [processingRound, setProcessingRound] = useState(null);

  const [members, setMembers] = useState([]);
  const [joining, setJoining] = useState(false);

  // ====== LOAD USER + GROUP + WALLET + MEMBERS ======
  useEffect(() => {
    if (!rawId) return;

    const load = async () => {
      setLoading(true);
      setErrorMsg("");
      setNotFound(false);

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

        const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
        const isCode = /^\d{5}$/.test(idStr); // 5 digit = group_code

        // 2) ambil grup
        let query = supabase.from("arisan_groups").select("*");

        if (isCode) {
          query = query.eq("group_code", idStr);
        } else {
          query = query.eq("id", idStr);
        }

        const { data: g, error: gErr } = await query.maybeSingle();

        if (gErr) {
          console.error("Load group error:", gErr.message);
          setErrorMsg("Gagal memuat grup arisan.");
          return;
        }

        if (!g) {
          setNotFound(true);
          return;
        }

        setGroup(g);

        // 3) cek membership user di grup ini
        const { data: mem, error: mErr } = await supabase
          .from("arisan_memberships")
          .select("id, role, user_id, user_email, display_name")
          .eq("group_id", g.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (mErr) {
          console.error("Load membership error:", mErr.message);
        }

        setRole(mem?.role || null);

        // 4) load semua anggota grup
        const { data: membersData, error: membersErr } = await supabase
          .from("arisan_memberships")
          .select("id, role, user_id, user_email, display_name")
          .eq("group_id", g.id)
          .order("created_at", { ascending: true });

        if (membersErr) {
          console.error("Load members error:", membersErr.message);
        }
        setMembers(membersData || []);

        // 5) ambil / buat wallet user
        let currentWallet = null;
        const { data: w, error: wErr } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wErr) {
          console.error("Load wallet error:", wErr.message);
        }

        if (w) {
          currentWallet = w;
        } else {
          const { data: created, error: createErr } = await supabase
            .from("wallets")
            .insert({
              user_id: user.id,
              user_email: user.email,
              balance: 0,
              currency: "IDR",
            })
            .select("*")
            .single();

          if (createErr) {
            console.error("Create wallet error:", createErr.message);
          } else {
            currentWallet = created;
          }
        }

        setWallet(currentWallet);

        // 6) cek putaran yang sudah pernah dibayar
        const paidSet = new Set();

        if (currentWallet) {
          const { data: txs, error: txErr } = await supabase
            .from("wallet_transactions")
            .select("note")
            .eq("wallet_id", currentWallet.id)
            .like("note", `ARISAN:${g.id}:%`);

          if (txErr) {
            console.error("Load arisan tx error:", txErr.message);
          } else if (txs) {
            txs.forEach((t) => {
              const note = t.note || "";
              const parts = note.split(":"); // ARISAN:<group_id>:<round>
              const roundNum = Number(parts[2]);
              if (!Number.isNaN(roundNum)) {
                paidSet.add(roundNum);
              }
            });
          }
        }

        // 7) buat jadwal putaran
        const roundsArr = [];
        const start = g.start_date ? new Date(g.start_date) : null;

        for (let i = 1; i <= (g.total_rounds || 0); i++) {
          let dateStr = "-";
          if (start) {
            const d = new Date(start);
            d.setMonth(d.getMonth() + (i - 1)); // asumsi bulanan
            dateStr = d.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          }
          roundsArr.push({
            number: i,
            date: dateStr,
            amount: g.monthly_amount,
            paid: paidSet.has(i),
          });
        }

        setRounds(roundsArr);
      } catch (err) {
        console.error("Arisan detail error:", err);
        setErrorMsg("Terjadi kesalahan saat memuat grup arisan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [rawId, router]);

  // ====== GABUNG GRUP ======
  const handleJoinGroup = async () => {
    if (!group || !user) return;
    if (role) {
      alert("Kamu sudah terdaftar di grup ini.");
      return;
    }

    try {
      setJoining(true);

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email ? user.email.split("@")[0] : "Member");

      const { data: inserted, error } = await supabase
        .from("arisan_memberships")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "MEMBER",
          user_email: user.email,
          display_name: displayName,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Join group error:", error.message);
        alert("Gagal bergabung ke grup arisan.");
        return;
      }

      setRole("MEMBER");
      setMembers((prev) => [...prev, inserted]);
      alert("Berhasil bergabung sebagai peserta arisan.");
    } catch (err) {
      console.error("Join group error:", err);
      alert("Terjadi kesalahan saat bergabung ke grup arisan.");
    } finally {
      setJoining(false);
    }
  };

  // ====== SETOR IURAN PUTARAN DARI WALLET ======
  const handlePayRound = async (roundNumber) => {
    if (!wallet || !group || !user) {
      alert(
        "Wallet atau data pengguna belum siap. Coba refresh halaman atau buka halaman Wallet dulu."
      );
      return;
    }

    const round = rounds.find((r) => r.number === roundNumber);
    if (!round) return;

    if (round.paid) {
      alert("Putaran ini sudah tercatat lunas.");
      return;
    }

    const amount = group.monthly_amount || 0;
    const currentBalance = wallet.balance || 0;

    if (!amount || amount <= 0) {
      alert("Nominal iuran arisan tidak valid.");
      return;
    }

    if (currentBalance < amount) {
      alert(
        `Saldo dompet kamu belum cukup. Saldo sekarang ${formatCurrency(
          currentBalance
        )}, sedangkan iuran putaran ini ${formatCurrency(amount)}.`
      );
      return;
    }

    try {
      setProcessingRound(roundNumber);

      const before = currentBalance;
      const after = before - amount;

      // 1) catat transaksi
      const { error: txErr } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          type: "WITHDRAW",
          amount,
          balance_before: before,
          balance_after: after,
          status: "COMPLETED",
          note: `ARISAN:${group.id}:${roundNumber}`,
          user_email: user.email || null,
        });

      if (txErr) {
        console.error("Insert wallet tx error:", txErr.message);
        alert("Gagal mencatat transaksi dompet.");
        return;
      }

      // 2) update saldo wallet
      const { error: wErr } = await supabase
        .from("wallets")
        .update({ balance: after })
        .eq("id", wallet.id);

      if (wErr) {
        console.error("Update wallet error:", wErr.message);
        alert(
          "Transaksi tercatat, tapi gagal memperbarui saldo dompet. Hubungi admin."
        );
      }

      // 3) update state lokal
      setWallet((prev) => (prev ? { ...prev, balance: after } : prev));
      setRounds((prev) =>
        prev.map((r) =>
          r.number === roundNumber ? { ...r, paid: true } : r
        )
      );

      alert(
        `Setoran iuran putaran ke-${roundNumber} berhasil dicatat dari saldo wallet kamu.`
      );
    } catch (err) {
      console.error("Pay round error:", err);
      alert("Terjadi kesalahan saat menyetor iuran arisan.");
    } finally {
      setProcessingRound(null);
    }
  };

  // ============= RENDER =============

  if (loading) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <p className="nanad-dashboard-body">Memuat detail arisan...</p>
        </div>
      </main>
    );
  }

  if (notFound || !group) {
    return (
      <main className="nanad-dashboard-page">
        <div className="nanad-dashboard-shell">
          <section className="nanad-dashboard-welcome">
            <p className="nanad-dashboard-eyebrow">Arisan error</p>
            <h1 className="nanad-dashboard-heading">
              Grup arisan tidak ditemukan.
            </h1>
            <p className="nanad-dashboard-body">
              Grup arisan tidak ditemukan. Pastikan kamu menggunakan ID grup
              yang benar atau minta ulang ID dari pemilik grup.
            </p>
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              style={{ marginTop: "0.9rem" }}
              onClick={() => router.push("/arisan")}
            >
              Kembali ke daftar arisan
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
              <p className="nanad-dashboard-brand-title">Nanad Invest</p>
              <p className="nanad-dashboard-brand-sub">
                Detail grup arisan · {group.group_code}
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
          </div>
        </header>

        {/* INFO GRUP */}
        <section className="nanad-dashboard-welcome">
          <p className="nanad-dashboard-eyebrow">Grup arisan</p>
          <h1 className="nanad-dashboard-heading">{group.name}</h1>
          <p className="nanad-dashboard-body">
            ID Grup: <strong>{group.group_code}</strong>{" "}
            · Iuran per putaran:{" "}
            <strong>{formatCurrency(group.monthly_amount)}</strong>{" "}
            · Total putaran: <strong>{group.total_rounds}</strong>
            {group.start_date && (
              <>
                {" "}
                · Mulai: <strong>{formatDate(group.start_date)}</strong>
              </>
            )}
          </p>

          <p className="nanad-dashboard-body" style={{ marginTop: "0.4rem" }}>
            Posisi kamu di grup ini:{" "}
            <strong>{role ? role : "belum terdaftar sebagai member (viewer)"}</strong>.
          </p>

          {!role && (
            <button
              type="button"
              className="nanad-dashboard-deposit-submit"
              onClick={handleJoinGroup}
              disabled={joining}
              style={{ marginTop: "0.75rem" }}
            >
              {joining ? "Memproses..." : "Gabung sebagai peserta arisan"}
            </button>
          )}

          {/* Ringkasan wallet */}
          <div className="nanad-dashboard-stat-grid" style={{ marginTop: "1rem" }}>
            <div className="nanad-dashboard-stat-card">
              <p className="nanad-dashboard-stat-label">Saldo dompet kamu</p>
              <p className="nanad-dashboard-stat-number">
                {wallet ? formatCurrency(wallet.balance || 0) : "Wallet belum aktif"}
              </p>
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.3rem" }}
              >
                Setoran iuran arisan akan mengurangi saldo dompet Nanad Invest
                kamu dan tercatat sebagai transaksi{" "}
                <strong>WITHDRAW</strong> dengan catatan khusus.
              </p>
            </div>
          </div>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.5rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* JADWAL PUTARAN & ANGGOTA */}
        <section className="nanad-dashboard-table-section">
          {/* Kolom kiri: jadwal & setor */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran &amp; setoran iuran</h3>
              <p>
                Jadwal dibuat sederhana berdasarkan tanggal mulai (jika diisi)
                dengan asumsi putaran bulanan. Kamu bisa mencatat setoran
                langsung dari saldo wallet untuk tiap putaran.
              </p>
            </div>

            {rounds.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada data putaran arisan yang dapat ditampilkan.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {rounds.map((r) => (
                  <div key={r.number} className="nanad-dashboard-deposits-row">
                    <div>
                      Putaran ke-{r.number}
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                        }}
                      >
                        Jadwal: {r.date}
                      </span>
                    </div>
                    <div>
                      Iuran dijadwalkan sebesar{" "}
                      <strong>{formatCurrency(r.amount)}</strong>.
                      <br />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: r.paid ? "#4ade80" : "#facc15",
                        }}
                      >
                        Status iuran:{" "}
                        {r.paid ? "Sudah tercatat lunas" : "Belum tercatat"}
                      </span>
                    </div>
                    <div style={{ justifyContent: "flex-end" }}>
                      {wallet ? (
                        r.paid ? (
                          <span>{formatCurrency(r.amount)}</span>
                        ) : (
                          <button
                            type="button"
                            disabled={processingRound === r.number}
                            className="nanad-dashboard-deposit-submit"
                            onClick={() => handlePayRound(r.number)}
                          >
                            {processingRound === r.number
                              ? "Memproses..."
                              : "Setor dari wallet"}
                          </button>
                        )
                      ) : (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#fecaca",
                            textAlign: "right",
                          }}
                        >
                          Wallet belum aktif. Buka halaman Wallet terlebih
                          dahulu.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kolom kanan: anggota + catatan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Anggota grup arisan</h3>
              <p>
                Daftar semua akun yang terdaftar sebagai peserta atau pemilik
                grup arisan ini.
              </p>
            </div>

            {members.length === 0 ? (
              <p
                className="nanad-dashboard-body"
                style={{ marginTop: "0.75rem" }}
              >
                Belum ada anggota terdaftar. Jika kamu pemilik grup, kamu bisa
                membagikan ID grup ke peserta lain agar mereka bergabung.
              </p>
            ) : (
              <div
                className="nanad-dashboard-deposits-rows"
                style={{ marginTop: "0.75rem" }}
              >
                {members.map((m) => (
                  <div key={m.id} className="nanad-dashboard-deposits-row">
                    <div>
                      <span style={{ fontSize: "0.8rem" }}>
                        {m.display_name || m.user_email || "Tanpa nama"}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "#9ca3af",
                        }}
                      >
                        {m.user_email}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color:
                            m.role === "OWNER" ? "#facc15" : "#e5e7eb",
                        }}
                      >
                        {m.role === "OWNER" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <div />
                  </div>
                ))}
              </div>
            )}

            <div
              className="nanad-dashboard-body"
              style={{ marginTop: "0.9rem", fontSize: "0.78rem" }}
            >
              <strong>Catatan:</strong> ID grup 5 digit bisa dibagikan ke
              peserta lain agar mereka dapat bergabung dari halaman{" "}
              <em>Arisan &gt; Cari grup dari ID</em>. Penyetoran dana nyata
              tetap mengikuti kesepakatan di luar aplikasi dan hanya dicatat di
              sini sebagai referensi.
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="nanad-dashboard-footer">
          <span>
            © {new Date().getFullYear()} Nanad Invest. Arisan module (beta).
          </span>
          <span>
            Fitur arisan ini bersifat pencatatan &amp; simulasi. Pengelolaan
            dana nyata tetap mengikuti kesepakatan dan regulasi yang berlaku di
            luar aplikasi.
          </span>
        </footer>
      </div>
    </main>
  );
}
