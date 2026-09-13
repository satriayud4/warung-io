// Parser tanggal bahasa Indonesia untuk "Tanya io" — murni aturan/regex,
// TIDAK memakai AI untuk langkah ini. Ini penting: kalau LLM yang menebak
// tanggal, risiko salah tafsir/ngarang tanggal jadi ada. Dengan aturan
// eksplisit, "bulan ini"/"minggu lalu"/dst selalu dihitung persis sama
// setiap kali, dan gampang ditelusuri kalau ada yang salah.

import { todayDateInputValue } from "@/lib/format";

export type DateRange = { from: string; to: string; label: string };

const MONTHS: Record<string, number> = {
  januari: 1,
  jan: 1,
  februari: 2,
  feb: 2,
  maret: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  agustus: 8,
  agt: 8,
  agu: 8,
  september: 9,
  sep: 9,
  sept: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  desember: 12,
  des: 12,
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

  // Satu bulan penuh disebut namanya saja, tanpa "ini"/"lalu":
  // "bulan September", "di bulan Agustus". Diperiksa sebelum pola rentang
  // supaya tidak salah kesangkut ke pola lain.
  const namedMonthOnlyPattern = /\bbulan\s+([a-z]+)\b(?!\s*\d)/;
  const namedMonthMatch = t.match(namedMonthOnlyPattern);
  if (namedMonthMatch && !/\bini\b|\blalu\b/.test(t)) {
    const month = MONTHS[namedMonthMatch[1]];
    if (month) {
      const year = today.y;
      return {
        from: ymd(year, month, 1),
        to: ymd(year, month, daysInMonth(year, month)),
        label: `${capitalize(namedMonthMatch[1])} ${year}`,
      };
    }
  }

  // Rentang tanggal dengan nama bulan. Mendukung baik dalam satu bulan
  // ("1 sampai 10 September", "1-10 September") MAUPUN lintas bulan
  // ("25 Agustus sampai 5 September") — nama bulan pertama OPSIONAL;
  // kalau tidak disebut, dianggap sama dengan bulan yang disebut di akhir.
  const rangePattern =
    /(\d{1,2})(?:\s+([a-z]+))?\s*(?:-|–|sampai|s\/d|hingga)\s*(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/;
  const rangeMatch = t.match(rangePattern);
  if (rangeMatch) {
    const d1 = parseInt(rangeMatch[1], 10);
    const month1Name = rangeMatch[2];
    const d2 = parseInt(rangeMatch[3], 10);
    const month2Name = rangeMatch[4];
    const month2 = MONTHS[month2Name];
    // month1Name bisa saja hasil tangkap kata lain (bukan nama bulan) kalau
    // tidak ada bulan pertama disebutkan — kalau bukan nama bulan yang
    // valid, anggap tidak ada, pakai bulan yang sama dengan month2.
    const month1 = month1Name && MONTHS[month1Name] ? MONTHS[month1Name] : month2;
    if (month1 && month2) {
      const year = rangeMatch[5] ? parseInt(rangeMatch[5], 10) : today.y;
      const sameMonth = month1 === month2;
      const label = sameMonth
        ? `${d1}–${d2} ${capitalize(month2Name)} ${year}`
        : `${d1} ${capitalize(month1Name!)} – ${d2} ${capitalize(month2Name)} ${year}`;
      return { from: ymd(year, month1, d1), to: ymd(year, month2, d2), label };
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

  // Format tanggal angka: "10/09/2026", "10-9-2026", "10/09" (DD/MM,
  // konvensi Indonesia — tanggal duluan baru bulan).
  const numericPattern = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/;
  const numericMatch = t.match(numericPattern);
  if (numericMatch) {
    const day = parseInt(numericMatch[1], 10);
    const month = parseInt(numericMatch[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const year = numericMatch[3] ? parseInt(numericMatch[3], 10) : today.y;
      const s = ymd(year, month, day);
      const monthLabel = capitalize(Object.keys(MONTHS).find((k) => MONTHS[k] === month && k.length > 3) ?? "");
      return { from: s, to: s, label: `${day} ${monthLabel} ${year}` };
    }
  }

  // "tanggal 5" saja tanpa nama bulan — anggap bulan berjalan (bulan ini).
  // Wajib ada kata "tanggal" di depannya supaya tidak salah menangkap
  // angka lain yang kebetulan muncul di kalimat (mis. "10 hari").
  const bareDayPattern = /\btanggal\s+(\d{1,2})\b/;
  const bareDayMatch = t.match(bareDayPattern);
  if (bareDayMatch) {
    const day = parseInt(bareDayMatch[1], 10);
    if (day >= 1 && day <= daysInMonth(today.y, today.m)) {
      const s = ymd(today.y, today.m, day);
      return { from: s, to: s, label: `${day} ${capitalize(Object.keys(MONTHS).find((k) => MONTHS[k] === today.m && k.length > 3) ?? "")} ${today.y}` };
    }
  }

  return null;
}

export const _internal = { MONTH_NAMES };
