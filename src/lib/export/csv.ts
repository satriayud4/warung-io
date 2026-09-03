"use client";

import { triggerDownload } from "./download";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = buildCsv(rows);
  // BOM di depan supaya karakter (termasuk "Rp"/huruf non-ASCII) terbaca
  // benar saat dibuka langsung di Excel.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}
