// Skeleton generik yang dipakai loading.tsx di seluruh halaman (app).
// Next.js menampilkan ini SEKETIKA (di browser, tanpa nunggu server) saat
// menu di-tap, sebelum halaman tujuan yang sebenarnya selesai dimuat —
// jadi tap terasa langsung merespons, bukan diam beberapa saat dulu.
// Sapuan shimmer murni fungsional (menandakan "sedang memuat"), bukan
// dekorasi — lihat .skeleton-shimmer di globals.css.
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="skeleton-shimmer h-3 w-32 rounded" />
        <div className="skeleton-shimmer h-5 w-48 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-2xl" />
        ))}
      </div>

      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton-shimmer h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
