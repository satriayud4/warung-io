// Mark kecil Warung.io — kios sederhana dengan atap terpal bergaris,
// merujuk langsung ke warung fisik (bukan ikon generik "toko" atau
// singkatan huruf). Dipakai di halaman auth & sidebar supaya brand terasa
// dirancang, bukan cuma teks polos.
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="11" fill="#1ea862" />
      {/* Atap terpal bergaris */}
      <path d="M9 17.5 20 12l11 5.5v2.2H9v-2.2Z" fill="#eefdf3" />
      <path d="M9 19.5h4.4v2.2H9v-2.2Zm8.8 0h4.4v2.2h-4.4v-2.2Zm8.8 0H31v2.2h-4.4v-2.2Z" fill="#116b42" />
      {/* Badan kios */}
      <rect x="11" y="21.5" width="18" height="8.5" rx="1.2" fill="#eefdf3" />
      {/* Pintu/etalase */}
      <rect x="17.3" y="24.3" width="5.4" height="5.7" rx="0.8" fill="#1ea862" />
    </svg>
  );
}
