// Data mentah untuk sapaan personal io di Dashboard. Dipisah dari
// templating (greeting.ts) supaya gampang diuji — semua angka di sini
// asli dari Supabase, tidak ada yang dihitung/dikarang di lapisan bahasa.

import { createClient } from "@/lib/supabase/server";
import { parseDateRange, type DateRange } from "./date-parser";
import type { GreetingNumbers } from "./greeting";

async function fetchOmzet(range: DateRange): Promise<{ omzet: number; count: number }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("total_amount")
    .gte("transaction_date", range.from)
    .lte("transaction_date", range.to);
  const rows = data ?? [];
  return { omzet: rows.reduce((s, r) => s + Number(r.total_amount), 0), count: rows.length };
}

export async function fetchGreetingNumbers(): Promise<GreetingNumbers> {
  const [today, yesterday, thisWeek, lastWeek] = await Promise.all([
    fetchOmzet(parseDateRange("hari ini")!),
    fetchOmzet(parseDateRange("kemarin")!),
    fetchOmzet(parseDateRange("minggu ini")!),
    fetchOmzet(parseDateRange("minggu lalu")!),
  ]);

  return {
    todayOmzet: today.omzet,
    todayCount: today.count,
    yesterdayOmzet: yesterday.omzet,
    thisWeekOmzet: thisWeek.omzet,
    lastWeekOmzet: lastWeek.omzet,
  };
}
