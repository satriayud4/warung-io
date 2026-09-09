// Shared types + pure data helpers for report exports (Excel/CSV/Gambar).
// Kept framework-agnostic (no DOM/browser calls) so the same shape can come
// either from server-rendered props (Laporan page) or an on-demand client
// fetch (export per bulan).

import { APP_TIMEZONE } from "@/lib/format";

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

// Satu transaksi lengkap dengan item-itemnya — bentuk "mentah" sebelum
// diratakan jadi baris per produk untuk export. Dipakai baik oleh Laporan
// (sudah tersedia lewat props) maupun MonthlyExportSection (fetch sendiri).
export type DetailedTransaction = {
  id: string;
  transaction_date: string;
  customer_name: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  transaction_items: { product_name_snapshot: string; quantity: number; subtotal: number }[];
};

// Satu baris per produk di dalam satu transaksi — format paling
// "transparan" untuk dibuka & disortir/difilter di Excel: setiap baris
// berdiri sendiri dengan tanggal, hari, jam, pembeli, produk, jumlah,
// harga, total transaksi, dan metode pembayaran.
export type DetailedRow = {
  date: string;
  day: string;
  time: string;
  customer: string;
  product: string;
  quantity: number;
  price: number;
  transactionTotal: number;
  paymentMethod: string;
};

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
  detailedRows: DetailedRow[];
  transactions: DetailedTransaction[];
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

export function flattenDetailedRows(transactions: DetailedTransaction[]): DetailedRow[] {
  const rows: DetailedRow[] = [];

  for (const t of transactions) {
    const date = new Date(t.transaction_date + "T00:00:00");
    const day = date.toLocaleDateString("id-ID", { weekday: "long" });
    const time = new Date(t.created_at).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: APP_TIMEZONE,
    });

    for (const item of t.transaction_items) {
      rows.push({
        date: t.transaction_date,
        day,
        time,
        customer: t.customer_name,
        product: item.product_name_snapshot,
        quantity: Number(item.quantity),
        price: item.quantity > 0 ? Number(item.subtotal) / Number(item.quantity) : 0,
        transactionTotal: Number(t.total_amount),
        paymentMethod: t.payment_method === "tunai" ? "Tunai" : "Non-tunai",
      });
    }
  }

  return rows;
}
