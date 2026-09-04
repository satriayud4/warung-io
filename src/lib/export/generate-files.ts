"use client";

import type { ReportData } from "./report-data";
import { downloadXls, type XlsSheet } from "./xls";
import { downloadCsv } from "./csv";

function rupiah(n: number) {
  return Math.round(n);
}

function summaryRows(d: ReportData): (string | number)[][] {
  return [
    ["Warung.io — Laporan Penjualan"],
    ["Warung", d.storeName],
    ["Periode", d.periodLabel],
    [],
    ["Ringkasan Penjualan"],
    ["Omzet", rupiah(d.summary.omzet)],
    ["Modal", rupiah(d.summary.modal)],
    ["Laba Kotor", rupiah(d.summary.labaKotor)],
    ["Pengeluaran", rupiah(d.summary.pengeluaran)],
    ["Laba Bersih", rupiah(d.summary.labaBersih)],
    [],
    ["Pembayaran"],
    ["Tunai", rupiah(d.payment.tunai)],
    ["Non-tunai", rupiah(d.payment.nontunai)],
  ];
}

function productRows(d: ReportData): (string | number)[][] {
  return [
    ["Menu", "Terjual", "Omzet", "Laba"],
    ...d.byProduct.map((p) => [p.product_name, Number(p.quantity), rupiah(p.omzet), rupiah(p.laba)]),
  ];
}

function dateRows(d: ReportData): (string | number)[][] {
  return [
    ["Tanggal", "Omzet", "Laba"],
    ...d.byDate.map((r) => [r.sale_date, rupiah(r.omzet), rupiah(r.laba)]),
  ];
}

function categoryRows(d: ReportData): (string | number)[][] {
  return [
    ["Kategori", "Total"],
    ...d.byCategory.map((c) => [c.category, rupiah(c.total)]),
  ];
}

function detailRows(d: ReportData): (string | number)[][] {
  return [
    ["Tanggal", "Hari", "Jam", "Nama Pembeli", "Produk", "Jumlah", "Harga", "Total Transaksi", "Metode Pembayaran"],
    ...d.detailedRows.map((r) => [
      r.date,
      r.day,
      r.time,
      r.customer,
      r.product,
      r.quantity,
      rupiah(r.price),
      rupiah(r.transactionTotal),
      r.paymentMethod,
    ]),
  ];
}

function slugifyPeriod(from: string, to: string) {
  return from === to ? from : `${from}_${to}`;
}

export async function exportReportExcel(data: ReportData) {
  const sheets: XlsSheet[] = [
    { name: "Ringkasan", rows: summaryRows(data) },
    { name: "Rincian Transaksi", rows: detailRows(data) },
    { name: "Per Menu", rows: productRows(data) },
    { name: "Per Tanggal", rows: dateRows(data) },
    { name: "Pengeluaran", rows: categoryRows(data) },
  ];

  downloadXls(sheets, `warung-io-laporan-${slugifyPeriod(data.from, data.to)}.xls`);
}

export async function exportReportCsv(data: ReportData) {
  const combined: (string | number)[][] = [
    ...summaryRows(data),
    [],
    [],
    ["Rincian Transaksi"],
    ...detailRows(data),
    [],
    [],
    ["Penjualan per Menu"],
    ...productRows(data),
    [],
    [],
    ["Penjualan per Tanggal"],
    ...dateRows(data),
    [],
    [],
    ["Pengeluaran per Kategori"],
    ...categoryRows(data),
  ];

  downloadCsv(combined, `warung-io-laporan-${slugifyPeriod(data.from, data.to)}.csv`);
}
