// Menyatukan tiga lapisan: intent (maksud pertanyaan) -> data (angka asli
// dari Supabase) -> respond (kalimat hangat). Fungsi ini yang dipanggil
// API route — kalau nanti mau upgrade ke AI API asli untuk memahami
// pertanyaan yang lebih bebas, ganti parseIntent() di intent-parser.ts;
// bentuk Intent tetap sama jadi data.ts & respond.ts tidak perlu disentuh.

import { parseIntent } from "./intent-parser";
import { fetchOmzetData, fetchProfitData, fetchTopProduct, fetchBestDay } from "./data";
import { computeMilestones } from "./milestones";
import {
  respondOmzet,
  respondTransaksiCount,
  respondProfit,
  respondTopProduct,
  respondBestDay,
  respondAvgPerDay,
  respondCompare,
  respondTimeline,
  respondUnknown,
  type IoAnswer,
} from "./respond";

export async function answerQuestion(question: string): Promise<IoAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { answer: "Coba tanya sesuatu dulu ya, misalnya \"omzet hari ini berapa?\" 😊" };
  }

  const intent = parseIntent(trimmed);

  switch (intent.type) {
    case "omzet": {
      const data = await fetchOmzetData(intent.range);
      return respondOmzet(intent.range, data);
    }
    case "transaksi_count": {
      const data = await fetchOmzetData(intent.range);
      return respondTransaksiCount(intent.range, data);
    }
    case "profit": {
      const data = await fetchProfitData(intent.range);
      return respondProfit(intent.range, data);
    }
    case "top_product": {
      const product = await fetchTopProduct(intent.range);
      return respondTopProduct(intent.range, product);
    }
    case "best_day": {
      const day = await fetchBestDay(intent.range);
      return respondBestDay(intent.range, day);
    }
    case "avg_per_day": {
      const data = await fetchOmzetData(intent.range);
      return respondAvgPerDay(intent.range, data);
    }
    case "compare": {
      const fetchValue = intent.metric === "omzet" ? fetchOmzetForCompare : fetchProfitForCompare;
      const [currentValue, previousValue] = await Promise.all([
        fetchValue(intent.current),
        fetchValue(intent.previous),
      ]);
      return respondCompare(intent.metric, intent.current, intent.previous, currentValue, previousValue);
    }
    case "timeline": {
      const milestones = await computeMilestones();
      return respondTimeline(milestones);
    }
    case "unknown":
    default:
      return respondUnknown();
  }
}

async function fetchOmzetForCompare(range: Parameters<typeof fetchOmzetData>[0]) {
  const data = await fetchOmzetData(range);
  return data.omzet;
}

async function fetchProfitForCompare(range: Parameters<typeof fetchProfitData>[0]) {
  const data = await fetchProfitData(range);
  return data.labaBersih;
}
