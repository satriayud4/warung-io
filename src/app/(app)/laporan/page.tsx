import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatHariTanggalJam } from "@/lib/format";
import { resolvePeriod, formatPeriodLabel } from "@/lib/date-range";
import { PeriodFilter } from "@/components/reports/PeriodFilter";
import { SalesChart } from "@/components/reports/SalesChart";
import { ExportSection } from "@/components/reports/ExportSection";
import { MonthlyExportSection } from "@/components/reports/MonthlyExportSection";
import {
  computeSummary,
  computeCategoryRows,
  computePaymentBreakdown,
  flattenDetailedRows,
  type ProductRow,
  type DateRow,
  type DetailedTransaction,
  type ReportData,
} from "@/lib/export/report-data";

export const dynamic = "force-dynamic";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: { period?: string; from?: string; to?: string };
}) {
  const supabase = createClient();

  const { period, from, to } = resolvePeriod(
    searchParams.period,
    searchParams.from,
    searchParams.to
  );

  const [
    { data: settings },
    { data: transactions },
    { data: expenses },
    prodRes,
    dateRes,
    detailRes,
  ] = await Promise.all([
    supabase.from("store_settings").select("store_name").eq("id", true).single(),
    supabase
      .from("transactions")
      .select("total_amount, total_cost, total_profit, payment_method")
      .gte("transaction_date", from)
      .lte("transaction_date", to),
    supabase
      .from("expenses")
      .select("category, amount")
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase.rpc("get_sales_by_product", { p_from: from, p_to: to }) as unknown as Promise<{
      data: ProductRow[] | null;
    }>,
    supabase.rpc("get_sales_by_date", { p_from: from, p_to: to }) as unknown as Promise<{
      data: DateRow[] | null;
    }>,
    supabase
      .from("transactions")
      .select(
        "id, transaction_date, customer_name, payment_method, total_amount, created_at, transaction_items(product_name_snapshot, quantity, subtotal)"
      )
      .gte("transaction_date", from)
      .lte("transaction_date", to)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100) as unknown as Promise<{ data: DetailedTransaction[] | null }>,
  ]);

  const txRows = transactions ?? [];
  const expRows = expenses ?? [];
  const byProduct = prodRes.data ?? [];
  const byDate = dateRes.data ?? [];
  const detailedTransactions = detailRes.data ?? [];

  const summary = computeSummary(txRows, expRows);
  const categoryRows = computeCategoryRows(expRows);
  const payment = computePaymentBreakdown(txRows);
  const storeName = settings?.store_name || "Warung Saya";
  const periodLabel = formatPeriodLabel(period, from, to);
  const detailedRows = flattenDetailedRows(detailedTransactions);

  const reportData: ReportData = {
    storeName,
    periodLabel,
    from,
    to,
    summary,
    byProduct,
    byDate,
    byCategory: categoryRows,
    payment,
    detailedRows,
  };

  const summaryCards = [
    { label: "Omzet", value: summary.omzet },
    { label: "Modal", value: summary.modal },
    { label: "Laba Kotor", value: summary.labaKotor },
    { label: "Pengeluaran", value: summary.pengeluaran },
    { label: "Laba Bersih", value: summary.labaBersih },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold">Laporan</h1>

      <PeriodFilter activePeriod={period} from={from} to={to} />
      <p className="-mt-3 text-xs text-gray-400">{periodLabel}</p>

      {/* Ringkasan Penjualan */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Ringkasan Penjualan</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {summaryCards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <p className="text-xs font-medium text-gray-500">{c.label}</p>
              <p className="mt-1 text-base font-bold text-gray-900">{formatRupiah(c.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pembayaran */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Pembayaran</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-medium text-gray-500">Tunai</p>
            <p className="mt-1 text-base font-bold text-brand-600">
              {formatRupiah(payment.tunai)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs font-medium text-gray-500">Non-tunai</p>
            <p className="mt-1 text-base font-bold text-blue-600">
              {formatRupiah(payment.nontunai)}
            </p>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Penjualan per Tanggal</h2>
        <SalesChart data={byDate} />
      </div>

      {/* Per menu */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Penjualan Berdasarkan Menu</h2>
        {byProduct.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Belum ada penjualan di periode ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {byProduct.map((p) => (
              <div
                key={p.product_name}
                className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-gray-800">{p.product_name}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {Number(p.quantity).toLocaleString("id-ID")} terjual
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{formatRupiah(p.omzet)}</span>
                  <span className="font-semibold text-brand-600">
                    Laba {formatRupiah(p.laba)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rincian Transaksi */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Rincian Transaksi</h2>
        {detailedTransactions.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Belum ada transaksi di periode ini.
          </p>
        ) : (
          <div className="space-y-2">
            {detailedTransactions.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{t.customer_name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatHariTanggalJam(t.transaction_date, t.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.payment_method === "tunai"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {t.payment_method === "tunai" ? "Tunai" : "Non-tunai"}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 border-t border-gray-100 pt-2.5 text-sm">
                  {t.transaction_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between gap-2 text-gray-600">
                      <span className="min-w-0 truncate">
                        {item.product_name_snapshot} × {Number(item.quantity)}
                      </span>
                      <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 flex justify-between border-t border-gray-100 pt-2.5 text-sm font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatRupiah(t.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {detailedTransactions.length === 100 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Menampilkan 100 transaksi pertama pada periode ini. Persempit periode (mis. per
            minggu/bulan) untuk melihat semuanya.
          </p>
        )}
      </div>

      {/* Pengeluaran per kategori */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Pengeluaran per Kategori</h2>
        {categoryRows.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-gray-400 ring-1 ring-gray-100">
            Belum ada pengeluaran di periode ini.
          </p>
        ) : (
          <div className="space-y-2">
            {categoryRows.map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100"
              >
                <span className="text-sm font-medium text-gray-800">{c.category}</span>
                <span className="text-sm font-semibold text-red-600">
                  {formatRupiah(c.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExportSection data={reportData} />
      <MonthlyExportSection storeName={storeName} />
    </div>
  );
}
