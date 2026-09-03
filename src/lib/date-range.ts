// Shared period logic for Dashboard & Laporan. Both pages read the same
// `period` (and `from`/`to` for custom) from the URL search params, so the
// filter state is shareable/bookmarkable and needs no client-side state.

export type Period = "today" | "yesterday" | "7days" | "month" | "custom";

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "7days", label: "7 hari" },
  { value: "month", label: "Bulan ini" },
  { value: "custom", label: "Custom" },
];

function toDateStr(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function resolvePeriod(
  period: string | undefined,
  from: string | undefined,
  to: string | undefined
): { period: Period; from: string; to: string } {
  const today = new Date();
  const todayStr = toDateStr(today);

  switch (period) {
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = toDateStr(y);
      return { period: "yesterday", from: yStr, to: yStr };
    }
    case "7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { period: "7days", from: toDateStr(start), to: todayStr };
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { period: "month", from: toDateStr(start), to: todayStr };
    }
    case "custom": {
      if (from && to) {
        return { period: "custom", from, to };
      }
      return { period: "today", from: todayStr, to: todayStr };
    }
    default:
      return { period: "today", from: todayStr, to: todayStr };
  }
}

export function formatPeriodLabel(period: Period, from: string, to: string) {
  const fmt = (s: string) => {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  };

  if (period === "today") return `Hari ini — ${fmt(from)}`;
  if (period === "yesterday") return `Kemarin — ${fmt(from)}`;
  if (from === to) return fmt(from);
  return `${fmt(from)} – ${fmt(to)}`;
}
