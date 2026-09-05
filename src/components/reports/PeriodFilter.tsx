"use client";

import { useState } from "react";
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

  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustom, setShowCustom] = useState(activePeriod === "custom");

  function selectPeriod(p: Period) {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    router.push(`${pathname}?period=${p}`);
  }

  function applyCustom() {
    router.push(`${pathname}?period=custom&from=${customFrom}&to=${customTo}`);
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIOD_OPTIONS.map((opt) => {
          const active =
            activePeriod === opt.value || (opt.value === "custom" && showCustom);
          return (
            <button
              key={opt.value}
              onClick={() => selectPeriod(opt.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                active ? "bg-brand-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
              }`}
            >
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
            className="rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
}
