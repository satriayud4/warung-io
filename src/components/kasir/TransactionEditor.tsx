"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, todayDateInputValue } from "@/lib/format";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

export type ProductOption = {
  id: string;
  name: string;
  category: string;
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
// Warna kartu produk berjenjang mengikuti jumlah yang sudah dimasukkan ke
// keranjang — makin sering di-tap, makin pekat warnanya. Sengaja dikaitkan
// ke jumlah (bukan acak) supaya warnanya tetap menyampaikan info yang
// berguna sambil tetap terasa "hidup" tiap kali di-tap.
function productTierClasses(qty: number) {
  if (qty === 0) {
    return { container: "bg-white ring-gray-100", name: "text-gray-900", price: "text-brand-600" };
  }
  if (qty === 1) {
    return {
      container: "bg-brand-50 ring-brand-200",
      name: "text-gray-900",
      price: "text-brand-600",
    };
  }
  if (qty <= 3) {
    return {
      container: "bg-brand-200 ring-brand-300",
      name: "text-gray-900",
      price: "text-brand-700",
    };
  }
  if (qty <= 6) {
    return { container: "bg-brand-400 ring-brand-500", name: "text-white", price: "text-brand-50" };
  }
  return { container: "bg-brand-600 ring-brand-700", name: "text-white", price: "text-brand-100" };
}

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
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  const availableCategories = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return PRODUCT_CATEGORIES.filter((c) => present.has(c));
  }, [products]);

  const visibleProducts = useMemo(
    () => (activeCategory === "Semua" ? products : products.filter((p) => p.category === activeCategory)),
    [products, activeCategory]
  );

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const cartQtyById = useMemo(
    () => new Map(cart.map((l) => [l.product_id, l.qty])),
    [cart]
  );
  const maxDate = todayDateInputValue();
  const cartSectionRef = useRef<HTMLDivElement>(null);

  function scrollToCart() {
    cartSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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

  // Success screen shown right after saving a NEW transaction. This is the
  // one deliberately animated moment in the whole app — the checkmark
  // draws itself in, confirming the save the way a person would want
  // reassurance: something happened, and it happened successfully.
  if (savedTransactionId) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="success-card-enter rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <svg viewBox="0 0 52 52" className="mx-auto h-16 w-16">
            <circle
              className="success-check-circle"
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke="#1ea862"
              strokeWidth="3"
            />
            <path
              className="success-check-mark"
              fill="none"
              stroke="#1ea862"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.5 27.5 22.5 34.5 37 19"
            />
          </svg>
          <p className="mt-4 font-semibold text-gray-900">Transaksi berhasil disimpan.</p>
          <p className="mt-1 text-sm text-gray-500">Total {formatRupiah(total)}</p>

          <div className="mt-6 space-y-2">
            <button
              onClick={resetForNewTransaction}
              className="w-full rounded-xl bg-brand-500 px-4 py-3 font-semibold text-white transition active:scale-[0.98]"
            >
              Transaksi Baru
            </button>
            <button
              onClick={() => router.push(`/transaksi/${savedTransactionId}`)}
              className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition active:scale-[0.98]"
            >
              Lihat Transaksi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-20 md:grid md:grid-cols-5 md:gap-5 md:space-y-0 md:pb-0">
      {/* Product picker */}
      <div className="md:col-span-3">
        {availableCategories.length > 1 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
            {["Semua", ...availableCategories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-brand-500 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleProducts.map((p) => {
            const qty = cartQtyById.get(p.id) ?? 0;
            const tier = productTierClasses(qty);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p)}
                className={`relative rounded-2xl p-3 text-left shadow-sm ring-1 transition-colors active:scale-[0.94] ${tier.container}`}
              >
                {qty > 0 && (
                  <span
                    key={qty}
                    className="qty-badge-pop absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-600 shadow"
                  >
                    {qty}
                  </span>
                )}
                <span key={qty} className="product-tap-pop block">
                  <p className={`text-sm font-semibold leading-snug ${tier.name}`}>{p.name}</p>
                  <p className={`mt-1 text-sm ${tier.price}`}>{formatRupiah(p.selling_price)}</p>
                </span>
              </button>
            );
          })}
          {products.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              Belum ada produk aktif. Tambahkan dulu di halaman Produk.
            </p>
          )}
        </div>
      </div>

      {/* Cart / checkout */}
      <div ref={cartSectionRef} className="md:col-span-2">
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
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => changeQty(l.product_id, -1)}
                        aria-label={`Kurangi ${l.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-base text-gray-600 active:bg-gray-200"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{l.qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(l.product_id, 1)}
                        aria-label={`Tambah ${l.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-base text-gray-600 active:bg-gray-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(l.product_id)}
                        aria-label={`Hapus ${l.name}`}
                        className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium text-red-500 active:bg-red-50"
                      >
                        ✕
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

      {/* Bar ringkasan keranjang — mobile saja. Di layar kecil, keranjang
          berada di bawah daftar produk, jadi bar ini melayang di atas
          bottom nav supaya total & tombol checkout tetap terjangkau tanpa
          harus scroll melewati semua produk lebih dulu. */}
      {cart.length > 0 && (
        <button
          type="button"
          onClick={scrollToCart}
          className="fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-lg md:hidden"
        >
          <span className="text-sm">
            {cart.reduce((s, l) => s + l.qty, 0)} item · {formatRupiah(total)}
          </span>
          <span className="text-sm font-semibold">Lihat Keranjang ↓</span>
        </button>
      )}
    </div>
  );
}
