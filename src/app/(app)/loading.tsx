import { PageSkeleton } from "@/components/layout/PageSkeleton";

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
  return <PageSkeleton />;
}
