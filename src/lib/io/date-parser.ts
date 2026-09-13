// Parser tanggal bahasa Indonesia untuk "Tanya io" — murni aturan/regex,
// TIDAK memakai AI untuk langkah ini. Ini penting: kalau LLM yang menebak
// tanggal, risiko salah tafsir/ngarang tanggal jadi ada. Dengan aturan
// eksplisit, "bulan ini"/"minggu lalu"/dst selalu dihitung persis sama
// setiap kali, dan gampang ditelusuri kalau ada yang salah.

import { todayDateInputValue } from "@/lib/format";

export type DateRange = { from: string; to: string; label: string };

const MONTHS: Record<string, number> = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

const MONTH_NAMES = Object.keys(MONTHS);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function todayParts(): { y: number; m: number; d: number } {
  const [y, m, d] = todayDateInputValue().split("-").map(Number);
  return { y, m, d };
}

function addDays(y: number, m: number, d: number, delta: number) {
  const dt = new Date(y, m - 1, d + delta);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function dayOfWeek(y: number, m: number, d: number) {
  return new Date(y, m - 1, d).getDay(); // 0=Minggu, 1=Senin, ...
}

function startOfWeekMonday(y: number, m: number, d: number) {
  const dow = dayOfWeek(y, m, d);
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(y, m, d, diff);
}

/**
 * Coba baca satu frasa tanggal/rentang dari teks bebas. Mengembalikan
 * null kalau tidak ada frasa tanggal yang dikenali sama sekali — pemanggil
 * (intent-parser) yang memutuskan default rentang sesuai jenis pertanyaan.
 */
export function parseDateRange(text: string): DateRange | null {
  const t = text.toLowerCase();
  const today = todayParts();

  if (/\bhari ini\b/.test(t)) {
    const s = ymd(today.y, today.m, today.d);
    return { from: s, to: s, label: "hari ini" };
  }

  if (/\bkemarin\b/.test(t)) {
    const y = addDays(today.y, today.m, today.d, -1);
    const s = ymd(y.y, y.m, y.d);
    return { from: s, to: s, label: "kemarin" };
  }

  if (/\bminggu lalu\b/.test(t)) {
    const mondayThis = startOfWeekMonday(today.y, today.m, today.d);
    const mondayLast = addDays(mondayThis.y, mondayThis.m, mondayThis.d, -7);
    const sundayLast = addDays(mondayLast.y, mondayLast.m, mondayLast.d, 6);
    return {
      from: ymd(mondayLast.y, mondayLast.m, mondayLast.d),
      to: ymd(sundayLast.y, sundayLast.m, sundayLast.d),
      label: "minggu lalu",
    };
  }

  if (/\bminggu ini\b/.test(t)) {
    const monday = startOfWeekMonday(today.y, today.m, today.d);
    return {
      from: ymd(monday.y, monday.m, monday.d),
      to: ymd(today.y, today.m, today.d),
      label: "minggu ini",
    };
  }

  if (/\b7 hari\b|\bseminggu terakhir\b/.test(t)) {
    const start = addDays(today.y, today.m, today.d, -6);
    return {
      from: ymd(start.y, start.m, start.d),
      to: ymd(today.y, today.m, today.d),
      label: "7 hari terakhir",
    };
  }

  if (/\bbulan lalu\b/.test(t)) {
    let y = today.y;
    let m = today.m - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    return { from: ymd(y, m, 1), to: ymd(y, m, daysInMonth(y, m)), label: "bulan lalu" };
  }

  if (/\bbulan ini\b/.test(t)) {
    return {
      from: ymd(today.y, today.m, 1),
      to: ymd(today.y, today.m, today.d),
      label: "bulan ini",
    };
  }

  if (/\btahun ini\b/.test(t)) {
    return {
      from: ymd(today.y, 1, 1),
      to: ymd(today.y, today.m, today.d),
      label: "tahun ini",
    };
  }

  // Rentang tanggal dengan nama bulan: "1 sampai 10 September",
  // "1-10 September", "antara tanggal 1 sampai 15 September"
  const rangePattern =
    /(\d{1,2})\s*(?:-|–|sampai|s\/d|hingga)\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/;
  const rangeMatch = t.match(rangePattern);
  if (rangeMatch) {
    const d1 = parseInt(rangeMatch[1], 10);
    const d2 = parseInt(rangeMatch[2], 10);
    const monthName = rangeMatch[3];
    const month = MONTHS[monthName];
    if (month) {
      const year = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : today.y;
      return {
        from: ymd(year, month, d1),
        to: ymd(year, month, d2),
        label: `${d1}–${d2} ${capitalize(monthName)} ${year}`,
      };
    }
  }

  // Tanggal tunggal: "tanggal 5 September", "5 September 2026", "5 September"
  const singlePattern = /(?:tanggal\s+)?(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/;
  const singleMatch = t.match(singlePattern);
  if (singleMatch) {
    const day = parseInt(singleMatch[1], 10);
    const monthName = singleMatch[2];
    const month = MONTHS[monthName];
    if (month && day >= 1 && day <= 31) {
      const year = singleMatch[3] ? parseInt(singleMatch[3], 10) : today.y;
      const s = ymd(year, month, day);
      return { from: s, to: s, label: `${day} ${capitalize(monthName)} ${year}` };
    }
  }

  return null;
}

export const _internal = { MONTH_NAMES };
