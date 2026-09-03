import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { resolvePeriod, formatPeriodLabel } from "@/lib/date-range";
import { PeriodFilter } from "@/components/reports/PeriodFilter";
import { SalesChart } from "@/components/reports/SalesChart";
import { ExportSection } from "@/components/reports/ExportSection";
import { MonthlyExportSection } from "@/components/reports/MonthlyExportSection";
import {
  computeSummary,
  computeCategoryRows,
  computePaymentBreakdown,
  type ProductRow,
  type DateRow,
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

  const [{ data: settings }, { data: transactions }, { data: expenses }, prodRes, dateRes] =
    await Promise.all([
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
    ]);

  const txRows = transactions ?? [];
  const expRows = expenses ?? [];
  const byProduct = prodRes.data ?? [];
  const byDate = dateRes.data ?? [];

  const summary = computeSummary(txRows, expRows);
  const categoryRows = computeCategoryRows(expRows);
  const payment = computePaymentBreakdown(txRows);
  const storeName = settings?.store_name || "Warung Saya";
  const periodLabel = formatPeriodLabel(period, from, to);

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
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-3 py-2.5 font-medium">Menu</th>
                  <th className="px-3 py-2.5 text-right font-medium">Terjual</th>
                  <th className="px-3 py-2.5 text-right font-medium">Omzet</th>
                  <th className="px-3 py-2.5 text-right font-medium">Laba</th>
                </tr>
              </thead>
              <tbody>
                {byProduct.map((p) => (
                  <tr key={p.product_name} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{p.product_name}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{Number(p.quantity)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-900">
                      {formatRupiah(p.omzet)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-brand-600">
                      {formatRupiah(p.laba)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
