import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatHariTanggalJam } from "@/lib/format";
import { resolvePeriod, formatPeriodLabel } from "@/lib/date-range";
import { PeriodFilter } from "@/components/reports/PeriodFilter";
import { EmptyState } from "@/components/ui/EmptyState";

type ProductSales = { product_name: string; quantity: number; omzet: number; laba: number };

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", session!.user.id)
    .single();

  const { period, from, to } = resolvePeriod(
    searchParams.period,
    searchParams.from,
    searchParams.to
  );

  const [
    { data: transactions },
    { data: expenses },
    { data: bestSellersData, error: bestSellersError },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("total_amount, total_cost, total_profit")
      .gte("transaction_date", from)
      .lte("transaction_date", to),
    supabase.from("expenses").select("amount").gte("expense_date", from).lte("expense_date", to),
    // Menu Terlaris selalu all-time (tidak mengikuti filter periode di
    // atas) — pakai fungsi database khusus, bukan dihitung di browser,
    // supaya tetap ringan walau transaksinya sudah ribuan.
    supabase.rpc("get_top_products_all_time", { p_limit: 3 }) as unknown as Promise<{
      data: ProductSales[] | null;
      error: { message: string } | null;
    }>,
    supabase
      .from("transactions")
      .select("id, transaction_date, customer_name, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const omzet = (transactions ?? []).reduce((s, t) => s + Number(t.total_amount), 0);
  const modal = (transactions ?? []).reduce((s, t) => s + Number(t.total_cost), 0);
  const labaKotor = omzet - modal;
  const pengeluaran = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const labaBersih = labaKotor - pengeluaran;

  const secondaryCards = [
    { label: "Omzet", value: omzet, tone: "text-gray-900" },
    { label: "Modal", value: modal, tone: "text-gray-900" },
    { label: "Laba Kotor", value: labaKotor, tone: "text-brand-600" },
    { label: "Pengeluaran", value: pengeluaran, tone: "text-red-600" },
  ];

  const bestSellers = bestSellersData ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">Selamat datang, {profile?.name ?? "Kembali"} 👋</p>
        <h1 className="text-lg font-semibold">{formatPeriodLabel(period, from, to)}</h1>
      </div>

      <PeriodFilter activePeriod={period} from={from} to={to} />

      {/* Laba Bersih ditonjolkan sendiri — ini angka paling penting yang
          ingin dilihat pemilik warung sekilas, tanpa perlu memindai kartu
          lain dulu. */}
      <div className="rounded-2xl bg-brand-500 p-5 text-white shadow-sm">
        <p className="text-xs font-medium text-brand-50">Laba Bersih</p>
        <p className="mt-1 text-3xl font-bold">{formatRupiah(labaBersih)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {secondaryCards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-medium text-gray-500">{c.label}</p>
            <p className={`mt-1 text-lg font-bold ${c.tone}`}>{formatRupiah(c.value)}</p>
          </div>
        ))}
      </div>

      {(transactions ?? []).length === 0 && (
        <EmptyState
          icon="cart"
          title="Belum ada transaksi di periode ini"
          description="Coba ubah filter periode, atau mulai transaksi baru dari Kasir."
          action={{ label: "Buka Kasir", href: "/kasir" }}
        />
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700">Menu Terlaris</h2>
        <p className="mb-2 text-xs text-gray-400">Sepanjang waktu (semua transaksi)</p>
        {bestSellersError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Gagal memuat: {bestSellersError.message}. Pastikan migrasi
            0005_all_time_best_sellers.sql sudah dijalankan di Supabase.
          </p>
        ) : bestSellers.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Belum ada penjualan tercatat.
          </p>
        ) : (
          <div className="space-y-2">
            {bestSellers.map((p, i) => (
              <div
                key={p.product_name}
                className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium text-gray-800">{p.product_name}</span>
                </div>
                <span className="shrink-0 text-sm text-gray-500">
                  {Number(p.quantity).toLocaleString("id-ID")} porsi
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Transaksi Terbaru</h2>
          <Link href="/transaksi" className="text-xs font-medium text-brand-600">
            Lihat semua →
          </Link>
        </div>
        {(!recent || recent.length === 0) ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Belum ada transaksi.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/transaksi/${t.id}`}
                className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{t.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatHariTanggalJam(t.transaction_date, t.created_at)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-900">
                  {formatRupiah(t.total_amount)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
