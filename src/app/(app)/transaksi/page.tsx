import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggalPendek, formatJam } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TransaksiPage() {
  const supabase = createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, transaction_date, customer_name, payment_method, total_amount, created_at")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold">Transaksi</h1>

      {(!transactions || transactions.length === 0) && (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="font-medium text-gray-700">Belum ada transaksi.</p>
          <p className="mt-1 text-sm text-gray-500">
            Transaksi yang disimpan lewat Kasir akan muncul di sini.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {(transactions ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/transaksi/${t.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
          >
            <div>
              <p className="font-medium text-gray-900">{t.customer_name}</p>
              <p className="text-xs text-gray-500">
                {formatTanggalPendek(t.transaction_date)} · {formatJam(t.created_at)} ·{" "}
                <span
                  className={
                    t.payment_method === "tunai" ? "text-brand-600" : "text-blue-600"
                  }
                >
                  {t.payment_method === "tunai" ? "Tunai" : "Non-tunai"}
                </span>
              </p>
            </div>
            <p className="font-semibold text-gray-900">{formatRupiah(t.total_amount)}</p>
          </Link>
        ))}
      </div>

      {(transactions ?? []).length === 100 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Menampilkan 100 transaksi terbaru. Laporan lengkap akan tersedia di Tahap 3.
        </p>
      )}
    </div>
  );
}
