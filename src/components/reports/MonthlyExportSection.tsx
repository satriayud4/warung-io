"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayDateInputValue } from "@/lib/format";
import {
  computeSummary,
  computeCategoryRows,
  computePaymentBreakdown,
  flattenDetailedRows,
  type ReportData,
  type ProductRow,
  type DateRow,
  type DetailedTransaction,
} from "@/lib/export/report-data";
import { exportReportExcel, exportReportCsv } from "@/lib/export/generate-files";

function currentMonthValue() {
  // "YYYY-MM" dari tanggal WIB hari ini (bukan zona tempat kode ini jalan).
  return todayDateInputValue().slice(0, 7);
}

function monthRange(monthValue: string): { from: string; to: string; label: string } {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-12
  const lastDay = new Date(year, month, 0).getDate();
  const from = `${yearStr}-${monthStr}-01`;
  const to = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
  const label = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  return { from, to, label };
}

export function MonthlyExportSection({ storeName }: { storeName: string }) {
  const supabase = createClient();
  const [month, setMonth] = useState(currentMonthValue());
  const [busy, setBusy] = useState<"excel" | "csv" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchMonthData(): Promise<ReportData> {
    const { from, to, label } = monthRange(month);

    const [txRes, expRes, prodRes, dateRes, detailRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("total_amount, total_cost, payment_method")
        .gte("transaction_date", from)
        .lte("transaction_date", to),
      supabase
        .from("expenses")
        .select("category, amount")
        .gte("expense_date", from)
        .lte("expense_date", to),
      supabase.rpc("get_sales_by_product", { p_from: from, p_to: to }),
      supabase.rpc("get_sales_by_date", { p_from: from, p_to: to }),
      supabase
        .from("transactions")
        .select(
          "id, transaction_date, customer_name, payment_method, total_amount, created_at, transaction_items(product_name_snapshot, quantity, subtotal)"
        )
        .gte("transaction_date", from)
        .lte("transaction_date", to)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    const transactions = txRes.data ?? [];
    const expenses = expRes.data ?? [];
    const detailedTransactions = (detailRes.data ?? []) as unknown as DetailedTransaction[];

    return {
      storeName,
      periodLabel: label,
      from,
      to,
      summary: computeSummary(transactions, expenses),
      byProduct: (prodRes.data ?? []) as ProductRow[],
      byDate: (dateRes.data ?? []) as DateRow[],
      byCategory: computeCategoryRows(expenses),
      payment: computePaymentBreakdown(transactions),
      detailedRows: flattenDetailedRows(detailedTransactions),
      transactions: detailedTransactions,
    };
  }

  async function handleExport(kind: "excel" | "csv") {
    setBusy(kind);
    setError(null);
    try {
      const data = await fetchMonthData();
      if (kind === "excel") await exportReportExcel(data);
      else await exportReportCsv(data);
    } catch {
      setError("Gagal mengambil data laporan bulanan. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Export per Bulan</h2>
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-4 ring-1 ring-gray-100">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Pilih bulan</label>
          <input
            type="month"
            value={month}
            max={currentMonthValue()}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => handleExport("excel")}
          disabled={busy !== null}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "excel" ? "Menyiapkan..." : "Export Excel"}
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={busy !== null}
          className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-60"
        >
          {busy === "csv" ? "Menyiapkan..." : "Export CSV"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
