// Menghitung milestone "Perjalanan Warung" murni dari data transaksi asli
// — tidak ada satu pun tanggal/angka yang dikarang. Kalau suatu ambang
// batas (mis. 100 transaksi, omzet Rp1 juta) belum tercapai, milestone-nya
// memang tidak akan muncul — bukan bug, itu sengaja ("jangan membuat
// milestone palsu").

import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";

export type Milestone = {
  icon: string;
  title: string;
  date: string; // YYYY-MM-DD, dipakai juga untuk urutan kronologis
  description: string;
};

const TRANSACTION_COUNT_MILESTONES = [100, 500, 1000, 5000, 10000];
const OMZET_MILESTONES = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

export type MilestoneTransactionRow = { transaction_date: string; total_amount: number };

export async function computeMilestones(): Promise<Milestone[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("transaction_date, total_amount")
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(20000);

  return computeMilestonesFromRows(data ?? []);
}

// Logika murni, dipisah dari pemanggilan Supabase di atas supaya bisa
// diuji langsung dengan data contoh (tanpa perlu koneksi database).
export function computeMilestonesFromRows(rows: MilestoneTransactionRow[]): Milestone[] {
  if (rows.length === 0) return [];

  const milestones: Milestone[] = [];

  // 1. Transaksi pertama kali tercatat.
  milestones.push({
    icon: "🌱",
    title: "Warung mulai tercatat",
    date: rows[0].transaction_date,
    description: "Pertama kali kamu mencatat transaksi di Warung.io.",
  });

  // 2. Milestone jumlah transaksi (100, 500, 1000, ...) — hanya yang
  //    sungguh sudah tercapai.
  let nextCountIdx = 0;
  rows.forEach((r, i) => {
    const count = i + 1;
    while (
      nextCountIdx < TRANSACTION_COUNT_MILESTONES.length &&
      count === TRANSACTION_COUNT_MILESTONES[nextCountIdx]
    ) {
      const threshold = TRANSACTION_COUNT_MILESTONES[nextCountIdx];
      milestones.push({
        icon: threshold >= 1000 ? "🏆" : "🔥",
        title: `${threshold.toLocaleString("id-ID")} transaksi`,
        date: r.transaction_date,
        description: `Kamu sudah mencatat ${threshold.toLocaleString("id-ID")} transaksi. Warungmu terus jalan!`,
      });
      nextCountIdx++;
    }
  });

  // 3. Milestone omzet kumulatif (Rp1jt, Rp5jt, ...) — hanya yang sungguh
  //    sudah terlampaui, dihitung dari total transaksi berurutan.
  let cumulative = 0;
  let nextOmzetIdx = 0;
  for (const r of rows) {
    cumulative += Number(r.total_amount);
    while (
      nextOmzetIdx < OMZET_MILESTONES.length &&
      cumulative >= OMZET_MILESTONES[nextOmzetIdx]
    ) {
      const threshold = OMZET_MILESTONES[nextOmzetIdx];
      milestones.push({
        icon: "📈",
        title: `Omzet ${formatRupiah(threshold)}`,
        date: r.transaction_date,
        description: `Total omzetmu sudah mencapai ${formatRupiah(threshold)}. Selamat!`,
      });
      nextOmzetIdx++;
    }
  }

  // 4. Bulan dengan omzet tertinggi — cuma ditampilkan kalau datanya
  //    sudah mencakup minimal 2 bulan berbeda (kalau baru 1 bulan,
  //    "tertinggi" tidak bermakna apa-apa, jadi bukan milestone nyata).
  const monthTotals = new Map<string, number>();
  const monthLastDate = new Map<string, string>();
  for (const r of rows) {
    const key = r.transaction_date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(r.total_amount));
    monthLastDate.set(key, r.transaction_date);
  }
  if (monthTotals.size >= 2) {
    let bestKey = "";
    let bestVal = -1;
    for (const [key, val] of monthTotals) {
      if (val > bestVal) {
        bestVal = val;
        bestKey = key;
      }
    }
    const [y, m] = bestKey.split("-").map(Number);
    const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    milestones.push({
      icon: "🚀",
      title: "Bulan dengan omzet tertinggi",
      date: monthLastDate.get(bestKey)!,
      description: `${monthLabel} jadi bulan dengan omzet tertinggi sejauh ini (${formatRupiah(bestVal)}).`,
    });
  }

  milestones.sort((a, b) => a.date.localeCompare(b.date));

  return milestones;
}
