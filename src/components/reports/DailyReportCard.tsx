"use client";

import { forwardRef } from "react";
import { formatRupiah } from "@/lib/format";
import type { ReportData } from "@/lib/export/report-data";

// Kartu ringkasan harian — dipakai sebagai preview di halaman DAN sebagai
// target tangkapan gambar (html2canvas) untuk tombol "Unduh Gambar".
export const DailyReportCard = forwardRef<HTMLDivElement, { data: ReportData }>(
  function DailyReportCard({ data }, ref) {
    const bestSellers = data.byProduct.slice(0, 3);

    return (
      <div ref={ref} className="w-full max-w-sm rounded-2xl bg-white p-6 text-gray-900">
        <div className="text-center">
          <p className="text-lg font-bold text-brand-600">{data.storeName}</p>
          <p className="text-xs text-gray-500">Laporan Harian — {data.periodLabel}</p>
        </div>

        <div className="my-4 border-t border-dashed border-gray-300" />

        <div className="space-y-1.5 text-sm">
          <Row label="Omzet" value={data.summary.omzet} />
          <Row label="Modal" value={data.summary.modal} />
          <Row label="Laba Kotor" value={data.summary.labaKotor} bold />
          <Row label="Pengeluaran" value={data.summary.pengeluaran} negative />
          <div className="my-1.5 border-t border-dashed border-gray-300" />
          <Row label="Laba Bersih" value={data.summary.labaBersih} bold large />
        </div>

        <div className="my-4 border-t border-dashed border-gray-300" />

        <div className="space-y-1.5 text-sm">
          <Row label="Tunai" value={data.payment.tunai} />
          <Row label="Non-tunai" value={data.payment.nontunai} />
        </div>

        {bestSellers.length > 0 && (
          <>
            <div className="my-4 border-t border-dashed border-gray-300" />
            <p className="mb-1.5 text-xs font-semibold text-gray-500">Menu Terlaris</p>
            <div className="space-y-1 text-sm">
              {bestSellers.map((p) => (
                <div key={p.product_name} className="flex justify-between">
                  <span className="text-gray-700">{p.product_name}</span>
                  <span className="text-gray-500">{Number(p.quantity)} porsi</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-5 text-center text-[10px] text-gray-400">
          Dibuat dengan Warung.io — Catat jualan, tahu untung.
        </div>
      </div>
    );
  }
);

function Row({
  label,
  value,
  bold,
  large,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  large?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span
        className={[
          bold ? "font-semibold" : "",
          large ? "text-base" : "",
          negative ? "text-red-600" : "text-gray-900",
        ].join(" ")}
      >
        {negative ? "-" : ""}
        {formatRupiah(value)}
      </span>
    </div>
  );
}
