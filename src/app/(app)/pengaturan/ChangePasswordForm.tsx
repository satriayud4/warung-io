"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Ganti password langsung dari dalam aplikasi (tanpa perlu alur email
// "Lupa Password"). Password saat ini diverifikasi dulu lewat
// signInWithPassword sebelum diganti — supaya orang yang kebetulan
// menemukan sesi yang masih login (HP/komputer tidak di-logout) tidak
// bisa asal ganti password tanpa tahu password lamanya.
export function ChangePasswordForm({ email }: { email: string }) {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaving(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      setSaving(false);
      setError("Password saat ini salah.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password saat ini</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Password baru</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Minimal 6 karakter"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Ulangi password baru
        </label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Password berhasil diganti.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-60 md:w-auto"
      >
        {saving ? "Menyimpan..." : "Ganti Password"}
      </button>
    </form>
  );
}
