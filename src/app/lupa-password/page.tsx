"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LupaPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Supabase tidak membocorkan apakah email terdaftar atau tidak (demi
    // keamanan), jadi kita selalu tampilkan pesan sukses yang sama.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-brand-600">Warung.io</h1>
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="font-semibold">Link reset password sudah dikirim.</p>
          <p className="mt-2 text-sm text-gray-500">
            Kalau <span className="font-medium">{email}</span> terdaftar, cek inbox (atau folder
            spam) untuk link reset password. Link berlaku sebentar saja.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600">Warung.io</h1>
          <p className="mt-1 text-sm text-gray-500">Catat jualan, tahu untung.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-lg font-semibold">Lupa password</h2>
          <p className="mb-4 text-sm text-gray-500">
            Masukkan email akun Anda, nanti kami kirim link untuk buat password baru.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="nama@email.com"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Kirim Link Reset Password"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-brand-600">
            ← Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
