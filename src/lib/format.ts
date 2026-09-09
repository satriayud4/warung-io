// Shared display formatters used across the app.

// Warung.io tidak punya preferensi zona waktu per akun — dikunci ke WIB
// (Asia/Jakarta) supaya "hari ini" dan jam transaksi selalu konsisten,
// baik dihitung di server (Vercel jalan pakai UTC secara default) maupun
// di browser pengguna. Tanpa ini, "hari ini" versi server bisa beda
// dengan versi WIB selama beberapa jam tiap harinya (WIB = UTC+7).
export const APP_TIMEZONE = "Asia/Jakarta";

export function formatRupiah(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export function formatTanggalPendek(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> 'DD/MM/YYYY'
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTanggalSaja(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> '3 September 2026' (tanpa nama hari)
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function getNamaHari(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> 'Kamis'
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", { weekday: "long" });
}

export function formatHariTanggalLengkap(dateStr: string) {
  // dateStr: 'YYYY-MM-DD' -> 'Kamis, 3 September 2026'
  // Parsed as local midnight (no "Z") so the calendar day shown always
  // matches transaction_date regardless of the viewer's timezone.
  return `${getNamaHari(dateStr)}, ${formatTanggalSaja(dateStr)}`;
}

export function formatHariTanggalJam(dateStr: string, isoTime: string) {
  // -> 'Kamis, 3 September 2026, 14:30'
  return `${formatHariTanggalLengkap(dateStr)}, ${formatJam(isoTime)}`;
}

export function formatJam(isoString: string) {
  return new Date(isoString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

export function todayDateInputValue() {
  // en-CA memformat sebagai YYYY-MM-DD langsung — pas untuk <input type="date">.
  // Timezone dikunci eksplisit, tidak pakai getTimezoneOffset() lagi (itu
  // ikut zona waktu tempat KODE-nya jalan, bukan zona waktu WIB — di server
  // Vercel yang jalan UTC, itu bisa salah sampai 7 jam tiap hari).
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}
