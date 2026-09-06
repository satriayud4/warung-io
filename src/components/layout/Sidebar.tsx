"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";
import { Logo } from "@/components/brand/Logo";

// Left sidebar navigation for tablet/desktop widths.
export function Sidebar({ storeName }: { storeName: string }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Logo className="h-8 w-8 shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight text-brand-600">Warung.io</p>
          <p className="truncate text-xs text-gray-500">{storeName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
