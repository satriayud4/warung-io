// Skeleton generik yang dipakai loading.tsx di seluruh halaman (app).
// Next.js menampilkan ini SEKETIKA (di browser, tanpa nunggu server) saat
// menu di-tap, sebelum halaman tujuan yang sebenarnya selesai dimuat —
// jadi tap terasa langsung merespons, bukan diam beberapa saat dulu.
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-gray-200" />
        <div className="h-5 w-48 rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-100" />
        ))}
      </div>

      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
