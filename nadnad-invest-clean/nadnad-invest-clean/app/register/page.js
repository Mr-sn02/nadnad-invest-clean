"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      alert("Kata sandi dan konfirmasi tidak sama.");
      return;
    }
    // TODO: sambungkan ke fungsi register
    // await handleRegister({ nama, email, password });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="mx-auto grid w-full max-w-4xl gap-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.9)] backdrop-blur md:grid-cols-[1.1fr_1fr] md:p-8">
        {/* PANEL KIRI – BRANDING / COPY */}
        <section className="hidden flex-col justify-between md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
              Mulai dengan tenang
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-snug">
              Daftar akun{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Nanad Invest
              </span>
              .
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Buat ruang pribadi untuk mensimulasikan tujuan keuangan, dari
              dana darurat sampai mimpi jangka panjang. Semua langkah bisa
              kamu ubah seiring hidupmu berubah.
            </p>
          </div>

          <ul className="mt-6 space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                Satu akun bisa menyimpan beberapa rencana sekaligus: rumah,
                pendidikan, pensiun, dan lainnya.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>
                Data yang kamu masukkan hanya untuk simulasi internal Nanad
                Invest, bukan untuk jual produk tertentu.
              </span>
            </li>
          </ul>
        </section>

        {/* PANEL KANAN – FORM REGISTER */}
        <section className="flex flex-col justify-center">
          <div className="mb-6 md:mb-8 md:hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
              Nanad Invest
            </p>
            <h1 className="mt-2 text-xl font-semibold">
              Buat akun baru
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Registrasi</h2>
              <p className="mt-1 text-xs text-slate-400">
                Isi data singkat di bawah. Kamu selalu bisa mengubahnya
                nanti di dalam dashboard.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Nama lengkap
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>

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
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Konfirmasi kata sandi
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-400/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>

              <div className="flex items-start gap-2 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-400"
                />
                <span>
                  Saya setuju data yang saya masukkan digunakan untuk keperluan
                  simulasi dan perencanaan di Nanad Invest.
                </span>
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Daftar sekarang
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Sudah punya akun?{" "}
              <a
                href="/login"
                className="font-semibold text-emerald-300 hover:text-emerald-200"
              >
                Masuk di sini
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
