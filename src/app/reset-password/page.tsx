"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Halaman ini dibuka lewat link dari email reset password. Supabase secara
// otomatis membaca token dari URL dan membuat sesi "recovery" sementara di
// browser — kita cukup menunggu sesi itu siap, lalu tampilkan form
// password baru.
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        settled = true;
        setReady(true);
      }
    });

    // Fallback: kalau event PASSWORD_RECOVERY sudah lewat sebelum listener
    // terpasang, cek langsung apakah sudah ada sesi.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled && session) {
        settled = true;
        setReady(true);
      } else if (!settled) {
        // Beri sedikit waktu untuk Supabase memproses token di URL sebelum
        // menyimpulkan link-nya tidak valid.
        setTimeout(() => {
          if (!settled) setLinkInvalid(true);
        }, 2500);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (linkInvalid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-brand-600">Warung.io</h1>
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="font-semibold">Link tidak valid atau sudah kadaluarsa.</p>
          <p className="mt-2 text-sm text-gray-500">
            Minta link reset password baru, lalu buka langsung dari email tanpa mengubah
            alamatnya.
          </p>
          <Link
            href="/lupa-password"
            className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white"
          >
            Minta link baru
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-brand-600">Warung.io</h1>
        <div className="mt-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <p className="font-semibold">Password berhasil diganti.</p>
          <p className="mt-2 text-sm text-gray-500">Mengarahkan ke dashboard...</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <p className="text-sm text-gray-500">Memeriksa link reset password...</p>
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
          <h2 className="mb-4 text-lg font-semibold">Buat password baru</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password baru
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Ulangi password baru
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Ulangi password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-brand-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
