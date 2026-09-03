"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatRupiah, formatTanggalPendek } from "@/lib/format";

export type SalesByDate = { sale_date: string; omzet: number; laba: number };

export function SalesChart({ data }: { data: SalesByDate[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl bg-white ring-1 ring-gray-100">
        <p className="text-sm text-gray-400">Belum ada data penjualan di periode ini.</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    tanggal: formatTanggalPendek(d.sale_date).slice(0, 5), // DD/MM
    Omzet: Number(d.omzet),
    Laba: Number(d.laba),
  }));

  return (
    <div className="h-56 rounded-2xl bg-white p-3 ring-1 ring-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : v)}
          />
          <Tooltip
            formatter={(value) => formatRupiah(Number(value))}
            contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="Omzet" fill="#34c37a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Laba" fill="#116b42" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
