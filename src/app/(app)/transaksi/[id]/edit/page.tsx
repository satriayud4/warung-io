import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TransactionEditor } from "@/components/kasir/TransactionEditor";

export default async function EditTransaksiPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: transaction } = await supabase
    .from("transactions")
    .select("id, transaction_date, customer_name, payment_method")
    .eq("id", params.id)
    .single();

  if (!transaction) {
    notFound();
  }

  const { data: items } = await supabase
    .from("transaction_items")
    .select("product_id, product_name_snapshot, selling_price_snapshot, quantity")
    .eq("transaction_id", params.id)
    .order("id");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, selling_price, unit")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const cartItems = (items ?? []).map((it) => ({
    product_id: it.product_id as string,
    name: it.product_name_snapshot,
    price: Number(it.selling_price_snapshot),
    unit: "",
    qty: Number(it.quantity),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/transaksi/${transaction.id}`} className="text-sm text-gray-500">
        ← Kembali
      </Link>
      <h1 className="mb-4 mt-1 text-lg font-semibold">Edit Transaksi</h1>

      <TransactionEditor
        products={products ?? []}
        initial={{
          id: transaction.id,
          transaction_date: transaction.transaction_date,
          customer_name: transaction.customer_name,
          payment_method: (transaction.payment_method as "tunai" | "nontunai") ?? "tunai",
          items: cartItems,
        }}
      />
    </div>
  );
}
