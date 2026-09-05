export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/kasir", label: "Kasir", icon: "cart" },
  { href: "/produk", label: "Produk", icon: "box" },
  { href: "/transaksi", label: "Transaksi", icon: "list" },
  { href: "/pengeluaran", label: "Pengeluaran", icon: "wallet" },
  { href: "/laporan", label: "Laporan", icon: "chart" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"] | "more";

// Bottom nav (mobile) hanya menampung 5 slot yang nyaman untuk jempol, jadi
// tidak semua item dari NAV_ITEMS dipakai langsung — Pengeluaran, Laporan,
// dan Pengaturan yang lebih jarang disentuh saat sedang sibuk melayani
// pembeli dikumpulkan di satu tab "Lainnya". Kasir sengaja diletakkan di
// tengah (slot ke-3 dari 5) supaya tombol bulat yang ditinggikan benar-benar
// center, bukan condong ke kiri.
export const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/produk", label: "Produk", icon: "box" },
  { href: "/kasir", label: "Kasir", icon: "cart" },
  { href: "/transaksi", label: "Transaksi", icon: "list" },
  { href: "/lainnya", label: "Lainnya", icon: "more" },
] as const;

// Halaman-halaman yang dianggap "di dalam" tab Lainnya, supaya tab itu
// tetap tersorot ketika sedang membuka salah satu halamannya.
export const LAINNYA_PATHS = ["/pengeluaran", "/laporan", "/pengaturan", "/lainnya"];
