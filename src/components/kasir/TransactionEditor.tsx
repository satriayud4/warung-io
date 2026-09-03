"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, todayDateInputValue } from "@/lib/format";

export type ProductOption = {
  id: string;
  name: string;
  selling_price: number;
  unit: string;
};

export type CartLine = {
  product_id: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
};

type InitialTransaction = {
  id: string;
  transaction_date: string;
  customer_name: string;
  payment_method: PaymentMethod;
  items: CartLine[];
};

export type PaymentMethod = "tunai" | "nontunai";

// Shared cart/checkout UI for both "new transaction" (Kasir) and
// "edit transaction" (Transaksi > edit). The actual prices used to compute
// totals always come from the database (via RPC), never from this
// component's state — quantities are the only thing sent to the server.
export function TransactionEditor({
  products,
  initial,
}: {
  products: ProductOption[];
  initial?: InitialTransaction;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(initial);

  const [date, setDate] = useState(initial?.transaction_date ?? todayDateInputValue());
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initial?.payment_method ?? "tunai"
  );
  const [cart, setCart] = useState<CartLine[]>(initial?.items ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTransactionId, setSavedTransactionId] = useState<string | null>(null);

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const maxDate = todayDateInputValue();

  function addProduct(p: ProductOption) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product_id === p.id);
      if (existing) {
        return prev.map((l) => (l.product_id === p.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product_id: p.id, name: p.name, price: p.selling_price, unit: p.unit, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product_id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product_id !== productId));
  }

  function resetForNewTransaction() {
    setDate(todayDateInputValue());
    setCustomerName("");
    setPaymentMethod("tunai");
    setCart([]);
    setSavedTransactionId(null);
    setError(null);
  }

  async function handleSave() {
    setError(null);

    if (cart.length === 0) {
      setError("Keranjang masih kosong. Pilih menu dulu.");
      return;
    }

    setSaving(true);

    const items = cart.map((l) => ({ product_id: l.product_id, quantity: l.qty }));

    const { data, error } = isEdit
      ? await supabase.rpc("update_transaction", {
          p_transaction_id: initial!.id,
          p_transaction_date: date,
          p_customer_name: customerName,
          p_items: items,
          p_payment_method: paymentMethod,
        })
      : await supabase.rpc("create_transaction", {
          p_transaction_date: date,
          p_customer_name: customerName,
          p_items: items,
          p_payment_method: paymentMethod,
        });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (isEdit) {
      router.push(`/transaksi/${initial!.id}`);
      router.refresh();
      return;
    }

    setSavedTransactionId(data as string);
  }

  // Success screen shown right after saving a NEW transaction.
  if (savedTransactionId) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl">
            ✅
          </div>
          <p className="mt-4 font-semibold text-gray-900">Transaksi berhasil disimpan.</p>
          <p className="mt-1 text-sm text-gray-500">Total {formatRupiah(total)}</p>

          <div className="mt-6 space-y-2">
            <button
              onClick={resetForNewTransaction}
              className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white"
            >
              Transaksi Baru
            </button>
            <button
              onClick={() => router.push(`/transaksi/${savedTransactionId}`)}
              className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700"
            >
              Lihat Transaksi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 md:grid md:grid-cols-5 md:gap-5 md:space-y-0">
      {/* Product picker */}
      <div className="md:col-span-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-gray-100 active:scale-[0.98]"
            >
              <p className="text-sm font-semibold leading-snug text-gray-900">{p.name}</p>
              <p className="mt-1 text-sm text-brand-600">{formatRupiah(p.selling_price)}</p>
            </button>
          ))}
          {products.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              Belum ada produk aktif. Tambahkan dulu di halaman Produk.
            </p>
          )}
        </div>
      </div>

      {/* Cart / checkout */}
      <div className="md:col-span-2">
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:sticky md:top-20">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tanggal</label>
            <input
              type="date"
              value={date}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Nama Pembeli (opsional)
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Umum"
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              {(["tunai", "nontunai"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
                    paymentMethod === m
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {m === "tunai" ? "Tunai" : "Non-tunai"}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            {cart.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">Keranjang kosong</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((l) => (
                  <li key={l.product_id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{l.name}</p>
                      <p className="text-xs text-gray-500">
                        {l.qty} × {formatRupiah(l.price)} = {formatRupiah(l.qty * l.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => changeQty(l.product_id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(l.product_id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(l.product_id)}
                        className="ml-1 text-xs text-red-500"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-lg font-bold text-gray-900">{formatRupiah(total)}</span>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || cart.length === 0}
            className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}
