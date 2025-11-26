"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

"use client";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Glow premium background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-10rem] h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-[-6rem] bottom-[-6rem] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_100%)] opacity-80" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 lg:px-8">
        <div className="w-full max-w-5xl">
          {/* Brand kecil di atas */}
          <div className="mb-6 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-900/80 ring-1 ring-emerald-500/50">
                <span className="text-base font-semibold text-emerald-400">
                  N
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-slate-300">
                  Nanad Invest
                </p>
                <p className="text-[11px] text-slate-400">
                  Personal Planning & Simulation Space
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[10px] font-medium text-emerald-300">
              Beta Studio · v0.1
            </span>
          </div>

          {/* Kartu utama */}
          <div className="grid gap-8 rounded-[32px] border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.95)] backdrop-blur-xl md:grid-cols-[1.1fr_minmax(0,1fr)] md:p-8">
            {/* Panel kiri: storytelling elegan */}
            <section className="flex flex-col justify-between border-b border-slate-800/70 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-emerald-300/80">
                  Welcome back
                </p>
                <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
                  Masuk ke ruang
                  <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    rencana finansial yang rapi & elegan.
                  </span>
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-[15px]">
                  Simulasikan tujuan, rancang setoran, dan lihat bagaimana
                  portofoliomu bisa tumbuh secara terukur. Semua tersimpan
                  rapi, tanpa tekanan untuk langsung mengeksekusi di instrumen nyata.
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-[11px] text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-200">
                    Ruang simulasi dulu
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-100/80">
                    Uji berbagai skenario: dana darurat, rumah, pensiun — tanpa
                    mengubah uang di rekeningmu.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-100">
                    Satu dasbor, banyak tujuan
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Lihat gambaran besar keuanganmu dalam satu tampilan yang
                    tenang, bukan penuh angka yang bikin panik.
                  </p>
                </div>
              </div>
            </section>

            {/* Panel kanan: form login mewah */}
            <section className="flex items-center">
              <div className="w-full rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.95)]">
                <div className="mb-5">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    Secure access
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-50">
                    Masuk ke dashboard Nanad Invest
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Gunakan email yang kamu daftarkan. Kamu bisa mengubah detail
                    rencana kapan pun di dalam dasbor.
                  </p>
                </div>

                {/* >>> Di sini Bang Son bisa sambungkan ke Supabase <<< */}
                <form
                  className="space-y-4 text-sm"
                  // onSubmit={handleLogin}
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-200">
                      Email
                    </label>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 ring-emerald-400/40 focus-within:border-emerald-400 focus-within:ring-2">
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="nama@email.com"
                        className="w-full bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-200">
                      Kata sandi
                    </label>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 ring-emerald-400/40 focus-within:border-emerald-400 focus-within:ring-2">
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-transparent text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-950 text-emerald-400"
                      />
                      <span>Ingat saya di perangkat ini</span>
                    </label>
                    <button
                      type="button"
                      className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="relative mt-3 w-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(16,185,129,0.55)] transition hover:from-emerald-300 hover:via-emerald-200 hover:to-cyan-200"
                  >
                    Masuk sekarang
                    <span className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
                  </button>
                </form>

                <p className="mt-5 text-center text-[11px] text-slate-400">
                  Belum punya akun?{" "}
                  <a
                    href="/register"
                    className="font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Daftar dulu
                  </a>
                </p>

                <p className="mt-2 text-center text-[10px] text-slate-500">
                  Dengan masuk, kamu menyetujui pengelolaan data rencana untuk
                  keperluan simulasi di Nanad Invest.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
