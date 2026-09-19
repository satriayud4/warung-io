import { currentHourInAppTimezone } from "@/lib/format";
import { fetchGreetingNumbers } from "@/lib/io/greeting-data";
import { buildInsight, getTimeGreeting } from "@/lib/io/greeting";

// Sapaan personal "io" — kartu paling atas di Dashboard. Pesannya dipilih
// dari data transaksi yang benar-benar ada (lihat buildInsight di
// src/lib/io/greeting.ts); kalau datanya belum cukup untuk klaim spesifik,
// otomatis turun ke sapaan umum, tidak pernah mengarang tren/angka.
export async function IoGreeting() {
  const [numbers, hour] = await Promise.all([
    fetchGreetingNumbers(),
    Promise.resolve(currentHourInAppTimezone()),
  ]);

  const waktu = getTimeGreeting(hour);
  const insight = buildInsight(numbers);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg">
          👋
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">Selamat {waktu}</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600">{insight.text}</p>
        </div>
      </div>
    </div>
  );
}
