"use client";

import { useRef, useState } from "react";
import type { ReportData } from "@/lib/export/report-data";
import { exportReportExcel, exportReportCsv } from "@/lib/export/generate-files";
import { DailyReportCard } from "./DailyReportCard";

export function ExportSection({ data }: { data: ReportData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isSingleDay = data.from === data.to;

  const [busy, setBusy] = useState<"excel" | "csv" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExcel() {
    setBusy("excel");
    setError(null);
    try {
      await exportReportExcel(data);
    } catch {
      setError("Gagal membuat file Excel. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCsv() {
    setBusy("csv");
    setError(null);
    try {
      await exportReportCsv(data);
    } catch {
      setError("Gagal membuat file CSV. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function handleImage() {
    if (!cardRef.current) return;
    setBusy("image");
    setError(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `warung-io-laporan-${data.from}.png`;
      a.click();
    } catch {
      setError("Gagal membuat gambar. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700">Export Laporan</h2>

      {isSingleDay ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
          <div className="w-full overflow-hidden rounded-2xl ring-1 ring-gray-200">
            <DailyReportCard ref={cardRef} data={data} />
          </div>

          <div className="grid w-full grid-cols-3 gap-2">
            <ExportButton label="Gambar" busy={busy === "image"} onClick={handleImage} />
            <ExportButton label="Excel" busy={busy === "excel"} onClick={handleExcel} />
            <ExportButton label="CSV" busy={busy === "csv"} onClick={handleCsv} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
          <p className="mb-3 text-xs text-gray-500">
            Export gambar hanya tersedia untuk laporan 1 hari (pilih "Hari ini" atau "Kemarin").
            Untuk periode lebih dari 1 hari, pakai Excel atau CSV.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ExportButton label="Export Excel" busy={busy === "excel"} onClick={handleExcel} />
            <ExportButton label="Export CSV" busy={busy === "csv"} onClick={handleCsv} />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ExportButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {busy ? "..." : label}
    </button>
  );
}
