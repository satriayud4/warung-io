// Lapisan DATA — murni ambil & hitung angka dari Supabase, tidak ada teks
// sama sekali di sini. Dipisah tegas dari lapisan jawaban (respond.ts)
// supaya io tidak pernah "mengarang" angka — semua angka yang muncul di
// jawaban io wajib lewat fungsi-fungsi ini dulu.

import { createClient } from "@/lib/supabase/server";
import type { DateRange } from "./date-parser";

export type OmzetData = { omzet: number; modal: number; labaKotor: number; transaksiCount: number };

export async function fetchOmzetData(range: DateRange): Promise<OmzetData> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("total_amount, total_cost")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to);

  const rows = data ?? [];
  const omzet = rows.reduce((s, r) => s + Number(r.total_amount), 0);
  const modal = rows.reduce((s, r) => s + Number(r.total_cost), 0);
  return { omzet, modal, labaKotor: omzet - modal, transaksiCount: rows.length };
}

export type ProfitData = { labaKotor: number; pengeluaran: number; labaBersih: number; transaksiCount: number };

export async function fetchProfitData(range: DateRange): Promise<ProfitData> {
  const supabase = createClient();
  const [{ data: tx }, { data: exp }] = await Promise.all([
    supabase
      .from("transactions")
      .select("total_amount, total_cost")
      .gte("transaction_date", range.from)
      .lte("transaction_date", range.to),
    supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", range.from)
      .lte("expense_date", range.to),
  ]);

  const rows = tx ?? [];
  const omzet = rows.reduce((s, r) => s + Number(r.total_amount), 0);
  const modal = rows.reduce((s, r) => s + Number(r.total_cost), 0);
  const labaKotor = omzet - modal;
  const pengeluaran = (exp ?? []).reduce((s, e) => s + Number(e.amount), 0);
  return { labaKotor, pengeluaran, labaBersih: labaKotor - pengeluaran, transaksiCount: rows.length };
}

export type TopProduct = { name: string; quantity: number; omzet: number } | null;

export async function fetchTopProduct(range: DateRange): Promise<TopProduct> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_sales_by_product", {
    p_from: range.from,
    p_to: range.to,
  });
  const rows = (data ?? []) as { product_name: string; quantity: number; omzet: number }[];
  if (rows.length === 0) return null;
  // RPC sudah urut quantity terbanyak duluan.
  const top = rows[0];
  return { name: top.product_name, quantity: Number(top.quantity), omzet: Number(top.omzet) };
}

export type BestDay = { date: string; omzet: number } | null;

export async function fetchBestDay(range: DateRange): Promise<BestDay> {
  const supabase = createClient();
  const { data } = await supabase.rpc("get_sales_by_date", {
    p_from: range.from,
    p_to: range.to,
  });
  const rows = (data ?? []) as { sale_date: string; omzet: number }[];
  if (rows.length === 0) return null;
  const best = rows.reduce((a, b) => (Number(b.omzet) > Number(a.omzet) ? b : a));
  return { date: best.sale_date, omzet: Number(best.omzet) };
}

export type DetailedSale = {
  time: string; // ISO created_at
  customer: string;
  paymentMethod: string;
  total: number;
  items: { name: string; quantity: number }[];
};

// Dipakai kalau pengguna minta rincian ("lengkap", "detail", dst) — beda
// dari fetchOmzetData yang cuma kasih angka ringkasan.
export async function fetchDetailedSales(range: DateRange): Promise<DetailedSale[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select(
      "customer_name, payment_method, total_amount, created_at, transaction_items(product_name_snapshot, quantity)"
    )
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to)
    .order("created_at", { ascending: true });

  type Row = {
    customer_name: string;
    payment_method: string;
    total_amount: number;
    created_at: string;
    transaction_items: { product_name_snapshot: string; quantity: number }[];
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    time: r.created_at,
    customer: r.customer_name,
    paymentMethod: r.payment_method,
    total: Number(r.total_amount),
    items: r.transaction_items.map((it) => ({
      name: it.product_name_snapshot,
      quantity: Number(it.quantity),
    })),
  }));
}
