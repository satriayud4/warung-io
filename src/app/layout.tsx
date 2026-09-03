import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warung.io — Catat jualan, tahu untung.",
  description: "Aplikasi kasir dan pembukuan sederhana untuk warung kecil dan UMKM.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
