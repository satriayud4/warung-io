// Lapisan JAWABAN — mengubah angka yang SUDAH dihitung (dari data.ts) jadi
// kalimat hangat ala "io". Tidak ada perhitungan apa pun di sini, cuma
// menyusun kata-kata dari angka yang sudah pasti benar.

import { formatRupiah } from "@/lib/format";
import type { DateRange } from "./date-parser";
import type { OmzetData, ProfitData, TopProduct, BestDay } from "./data";

export type IoAnswer = {
  answer: string;
  breakdown?: { label: string; value: string }[];
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function respondOmzet(range: DateRange, data: OmzetData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi tercatat untuk ${range.label}, jadi aku belum bisa menghitung omzetnya.` };
  }
  const answer = pick([
    `Omzetmu untuk ${range.label} adalah ${formatRupiah(data.omzet)}, dari ${data.transaksiCount} transaksi.`,
    `Untuk ${range.label}, total omzetmu ${formatRupiah(data.omzet)} (${data.transaksiCount} transaksi).`,
  ]);
  return {
    answer,
    breakdown: [
      { label: "Omzet", value: formatRupiah(data.omzet) },
      { label: "Transaksi", value: String(data.transaksiCount) },
      {
        label: "Rata-rata/transaksi",
        value: formatRupiah(data.transaksiCount > 0 ? data.omzet / data.transaksiCount : 0),
      },
    ],
  };
}

export function respondTransaksiCount(range: DateRange, data: OmzetData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi tercatat untuk ${range.label}.` };
  }
  return {
    answer: pick([
      `Untuk ${range.label}, kamu sudah mencatat ${data.transaksiCount} transaksi.`,
      `Ada ${data.transaksiCount} transaksi tercatat untuk ${range.label}.`,
    ]),
  };
}

export function respondProfit(range: DateRange, data: ProfitData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi tercatat untuk ${range.label}, jadi aku belum bisa menghitung keuntungannya.` };
  }
  return {
    answer: pick([
      `Keuntungan bersihmu untuk ${range.label} sekitar ${formatRupiah(data.labaBersih)}, setelah dikurangi pengeluaran ${formatRupiah(data.pengeluaran)}.`,
      `Untuk ${range.label}, laba bersihmu ${formatRupiah(data.labaBersih)} (laba kotor ${formatRupiah(data.labaKotor)} dikurangi pengeluaran ${formatRupiah(data.pengeluaran)}).`,
    ]),
    breakdown: [
      { label: "Laba Kotor", value: formatRupiah(data.labaKotor) },
      { label: "Pengeluaran", value: formatRupiah(data.pengeluaran) },
      { label: "Laba Bersih", value: formatRupiah(data.labaBersih) },
    ],
  };
}

export function respondTopProduct(range: DateRange, product: TopProduct): IoAnswer {
  if (!product) {
    return { answer: `Belum ada produk yang terjual untuk ${range.label}, jadi aku belum bisa menentukan yang paling laku.` };
  }
  return {
    answer: pick([
      `Produk paling laku untuk ${range.label} adalah ${product.name}, terjual ${product.quantity} kali.`,
      `${product.name} jadi yang paling laku untuk ${range.label} — sudah ${product.quantity} kali terjual.`,
    ]),
    breakdown: [
      { label: "Produk", value: product.name },
      { label: "Terjual", value: String(product.quantity) },
      { label: "Omzet dari produk ini", value: formatRupiah(product.omzet) },
    ],
  };
}

export function respondBestDay(range: DateRange, day: BestDay): IoAnswer {
  if (!day) {
    return { answer: `Belum ada transaksi tercatat untuk ${range.label}, jadi aku belum bisa menentukan hari terbaiknya.` };
  }
  const [y, m, d] = day.date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return {
    answer: `Untuk ${range.label}, omzet tertinggimu ada di hari ${label} — ${formatRupiah(day.omzet)}.`,
  };
}

export function respondAvgPerDay(range: DateRange, data: OmzetData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi tercatat untuk ${range.label}.` };
  }
  const days = daysBetween(range.from, range.to);
  const avg = data.omzet / days;
  return {
    answer: `Rata-rata omzetmu untuk ${range.label} sekitar ${formatRupiah(avg)} per hari (dari total ${formatRupiah(data.omzet)} selama ${days} hari).`,
  };
}

export function respondCompare(
  metric: "omzet" | "profit",
  current: DateRange,
  previous: DateRange,
  currentValue: number,
  previousValue: number
): IoAnswer {
  const metricLabel = metric === "omzet" ? "Omzet" : "Laba bersih";

  if (currentValue === 0 && previousValue === 0) {
    return { answer: `Belum ada data ${metricLabel.toLowerCase()} untuk ${current.label} maupun ${previous.label}.` };
  }
  if (previousValue === 0) {
    return {
      answer: `${metricLabel} untuk ${current.label} sudah ${formatRupiah(currentValue)}. Belum ada data pembanding di ${previous.label}, jadi aku belum bisa hitung persentase kenaikannya.`,
    };
  }

  const diff = currentValue - previousValue;
  const pct = Math.round((diff / previousValue) * 100);

  if (diff === 0) {
    return {
      answer: `${metricLabel} untuk ${current.label} sama persis dengan ${previous.label}, yaitu ${formatRupiah(currentValue)}.`,
    };
  }

  const arah = diff > 0 ? "naik" : "turun";
  return {
    answer: pick([
      `${metricLabel} ${current.label} ${arah} sekitar ${Math.abs(pct)}% dibanding ${previous.label} (${formatRupiah(currentValue)} vs ${formatRupiah(previousValue)}).`,
      `Dibanding ${previous.label}, ${metricLabel.toLowerCase()} ${current.label} ${arah} ${Math.abs(pct)}% — dari ${formatRupiah(previousValue)} jadi ${formatRupiah(currentValue)}.`,
    ]),
    breakdown: [
      { label: current.label, value: formatRupiah(currentValue) },
      { label: previous.label, value: formatRupiah(previousValue) },
      { label: "Perubahan", value: `${diff > 0 ? "+" : ""}${pct}%` },
    ],
  };
}

export function respondUnknown(): IoAnswer {
  return {
    answer: pick([
      "Maaf, aku lebih jago bantu kamu soal warung 😄 Coba tanya tentang omzet, transaksi, produk, atau keuntungan.",
      "Hmm, itu di luar yang aku bisa bantu. Coba tanya soal omzet, transaksi, atau produk terlaris ya.",
    ]),
  };
}
