// Muncul otomatis (lewat Suspense bawaan Next.js) begitu sebuah menu
// ditekan, SEBELUM data halaman tujuan selesai diambil dari server. Tanpa
// file ini, layar terlihat "diam" sesaat setelah menu ditekan karena tidak
// ada umpan balik visual sama sekali — dengan ini, transisi terasa instan
// walau waktu ambil data di baliknya tidak berubah.
//
// Sidebar/BottomNav/header TIDAK ikut ditimpa tampilan ini (mereka bagian
// dari layout, bukan children yang di-Suspense), jadi navigasi tetap terasa
// responsif dan tidak "berkedip".
export default function AppLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-40 rounded bg-gray-200" />
        <div className="h-5 w-56 rounded bg-gray-200" />
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-16 rounded-full bg-gray-200" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-200" />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
