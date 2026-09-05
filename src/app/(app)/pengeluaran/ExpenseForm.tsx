"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";
import { todayDateInputValue } from "@/lib/format";

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  description: string | null;
  amount: number;
  notes: string | null;
};

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(expense);

  const [date, setDate] = useState(expense?.expense_date ?? todayDateInputValue());
  const [category, setCategory] = useState(expense?.category ?? EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDate = todayDateInputValue();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!amount || parsedAmount <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    setSaving(true);

    const payload = {
      expense_date: date,
      category,
      description: description.trim() || null,
      amount: parsedAmount,
      notes: notes.trim() || null,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("expenses").update(payload).eq("id", expense!.id));
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      ({ error } = await supabase
        .from("expenses")
        .insert({ ...payload, created_by: session?.user.id ?? null }));
    }

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/pengeluaran");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);

    const { error } = await supabase.from("expenses").delete().eq("id", expense!.id);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/pengeluaran");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal</label>
        <input
          type="date"
          value={date}
          max={maxDate}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Keterangan</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Beli daging"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="0"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Catatan (opsional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Pengeluaran"}
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
          {deleting ? "Menghapus..." : confirmDelete ? "Yakin hapus pengeluaran ini?" : "Hapus Pengeluaran"}
        </button>
      )}
    </form>
  );
}
