import { formatTanggalSaja } from "@/lib/format";
import { computeMilestones } from "@/lib/io/milestones";

// "Perjalanan Warung" — timeline milestone, dihitung murni dari data
// transaksi asli (lihat src/lib/io/milestones.ts). Kalau belum ada
// transaksi yang mencapai suatu ambang batas, milestone itu memang tidak
// akan muncul — bukan bug, supaya tidak ada yang palsu.
export async function PerjalananWarung() {
  const milestones = await computeMilestones();

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-sm font-semibold text-gray-800">📈 Perjalanan Warung</h2>
      <p className="mb-4 text-xs text-gray-500">Perkembangan warungmu dari waktu ke waktu</p>

      {milestones.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
          Belum ada milestone. Catat transaksi pertamamu di Kasir untuk mulai lihat
          perjalanan warungmu di sini 🌱
        </p>
      ) : (
        <div>
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base">
                  {m.icon}
                </span>
                {i < milestones.length - 1 && (
                  <span className="w-px flex-1 bg-gray-200" aria-hidden />
                )}
              </div>
              <div className={i < milestones.length - 1 ? "pb-5" : ""}>
                <p className="pt-1.5 text-sm font-semibold text-gray-900">{m.title}</p>
                <p className="text-xs text-gray-400">{formatTanggalSaja(m.date)}</p>
                <p className="mt-1 text-sm text-gray-600">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
