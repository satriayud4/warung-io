import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";

export default async function EditProdukPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, category, cost_price, selling_price, unit, is_active")
    .eq("id", params.id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md">
      <Link href="/produk" className="text-sm text-gray-500">
        ← Kembali
      </Link>
      <h1 className="mb-4 mt-1 text-lg font-semibold">Edit Produk</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
