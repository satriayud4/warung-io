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

export function formatHariTanggalLengkap(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> 'Kamis, 3 September 2026'
  // Parsed as local midnight (no "Z") so the calendar day shown always
  // matches transaction_date regardless of the viewer's timezone.
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatHariTanggalJam(dateStr: string, isoTime: string) {
  // -> 'Kamis, 3 September 2026, 14:30'
  return `${formatHariTanggalLengkap(dateStr)}, ${formatJam(isoTime)}`;
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
