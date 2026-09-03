"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    setError(null);

    // transaction_items dihapus otomatis lewat ON DELETE CASCADE.
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);

    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/transaksi");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-center text-sm text-gray-600">
          Yakin hapus transaksi ini? Tidak bisa dibatalkan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="w-full rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600"
    >
      Hapus Transaksi
    </button>
  );
}
