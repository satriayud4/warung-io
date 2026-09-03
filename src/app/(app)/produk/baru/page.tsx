import Link from "next/link";
import { ProductForm } from "../ProductForm";

export default function TambahProdukPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link href="/produk" className="text-sm text-gray-500">
        ← Kembali
      </Link>
      <h1 className="mb-4 mt-1 text-lg font-semibold">Tambah Produk</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <ProductForm />
      </div>
    </div>
  );
}
