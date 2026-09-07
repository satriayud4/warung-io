import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

export const dynamic = "force-dynamic";

export default async function ProdukPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category, cost_price, selling_price, unit, is_active")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  // Kelompokkan per kategori (urutan tetap mengikuti PRODUCT_CATEGORIES),
  // supaya makin gampang dicari begitu jumlah menunya bertambah — misalnya
  // menu makanan dan minuman tidak lagi bercampur dalam satu daftar panjang.
  const grouped = PRODUCT_CATEGORIES.map((cat) => ({
    category: cat,
    items: (products ?? []).filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Produk</h1>
        <Link
          href="/produk/baru"
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          + Tambah Produk
        </Link>
      </div>

      {(!products || products.length === 0) && (
        <div className="mt-6">
          <EmptyState
            icon="box"
            title="Belum ada produk"
            description="Tambahkan menu pertama supaya bisa mulai dipakai di Kasir."
            action={{ label: "+ Tambah Produk", href: "/produk/baru" }}
          />
        </div>
      )}

      <div className="mt-4 space-y-5">
        {grouped.map((group) => (
          <div key={group.category}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {group.category}
            </h2>
            <div className="space-y-2">
              {group.items.map((p) => {
                const laba =
                  p.cost_price !== null ? Number(p.selling_price) - Number(p.cost_price) : null;

                return (
                  <Link
                    key={p.id}
                    href={`/produk/${p.id}`}
                    className={`block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 ${
                      !p.is_active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">
                          {p.name}
                          {!p.is_active && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              Nonaktif
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Jual {formatRupiah(p.selling_price)} / {p.unit}
                        </p>
                        <p className="text-xs text-gray-400">
                          Modal {p.cost_price !== null ? formatRupiah(p.cost_price) : "belum diisi"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-400">Laba/unit</p>
                        <p
                          className={`font-semibold ${
                            laba === null ? "text-gray-400" : "text-brand-600"
                          }`}
                        >
                          {laba === null ? "-" : formatRupiah(laba)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
