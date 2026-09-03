export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/kasir", label: "Kasir", icon: "cart" },
  { href: "/produk", label: "Produk", icon: "box" },
  { href: "/transaksi", label: "Transaksi", icon: "list" },
  { href: "/pengeluaran", label: "Pengeluaran", icon: "wallet" },
  { href: "/laporan", label: "Laporan", icon: "chart" },
  { href: "/pengaturan", label: "Pengaturan", icon: "settings" },
] as const;

export type NavIcon = (typeof NAV_ITEMS)[number]["icon"];
