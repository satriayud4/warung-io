import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PengeluaranPage() {
  const supabase = createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, expense_date, category, description, amount")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Pengeluaran</h1>
        <Link
          href="/pengeluaran/baru"
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Tambah Pengeluaran
        </Link>
      </div>

      {(!expenses || expenses.length === 0) && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="font-medium text-gray-700">Belum ada pengeluaran tercatat.</p>
          <p className="mt-1 text-sm text-gray-500">
            Catat belanja bahan, gas, listrik, dan kebutuhan warung lainnya di sini.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {(expenses ?? []).map((e) => (
          <Link
            key={e.id}
            href={`/pengeluaran/${e.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">
                {e.description || e.category}
              </p>
              <p className="text-xs text-gray-500">
                {formatTanggalPendek(e.expense_date)} ·{" "}
                <span className="rounded-full bg-gray-100 px-2 py-0.5">{e.category}</span>
              </p>
            </div>
            <p className="shrink-0 font-semibold text-red-600">-{formatRupiah(e.amount)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
