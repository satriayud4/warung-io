import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

export default async function TransaksiDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select(
      "id, transaction_date, customer_name, payment_method, total_amount, total_cost, total_profit"
    )
    .eq("id", params.id)
    .single();

  if (!transaction) {
    notFound();
  }

  const { data: items } = await supabase
    .from("transaction_items")
    .select("id, product_name_snapshot, selling_price_snapshot, quantity, subtotal")
    .eq("transaction_id", params.id)
    .order("id");

  return (
    <div className="mx-auto max-w-md">
      <Link href="/transaksi" className="text-sm text-gray-500">
        ← Kembali
      </Link>

      <div className="mt-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400">Pembeli</p>
            <p className="font-semibold text-gray-900">{transaction.customer_name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Tanggal</p>
            <p className="font-semibold text-gray-900">
              {formatTanggalPendek(transaction.transaction_date)}
            </p>
          </div>
        </div>

        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            transaction.payment_method === "tunai"
              ? "bg-brand-50 text-brand-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {transaction.payment_method === "tunai" ? "Tunai" : "Non-tunai"}
        </span>

        <div className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
          {(items ?? []).map((it) => (
            <div key={it.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-800">{it.product_name_snapshot}</p>
                <p className="text-xs text-gray-500">
                  {it.quantity} × {formatRupiah(it.selling_price_snapshot)}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatRupiah(it.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">
              {formatRupiah(transaction.total_amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Modal</span>
            <span className="text-gray-700">{formatRupiah(transaction.total_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Laba</span>
            <span className="font-semibold text-brand-600">
              {formatRupiah(transaction.total_profit)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href={`/transaksi/${transaction.id}/edit`}
          className="block w-full rounded-xl bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700"
        >
          Edit Transaksi
        </Link>
        <DeleteTransactionButton transactionId={transaction.id} />
      </div>
    </div>
  );
}
