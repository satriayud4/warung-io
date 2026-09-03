import Link from "next/link";
import { ExpenseForm } from "../ExpenseForm";

export default function TambahPengeluaranPage() {
  return (
    <div className="mx-auto max-w-md">
      <Link href="/pengeluaran" className="text-sm text-gray-500">
        ← Kembali
      </Link>
      <h1 className="mb-4 mt-1 text-lg font-semibold">Tambah Pengeluaran</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <ExpenseForm />
      </div>
    </div>
  );
}
