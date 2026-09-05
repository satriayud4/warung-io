import Link from "next/link";
import { NavIcon } from "@/components/layout/NavIcon";

const MENU = [
  {
    href: "/pengeluaran",
    label: "Pengeluaran",
    icon: "wallet",
    desc: "Catat belanja bahan, gas, listrik, dan kebutuhan warung lainnya.",
  },
  {
    href: "/laporan",
    label: "Laporan",
    icon: "chart",
    desc: "Ringkasan, grafik, rincian transaksi, dan export Excel/CSV/Gambar.",
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    icon: "settings",
    desc: "Info warung, akun Anda, dan opsi lainnya.",
  },
] as const;

// Tab "Lainnya" di bottom nav mobile — menampung halaman yang lebih jarang
// dibuka saat sedang sibuk melayani pembeli, supaya bottom nav tetap
// ringkas (5 slot) dan tombol Kasir tetap di tengah.
export default function LainnyaPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-lg font-semibold">Lainnya</h1>

      <div className="space-y-2">
        {MENU.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 active:bg-gray-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <NavIcon name={item.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{item.label}</p>
              <p className="truncate text-xs text-gray-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
