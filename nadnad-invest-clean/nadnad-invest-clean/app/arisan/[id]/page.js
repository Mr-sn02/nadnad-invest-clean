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
  const [rounds, setRounds] = useState([]);

  // ====== LOAD USER + GROUP DARI PARAM ======
  useEffect(() => {
    // kalau belum ada id di URL, jangan jalan dulu
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
        const isCode = /^\d{5}$/.test(idStr); // 5 digit berarti group_code

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
          .select("role")
          .eq("group_id", g.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (mErr) {
          console.error("Load membership error:", mErr.message);
        }

        setRole(mem?.role || null);

        // 4) buat jadwal putaran sederhana (bulanan)
        const roundsArr = [];
        const start = g.start_date ? new Date(g.start_date) : null;

        for (let i = 1; i <= (g.total_rounds || 0); i++) {
          let dateStr = "-";
          if (start) {
            const d = new Date(start);
            d.setMonth(d.getMonth() + (i - 1)); // asumsi tiap bulan
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
            · Iuran per putaran: <strong>{formatCurrency(group.monthly_amount)}</strong>{" "}
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
            Untuk saat ini halaman ini menampilkan jadwal dan informasi arisan.
            Fitur setor iuran langsung dari saldo wallet bisa kita aktifkan di
            tahap berikutnya.
          </p>

          {errorMsg && (
            <p
              className="nanad-dashboard-body"
              style={{ color: "#fecaca", marginTop: "0.5rem" }}
            >
              {errorMsg}
            </p>
          )}
        </section>

        {/* JADWAL PUTARAN SEDERHANA */}
        <section className="nanad-dashboard-table-section">
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Jadwal putaran &amp; iuran</h3>
              <p>
                Jadwal dibuat sederhana berdasarkan tanggal mulai (jika diisi)
                dengan asumsi putaran bulanan. Nilai ini hanya sebagai rencana
                dan pencatatan, bukan penarikan otomatis dari rekening.
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
                          color: "#9ca3af",
                        }}
                      >
                        Status pembayaran & penentuan penerima putaran bisa
                        diatur di tahap pengembangan berikutnya.
                      </span>
                    </div>
                    <div style={{ justifyContent: "flex-end" }}>
                      <span>{formatCurrency(r.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel kecil info tambahan */}
          <div className="nanad-dashboard-deposits">
            <div className="nanad-dashboard-deposits-header">
              <h3>Catatan penggunaan fitur arisan</h3>
              <p>
                Fitur ini ditujukan untuk membantu pencatatan arisan bersama
                secara rapi, terutama bila peserta sama-sama menggunakan akun
                Nanad Invest.
              </p>
            </div>

            <ul
              className="nanad-dashboard-body"
              style={{ marginTop: "0.75rem", paddingLeft: "1.1rem" }}
            >
              <li style={{ marginBottom: "0.4rem" }}>
                ID grup 5 digit bisa dibagikan ke peserta lain agar mereka
                dapat bergabung dari menu Arisan &gt; Cari grup dari ID.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Penyetoran iuran dan penyaluran dana tetap dilakukan secara
                manual melalui rekening masing-masing, kemudian dicatat di dalam
                aplikasi.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                Untuk penentuan giliran penerima, kamu bisa menyusun skema dan
                mencatatnya pada catatan terpisah atau fitur lanjutan di
                pengembangan berikutnya.
              </li>
            </ul>
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
