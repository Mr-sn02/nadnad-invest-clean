"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)]">
          {/* PANEL KIRI – COPY / BRANDING */}
          <section className="space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">
              Nanad Invest
            </p>

            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Masuk ke ruang
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                rencana finansial yang rapi.
              </span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              Satu dashboard untuk menyusun tujuan, mensimulasikan setoran,
              dan memantau progresmu tanpa pusing lihat angka di banyak tempat.
              <br />
              <span className="mt-1 block text-slate-400">
                Data rencana disimpan rapi, bisa kamu ubah kapan saja dan tidak
                langsung terhubung ke instrumen — aman untuk eksplorasi.
              </span>
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2">
                <p className="font-semibold text-emerald-300">
                  Mode simulasi dulu
                </p>
                <p className="mt-1">
                  Cocok buat yang masih ingin coba-coba skenario investasi.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2">
                <p className="font-semibold text-slate-200">
                  Satu akun, banyak tujuan
                </p>
                <p className="mt-1">
                  Dari dana darurat sampai rumah impian dalam satu tempat.
                </p>
              </div>
            </div>
          </section>

          {/* PANEL KANAN – KARTU LOGIN */}
          <section className="flex items-center">
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.9)]">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Masuk ke dashboard</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Gunakan email yang kamu daftarkan untuk mengakses rencana
                  Nanad Invest.
                </p>
              </div>

              {/* === DI SINI TARUH FORM LOGIN LAMA BANG SON === */}
              {/* Contoh form kalau mau pakai langsung: */}
              <form className="space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Kata sandi
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                    required
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
              {/* === SAMPAI SINI === */}

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
      </div>
    </main>
  );
}
