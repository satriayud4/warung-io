// Lapisan JAWABAN — mengubah angka yang SUDAH dihitung (dari data.ts) jadi
// kalimat ala "io": singkat, natural, kayak teman ngobrol, bukan laporan
// formal. Tidak ada perhitungan apa pun di sini, cuma menyusun kata-kata
// dari angka yang sudah pasti benar.

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
    return { answer: `Belum ada transaksi yang tercatat untuk ${range.label}.` };
  }
  const answer = pick([
    `Omzetmu ${range.label} ${formatRupiah(data.omzet)} dari ${data.transaksiCount} transaksi.`,
    `${data.transaksiCount} transaksi ${range.label}, omzetnya ${formatRupiah(data.omzet)}.`,
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
    return { answer: `Belum ada transaksi yang tercatat untuk ${range.label}.` };
  }
  return {
    answer: pick([
      `Ada ${data.transaksiCount} transaksi ${range.label}.`,
      `${data.transaksiCount} transaksi tercatat ${range.label}.`,
    ]),
  };
}

export function respondProfit(range: DateRange, data: ProfitData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi yang tercatat untuk ${range.label}, jadi belum ada untung yang bisa dihitung.` };
  }
  return {
    answer: pick([
      `Untung bersihmu ${range.label} sekitar ${formatRupiah(data.labaBersih)}.`,
      `${range.label}, untungnya ${formatRupiah(data.labaBersih)} — setelah dikurangi pengeluaran ${formatRupiah(data.pengeluaran)}.`,
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
    return { answer: `Belum ada produk yang terjual untuk ${range.label}.` };
  }
  return {
    answer: pick([
      `${product.name} paling laku ${range.label}, ${product.quantity}x terjual.`,
      `Yang paling laku ${range.label}: ${product.name}, ${product.quantity}x terjual.`,
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
    return { answer: `Belum ada transaksi yang tercatat untuk ${range.label}.` };
  }
  const [y, m, d] = day.date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return {
    answer: `Omzet tertinggi ${range.label} ada di hari ${label}, ${formatRupiah(day.omzet)}.`,
  };
}

export function respondAvgPerDay(range: DateRange, data: OmzetData): IoAnswer {
  if (data.transaksiCount === 0) {
    return { answer: `Belum ada transaksi yang tercatat untuk ${range.label}.` };
  }
  const days = daysBetween(range.from, range.to);
  const avg = data.omzet / days;
  return {
    answer: `Rata-rata omzetmu ${range.label} sekitar ${formatRupiah(avg)} per hari.`,
  };
}

export function respondCompare(
  metric: "omzet" | "profit",
  current: DateRange,
  previous: DateRange,
  currentValue: number,
  previousValue: number
): IoAnswer {
  const metricLabel = metric === "omzet" ? "Omzet" : "Untung bersih";

  if (currentValue === 0 && previousValue === 0) {
    return { answer: `Belum ada data ${metricLabel.toLowerCase()} untuk ${current.label} maupun ${previous.label}.` };
  }
  if (previousValue === 0) {
    return {
      answer: `${metricLabel} ${current.label} udah ${formatRupiah(currentValue)}. Belum ada pembanding di ${previous.label}, jadi belum bisa dihitung persentasenya.`,
    };
  }

  const diff = currentValue - previousValue;
  const pct = Math.round((diff / previousValue) * 100);

  if (diff === 0) {
    return {
      answer: `${metricLabel} ${current.label} sama persis dengan ${previous.label}, ${formatRupiah(currentValue)}.`,
    };
  }

  const breakdown = [
    { label: current.label, value: formatRupiah(currentValue) },
    { label: previous.label, value: formatRupiah(previousValue) },
    { label: "Perubahan", value: `${diff > 0 ? "+" : ""}${pct}%` },
  ];

  if (diff > 0) {
    return {
      answer: pick([
        `Naik nih 👀 ${metricLabel} ${current.label} ${Math.abs(pct)}% lebih tinggi dari ${previous.label}.`,
        `${metricLabel} ${current.label} naik ${Math.abs(pct)}% dibanding ${previous.label}.`,
      ]),
      breakdown,
    };
  }

  return {
    answer: pick([
      `${metricLabel} ${current.label} turun ${Math.abs(pct)}% dibanding ${previous.label}.`,
      `Agak turun, ${metricLabel.toLowerCase()} ${current.label} ${Math.abs(pct)}% lebih rendah dari ${previous.label}.`,
    ]),
    breakdown,
  };
}

export function respondUnknown(): IoAnswer {
  return {
    answer: pick([
      "Aku lebih jago soal warung 😄 Coba tanya omzet, transaksi, produk terlaris, atau untung.",
      "Hmm, itu di luar yang aku bisa bantu. Coba tanya soal omzet, transaksi, atau produk terlaris ya.",
    ]),
  };
}
