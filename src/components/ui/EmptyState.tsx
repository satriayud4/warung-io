import type { NavIcon as NavIconType } from "@/components/layout/nav-items";
import { NavIcon } from "@/components/layout/NavIcon";

// Tampilan kosong yang konsisten di seluruh halaman — pakai kosakata ikon
// yang sama dengan navigasi (bukan ilustrasi baru yang tidak nyambung),
// supaya terasa satu sistem, bukan tempelan aset generik.
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: NavIconType;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <NavIcon name={icon} className="h-6 w-6 text-brand-500" />
      </div>
      <p className="mt-3 font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && (
        <a
          href={action.href}
          className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
