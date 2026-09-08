"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PERIOD_OPTIONS, type Period } from "@/lib/date-range";

export function PeriodFilter({
  activePeriod,
  from,
  to,
}: {
  activePeriod: Period;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Ganti periode cuma mengubah query string di URL yang sama — Next.js
  // TIDAK otomatis menampilkan loading.tsx untuk kasus ini (itu cuma
  // muncul saat pindah rute). useTransition kasih tahu kita persis kapan
  // data baru sedang diambil, supaya bisa kasih umpan balik visual sendiri
  // di sini.
  const [isPending, startTransition] = useTransition();

  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustom, setShowCustom] = useState(activePeriod === "custom");
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  function selectPeriod(p: Period) {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    setPendingValue(p);
    startTransition(() => {
      router.push(`${pathname}?period=${p}`);
    });
  }

  function applyCustom() {
    setPendingValue("custom");
    startTransition(() => {
      router.push(`${pathname}?period=custom&from=${customFrom}&to=${customTo}`);
    });
  }

  return (
    <div>
      {/* Bar loading tipis di atas — muncul selagi data periode baru
          sedang diambil dari server, supaya tap terasa langsung
          direspons (bukan diam sesaat). */}
      {isPending && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-brand-100">
          <div className="h-full w-1/3 animate-[loading-bar_0.9s_ease-in-out_infinite] bg-brand-500" />
        </div>
      )}

      {/* Mobile: dropdown native — sekali tap langsung buka picker OS,
          tidak perlu geser-geser mencari opsi di deretan chip yang makin
          panjang (sekarang ada 7 pilihan). Jauh lebih nyaman satu tangan. */}
      <div className="md:hidden">
        <label className="sr-only" htmlFor="period-select">
          Pilih periode
        </label>
        <div className="relative">
          <select
            id="period-select"
            value={showCustom ? "custom" : activePeriod}
            onChange={(e) => selectPeriod(e.target.value as Period)}
            disabled={isPending}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm disabled:opacity-60"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {isPending ? (
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
            </svg>
          ) : (
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 8 5 5 5-5" />
            </svg>
          )}
        </div>
      </div>

      {/* Desktop/tablet: deretan chip — ada cukup ruang untuk semua opsi
          sekaligus tanpa perlu buka dropdown. */}
      <div className="hidden gap-1.5 overflow-x-auto pb-1 md:flex">
        {PERIOD_OPTIONS.map((opt) => {
          const active = activePeriod === opt.value || (opt.value === "custom" && showCustom);
          const thisPending = isPending && pendingValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => selectPeriod(opt.value)}
              disabled={isPending}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition disabled:cursor-wait ${
                active ? "bg-brand-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
              } ${isPending && !thisPending ? "opacity-50" : ""}`}
            >
              {thisPending && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
                </svg>
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <div className="mt-2 flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-gray-100">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Dari</label>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Sampai</label>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending && pendingValue === "custom" && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
              </svg>
            )}
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
}
