// Klasifikasi pertanyaan bahasa natural jadi intent terstruktur — juga
// murni aturan kata kunci, bukan AI. Alasannya sama dengan date-parser:
// io tidak boleh "menebak" mau menghitung apa: no ambiguitas, gampang
// ditelusuri, dan hasilnya selalu konsisten untuk pertanyaan yang sama.
//
// Struktur ini modular: kalau nanti mau upgrade ke LLM untuk memahami
// pertanyaan yang lebih bebas/kompleks, tinggal ganti isi parseIntent()
// dengan pemanggilan API (lihat catatan di src/app/api/io/ask/route.ts) —
// bentuk Intent di bawah ini tetap dipakai sebagai "kontrak" ke lapisan
// data & jawaban, jadi tidak perlu bongkar semuanya.

import { parseDateRange, type DateRange } from "./date-parser";

export type Intent =
  | { type: "omzet"; range: DateRange }
  | { type: "transaksi_count"; range: DateRange }
  | { type: "profit"; range: DateRange }
  | { type: "top_product"; range: DateRange }
  | { type: "best_day"; range: DateRange }
  | { type: "avg_per_day"; range: DateRange }
  | { type: "compare"; metric: "omzet" | "profit"; current: DateRange; previous: DateRange }
  | { type: "unknown" };

export function parseIntent(question: string): Intent {
  const t = question.toLowerCase();

  // "Bandingkan omzet minggu ini dengan minggu lalu" / "naik dibanding bulan lalu"
  if (/bandingkan|dibanding|dibandingkan/.test(t)) {
    const metric: "omzet" | "profit" = /untung|laba|keuntungan/.test(t) ? "profit" : "omzet";
    if (/minggu/.test(t)) {
      return {
        type: "compare",
        metric,
        current: parseDateRange("minggu ini")!,
        previous: parseDateRange("minggu lalu")!,
      };
    }
    return {
      type: "compare",
      metric,
      current: parseDateRange("bulan ini")!,
      previous: parseDateRange("bulan lalu")!,
    };
  }

  const explicitRange = parseDateRange(t);

  if (/produk (apa|mana)|paling (banyak terjual|laku)|terlaris/.test(t)) {
    return { type: "top_product", range: explicitRange ?? parseDateRange("bulan ini")! };
  }

  if (/hari apa.*(paling tinggi|tertinggi)/.test(t)) {
    return { type: "best_day", range: explicitRange ?? parseDateRange("bulan ini")! };
  }

  if (/rata-rata/.test(t)) {
    return { type: "avg_per_day", range: explicitRange ?? parseDateRange("bulan ini")! };
  }

  if (/untung|laba|keuntungan/.test(t)) {
    return { type: "profit", range: explicitRange ?? parseDateRange("hari ini")! };
  }

  if (/transaksi/.test(t)) {
    return { type: "transaksi_count", range: explicitRange ?? parseDateRange("hari ini")! };
  }

  if (/omzet|penjualan|pendapatan/.test(t)) {
    return { type: "omzet", range: explicitRange ?? parseDateRange("hari ini")! };
  }

  return { type: "unknown" };
}
