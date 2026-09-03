// Shared display formatters used across the app.

export function formatRupiah(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export function formatTanggalIndo(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTanggalPendek(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> 'DD/MM/YYYY'
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatJam(isoString: string) {
  return new Date(isoString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export type Period = "hari-ini" | "kemarin" | "7-hari" | "bulan-ini" | "custom";

export const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "hari-ini", label: "Hari ini" },
  { key: "kemarin", label: "Kemarin" },
  { key: "7-hari", label: "7 hari" },
  { key: "bulan-ini", label: "Bulan ini" },
  { key: "custom", label: "Custom" },
];

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Resolves a period key (+ optional custom from/to) into a concrete
// start/end date range (inclusive, 'YYYY-MM-DD') and a human label.
export function resolvePeriod(
  period: Period,
  customFrom?: string,
  customTo?: string
): { start: string; end: string; label: string } {
  const today = todayDateInputValue();

  switch (period) {
    case "kemarin": {
      const y = addDays(today, -1);
      return { start: y, end: y, label: `Kemarin — ${formatTanggalPendek(y)}` };
    }
    case "7-hari": {
      const start = addDays(today, -6);
      return {
        start,
        end: today,
        label: `7 hari terakhir (${formatTanggalPendek(start)} – ${formatTanggalPendek(today)})`,
      };
    }
    case "bulan-ini": {
      const start = today.slice(0, 8) + "01";
      return {
        start,
        end: today,
        label: `Bulan ini (${formatTanggalPendek(start)} – ${formatTanggalPendek(today)})`,
      };
    }
    case "custom": {
      const start = customFrom || today;
      const end = customTo || today;
      return { start, end, label: `${formatTanggalPendek(start)} – ${formatTanggalPendek(end)}` };
    }
    case "hari-ini":
    default:
      return { start: today, end: today, label: `Hari ini — ${formatTanggalIndo(new Date())}` };
  }
}
