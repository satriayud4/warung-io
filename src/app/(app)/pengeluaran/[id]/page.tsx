import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../ExpenseForm";

export default async function EditPengeluaranPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: expense } = await supabase
    .from("expenses")
    .select("id, expense_date, category, description, amount, notes")
    .eq("id", params.id)
    .single();

  if (!expense) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md">
      <Link href="/pengeluaran" className="text-sm text-gray-500">
        ← Kembali
      </Link>
      <h1 className="mb-4 mt-1 text-lg font-semibold">Edit Pengeluaran</h1>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <ExpenseForm expense={expense} />
      </div>
    </div>
  );
}
