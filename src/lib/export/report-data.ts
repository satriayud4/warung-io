// Shared types + pure data helpers for report exports (Excel/CSV/Gambar).
// Kept framework-agnostic (no DOM/browser calls) so the same shape can come
// either from server-rendered props (Laporan page) or an on-demand client
// fetch (export per bulan).

export type ReportSummary = {
  omzet: number;
  modal: number;
  labaKotor: number;
  pengeluaran: number;
  labaBersih: number;
};

export type ProductRow = { product_name: string; quantity: number; omzet: number; laba: number };
export type DateRow = { sale_date: string; omzet: number; laba: number };
export type CategoryRow = { category: string; total: number };
export type PaymentBreakdown = { tunai: number; nontunai: number };

export type ReportData = {
  storeName: string;
  periodLabel: string;
  from: string;
  to: string;
  summary: ReportSummary;
  byProduct: ProductRow[];
  byDate: DateRow[];
  byCategory: CategoryRow[];
  payment: PaymentBreakdown;
};

export function computeSummary(
  transactions: { total_amount: number; total_cost: number }[],
  expenses: { amount: number }[]
): ReportSummary {
  const omzet = transactions.reduce((s, t) => s + Number(t.total_amount), 0);
  const modal = transactions.reduce((s, t) => s + Number(t.total_cost), 0);
  const labaKotor = omzet - modal;
  const pengeluaran = expenses.reduce((s, e) => s + Number(e.amount), 0);
  return { omzet, modal, labaKotor, pengeluaran, labaBersih: labaKotor - pengeluaran };
}

export function computeCategoryRows(expenses: { category: string; amount: number }[]): CategoryRow[] {
  const map = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function computePaymentBreakdown(
  transactions: { payment_method: string; total_amount: number }[]
): PaymentBreakdown {
  return transactions.reduce<PaymentBreakdown>(
    (acc, t) => {
      if (t.payment_method === "nontunai") acc.nontunai += Number(t.total_amount);
      else acc.tunai += Number(t.total_amount);
      return acc;
    },
    { tunai: 0, nontunai: 0 }
  );
}
