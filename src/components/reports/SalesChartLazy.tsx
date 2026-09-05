"use client";

import dynamic from "next/dynamic";
import type { SalesByDate } from "./SalesChart";

// recharts menyumbang porsi JS terbesar di halaman Laporan (~100kb+).
// Dimuat lewat next/dynamic (ssr: false) supaya tidak ikut memblokir
// render awal bagian lain dari Laporan (Ringkasan, Pembayaran, dst) —
// grafiknya sendiri muncul sedikit belakangan dengan skeleton loading,
// tapi halaman terasa lebih cepat responsif secara keseluruhan.
const SalesChart = dynamic(() => import("./SalesChart").then((m) => m.SalesChart), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-2xl bg-white ring-1 ring-gray-100">
      <p className="text-sm text-gray-400">Memuat grafik...</p>
    </div>
  ),
});

export function SalesChartLazy({ data }: { data: SalesByDate[] }) {
  return <SalesChart data={data} />;
}
