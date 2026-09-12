"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PERIOD_OPTIONS, type Period } from "@/lib/date-range";

// Spinner CSS murni (border + rotate), bukan SVG dengan path/opacity
// berlapis — lebih ringan untuk browser mobile render & composite-nya.
// SELALU ter-mount di DOM (cuma opacity yang di-toggle, bukan
// ditampilkan/disembunyikan lewat conditional render atau `hidden`).
// Ini penting: kalau elemennya dibongkar-pasang tiap render, animasi
// CSS-nya ikut restart dari awal tiap kali — di sebagian browser mobile
// ini kelihatan seperti "macet"/patah-patah alih-alih muter mulus.
function Spinner({ visible, className = "h-4 w-4" }: { visible: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 m-auto animate-spin rounded-full border-2 border-brand-100 border-t-brand-500 transition-opacity duration-150 will-change-transform ${className} ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

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

  // Di koneksi/perangkat cepat (biasanya PC), transisinya bisa selesai
  // dalam hitungan puluhan milidetik — spinner-nya kedip sekilas lalu
  // hilang sebelum sempat kelihatan, terasa seperti "tidak ada loading
  // sama sekali". Di HP/koneksi lebih lambat, jendelanya cukup lama jadi
  // jelas kelihatan. `showLoading` memastikan indikatornya tampil minimal
  // ~400ms sekali muncul, konsisten di perangkat apa pun secepat apa pun
  // datanya sebenarnya selesai diambil.
  const [showLoading, setShowLoading] = useState(false);
  const pendingStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) {
      pendingStartedAt.current = Date.now();
      setShowLoading(true);
      return;
    }
    if (pendingStartedAt.current === null) return;
    const elapsed = Date.now() - pendingStartedAt.current;
    const MIN_VISIBLE_MS = 400;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(() => {
      setShowLoading(false);
      pendingStartedAt.current = null;
    }, remaining);
    return () => clearTimeout(timer);
  }, [isPending]);

  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [showCustom, setShowCustom] = useState(activePeriod === "custom");
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  function selectPeriod(p: Period) {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    // Kalau filter yang diklik memang sudah aktif, jangan lakukan apa-apa
    // — datanya sudah pasti sama, tidak perlu reload (dan cuma bikin
    // bingung karena loading muncul padahal tidak ada yang berubah).
    if (p === activePeriod && !showCustom) {
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
      {showLoading && (
        <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-50 h-0.5 overflow-hidden bg-brand-100">
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
            value={showCustom ? "custom" : showLoading && pendingValue ? pendingValue : activePeriod}
            onChange={(e) => selectPeriod(e.target.value as Period)}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-gray-800 shadow-sm"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2">
            <svg
              className={`absolute inset-0 h-4 w-4 text-gray-400 transition-opacity duration-150 ${
                showLoading ? "opacity-0" : "opacity-100"
              }`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 8 5 5 5-5" />
            </svg>
            <Spinner visible={showLoading} />
          </div>
        </div>
      </div>

      {/* Desktop/tablet: deretan chip — ada cukup ruang untuk semua opsi
          sekaligus tanpa perlu buka dropdown. */}
      <div className="hidden gap-1.5 overflow-x-auto pb-1 md:flex">
        {PERIOD_OPTIONS.map((opt) => {
          const thisPending = showLoading && pendingValue === opt.value;
          // Tombol yang baru saja di-tap langsung dianggap "aktif" (hijau)
          // secara optimistis, tidak nunggu activePeriod dari server dulu.
          // Tanpa ini, tombol yang baru diklik untuk PINDAH filter masih
          // putih selama loading (activePeriod belum ter-update), dan
          // spinner putih di atas latar putih jadi tidak kelihatan sama
          // sekali — persis bug yang bikin klik pertama terasa "kosong".
          const active =
            activePeriod === opt.value || (opt.value === "custom" && showCustom) || thisPending;
          return (
            <button
              key={opt.value}
              onClick={() => selectPeriod(opt.value)}
              disabled={showLoading}
              className={`flex shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition disabled:cursor-wait ${
                active ? "bg-brand-500 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"
              } ${showLoading && !thisPending ? "opacity-50" : ""}`}
            >
              {thisPending && (
                <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white will-change-transform" />
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
            disabled={showLoading}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {showLoading && pendingValue === "custom" && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white will-change-transform" />
            )}
            Terapkan
          </button>
        </div>
      )}
    </div>
  );
}
