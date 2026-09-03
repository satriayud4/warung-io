"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  cost_price: number | null;
  selling_price: number;
  unit: string;
  is_active: boolean;
};

const UNITS = ["porsi", "pcs", "botol", "bungkus", "kg", "gram", "liter", "gelas"];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() ?? "");
  const [sellingPrice, setSellingPrice] = useState(product?.selling_price?.toString() ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "porsi");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedSelling = Number(sellingPrice) || 0;
  const parsedCost = costPrice.trim() === "" ? null : Number(costPrice);
  const labaPerUnit = parsedCost !== null ? parsedSelling - parsedCost : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!sellingPrice || parsedSelling <= 0) {
      setError("Harga jual harus lebih dari 0.");
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      cost_price: parsedCost,
      selling_price: parsedSelling,
      unit,
      is_active: isActive,
    };

    const { error } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/produk");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);

    // Produk dengan riwayat transaksi tidak boleh dihapus (data lama harus
    // tetap aman) — nonaktifkan saja lewat toggle "Aktif" di atas.
    const { error } = await supabase.from("products").delete().eq("id", product!.id);

    setDeleting(false);

    if (error) {
      setError(
        "Produk ini sudah pernah dipakai di transaksi, jadi tidak bisa dihapus. Nonaktifkan saja supaya tidak muncul di Kasir."
      );
      setConfirmDelete(false);
      return;
    }

    router.push("/produk");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nama produk</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Lontong Kikil Jumbo"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Harga modal</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="Belum diisi"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Harga jual</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            placeholder="0"
          />
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Laba per unit: </span>
        <span className={labaPerUnit === null ? "text-gray-400" : "font-semibold text-brand-600"}>
          {labaPerUnit === null
            ? "isi harga modal dulu"
            : "Rp" + Math.round(labaPerUnit).toLocaleString("id-ID")}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Satuan</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {isEdit && (
        <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">
            Aktif (muncul di Kasir). Matikan kalau menu ini sedang tidak dijual.
          </span>
        </label>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
      </button>

      {isEdit && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${
            confirmDelete ? "bg-red-600 text-white" : "bg-red-50 text-red-600"
          }`}
        >
          {deleting ? "Menghapus..." : confirmDelete ? "Yakin hapus produk ini?" : "Hapus Produk"}
        </button>
      )}
    </form>
  );
}
