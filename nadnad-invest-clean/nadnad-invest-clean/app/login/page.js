"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    // TODO: sambungkan ke fungsi login yang sudah ada
    // await handleLogin(email, password);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="mx-auto grid w-full max-w-4xl gap-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur md:grid-cols-[1.1fr_1fr] md:p-8">
        {/* PANEL KIRI – BRANDING */}
        <section className="hidden flex-col justify-between md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
              Nanad Invest
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-snug">
              Masuk ke ruang
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                rencana finansial yang rapi.
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Satu dashboard untuk menyusun tujuan, mensimulasikan setoran,
              dan memantau progresmu tanpa pusing lihat angka di banyak tempat.
            </p>
          </div>

          <div className="mt-6 space-y-2 text-xs text-slate-400">
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Data rencana disimpan rapi, bisa kamu ubah kapan saja.
            </p>
            <p className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Tidak langsung terhubung ke instrumen, aman untuk eksplorasi.
            </p>
          </div>
        </section>

        {/* PANEL KANAN – FORM LOGIN */}
        <section className="flex flex-col justify-center">
          <div className="mb-6 md:mb-8 md:hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
              Nanad Invest
            </p>
            <h1 className="mt-2 text-xl font-semibold">
              Masuk ke dashboard
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Login</h2>
              <p className="mt-1 text-xs text-slate-400">
                Gunakan email yang kamu daftarkan untuk mengakses rencana
                Nanad Invest.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Kata sandi
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-400"
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
                className="mt-2 w-full rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Masuk
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Belum punya akun?{" "}
              <a
                href="/register"
                className="font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Daftar dulu
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
