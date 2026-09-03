"use client";

import { triggerDownload } from "./download";

export type XlsSheet = { name: string; rows: (string | number)[][] };

// Generates a real multi-sheet workbook using the "Excel XML Spreadsheet
// 2003" format — plain XML, zero dependencies, opens natively in Excel,
// Google Sheets, and LibreOffice. We deliberately avoid the "xlsx" npm
// package here: SheetJS stopped publishing patched releases to the public
// npm registry (only to their own CDN), so the npm version currently
// carries an unfixed high-severity advisory. This format sidesteps that
// entirely while still producing a genuine multi-sheet spreadsheet.

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cellXml(value: string | number): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
}

function sheetXml(sheet: XlsSheet): string {
  // Nama worksheet dibatasi Excel: maksimal 31 karakter, tanpa : \ / ? * [ ]
  const safeName = xmlEscape(sheet.name.replace(/[:\\/?*[\]]/g, "").slice(0, 31));
  const rowsXml = sheet.rows
    .map((row) => `<Row>${row.map(cellXml).join("")}</Row>`)
    .join("");

  return `<Worksheet ss:Name="${safeName}"><Table>${rowsXml}</Table></Worksheet>`;
}

export function buildXlsDocument(sheets: XlsSheet[]): string {
  const sheetsXml = sheets.map(sheetXml).join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
 </Styles>
 ${sheetsXml}
</Workbook>`;
}

export function downloadXls(sheets: XlsSheet[], filename: string) {
  const xml = buildXlsDocument(sheets);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  triggerDownload(blob, filename);
}
