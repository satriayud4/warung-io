"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { NavIcon } from "./NavIcon";

// Bottom navigation for mobile — thumb-friendly, always visible.
// Kasir sits in the middle as a raised primary action.
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.filter((i) => i.href !== "/pengaturan").map((item) => {
          const active = pathname.startsWith(item.href);
          const isPrimary = item.href === "/kasir";

          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                className={`flex w-full flex-col items-center gap-1 py-2 text-[11px] ${
                  active ? "text-brand-600" : "text-gray-500"
                }`}
              >
                <span
                  className={
                    isPrimary
                      ? "-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-md"
                      : ""
                  }
                >
                  <NavIcon name={item.icon} className={isPrimary ? "h-6 w-6" : "h-5 w-5"} />
                </span>
                <span className={isPrimary ? "font-semibold text-brand-600" : ""}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
