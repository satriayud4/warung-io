"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Initial = { store_name: string; owner_name: string; phone: string; currency: string };

// Updates the single shared store_settings row. Any authenticated account
// (owner or staff) can edit this — it's warung-wide, not per-account.
export function StoreSettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("store_settings")
      .update({
        store_name: form.store_name,
        owner_name: form.owner_name,
        phone: form.phone,
        currency: form.currency,
      })
      .eq("id", true);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama warung</label>
        <input
          value={form.store_name}
          onChange={(e) => setForm({ ...form, store_name: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Warung Bu Siti"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama pemilik</label>
        <input
          value={form.owner_name}
          onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nomor telepon</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="08xxxxxxxxxx"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Mata uang</label>
        <select
          value={form.currency}
          onChange={(e) => setForm({ ...form, currency: e.target.value })}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="IDR">Rupiah (IDR)</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Tersimpan.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-60 md:w-auto"
      >
        {saving ? "Menyimpan..." : "Simpan Info Warung"}
      </button>
    </form>
  );
}
