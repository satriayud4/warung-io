# Warung.io — Tahap 1–4

Aplikasi kasir & pembukuan sederhana untuk **satu warung**. Semua akun yang
login (owner maupun karyawan) melihat dan mengubah **data yang sama** —
bukan data terpisah per akun.

**Sudah selesai:**
- **Tahap 1** — setup project, layout & navigasi, autentikasi Supabase,
  skema database, Row Level Security.
- **Tahap 2** — halaman **Produk** (tambah/edit/hapus, hitung laba/unit
  otomatis), halaman **Kasir** (pilih menu → keranjang → simpan transaksi),
  halaman **Transaksi** (daftar, detail, edit, hapus dengan konfirmasi).
- **Tahap 3** — halaman **Pengeluaran** (CRUD + kategori), **Dashboard**
  lengkap (filter Hari ini/Kemarin/7 hari/Bulan ini/Custom, menu terlaris,
  transaksi terbaru), **Laporan** (ringkasan per periode, breakdown per
  menu, grafik omzet/laba per tanggal, breakdown pengeluaran per kategori).
- **Tahap 4** — metode pembayaran **Tunai / Non-tunai** di Kasir (tersimpan
  di setiap transaksi, muncul di Transaksi & Laporan), dan **export
  laporan**:
  - **Export Gambar** — khusus laporan 1 hari ("Hari ini"/"Kemarin"),
    kartu ringkasan siap di-screenshot/kirim ke WhatsApp.
  - **Export Excel & CSV** — untuk periode apa pun (1 hari maupun rentang).
  - **Export per Bulan** — Excel/CSV terpisah, pilih bulan bebas, tidak
    tergantung filter periode yang sedang aktif di layar.
- **Lupa Password** — halaman `/lupa-password` (kirim link reset) dan
  `/reset-password` (buat password baru), link "Lupa password?" di halaman
  login.

Offline support (bisa dipakai saat internet putus) belum dikerjakan.

## Penyempurnaan terbaru

- **Menu Terlaris** (Dashboard) sekarang **all-time** (bukan mengikuti
  filter periode), pakai fungsi database khusus
  `get_top_products_all_time`, dengan ranking bernomor dan jumlah terjual
  memakai pemisah ribuan ("1.250 porsi").
- **Semua tampilan tanggal** kini selalu memakai format hari+tanggal
  lengkap ("Kamis, 3 September 2026"), tidak pernah hanya "Hari ini" atau
  "Kemarin" tanpa tanggal — berlaku di Dashboard, Transaksi, Pengeluaran,
  dan Laporan. Transaksi menampilkan hari, tanggal, dan jam sekaligus
  ("Kamis, 3 September 2026, 14:30"). Tombol filter periode ("Hari
  ini"/"Kemarin"/dst) tetap ada sebagai pintasan navigasi, tapi hasil yang
  ditampilkan selalu tanggal penuh.
- **Laporan** kini punya bagian **Rincian Transaksi** — daftar tiap
  transaksi pada periode terpilih lengkap dengan tanggal, hari, jam, nama
  pembeli, daftar produk & jumlah, total, dan metode pembayaran, tanpa
  perlu klik satu per satu ke halaman detail.
- **Export Excel/CSV** (baik per periode maupun per bulan) sekarang ikut
  membawa rincian ini sebagai sheet/bagian tersendiri — satu baris per
  produk per transaksi (Tanggal, Hari, Jam, Nama Pembeli, Produk, Jumlah,
  Harga, Total Transaksi, Metode Pembayaran), jadi bisa difilter/disortir
  sendiri di Excel, bukan cuma angka ringkasan.
- **Export Gambar** (laporan 1 hari) sekarang juga menampilkan rincian tiap
  transaksi hari itu (jam, pembeli, item & jumlah, total, metode
  pembayaran) — bukan cuma angka ringkasan seperti sebelumnya.
- Tabel "Penjualan Berdasarkan Menu" di Laporan diganti jadi kartu (bukan
  tabel lebar) supaya tidak perlu geser ke samping di HP.
- Tombol +/- jumlah dan hapus item di keranjang Kasir diperbesar area
  tapnya untuk kenyamanan di layar sentuh.

## ⚠️ Wajib untuk fitur Lupa Password

Supaya link reset password bisa mengarah balik ke aplikasi Anda (bukan
error), tambahkan URL aplikasi Anda di Supabase Dashboard → Authentication →
URL Configuration:
- **Site URL**: `http://localhost:3000` (development) atau domain Vercel
  Anda (production).
- **Redirect URLs**: tambahkan `http://localhost:3000/reset-password` dan
  (kalau sudah deploy) `https://domain-anda.vercel.app/reset-password`.

Ingat juga batas email bawaan Supabase (2 email/jam tanpa SMTP sendiri) —
ini berlaku juga untuk email reset password, tidak cuma konfirmasi
pendaftaran.

## ⚠️ Penting soal pendaftaran akun

Sesuai keputusan Anda, halaman `/register` **dibiarkan terbuka** — siapa pun
yang mendapat link registrasi bisa membuat akun sendiri, dan begitu berhasil
daftar, langsung punya akses penuh (lihat, tambah, ubah, hapus) ke **seluruh
data penjualan warung**, bukan cuma lihat. Ini konsekuensi dari "data
dibagi ke semua akun" yang Anda pilih.

Kalau suatu saat Anda ingin membatasi siapa yang bisa daftar, dua opsi paling
mudah:
1. **Matikan self-signup** di Supabase (Authentication → Settings → matikan
   "Allow new users to sign up"), lalu Anda undang karyawan manual lewat
   Supabase Dashboard → Authentication → Users → Invite.
2. Atau minta saya hapus halaman `/register` dari aplikasi dan ganti dengan
   alur undangan.

## 1. Setup Supabase (gratis)

1. Buat akun & project baru di https://supabase.com (pilih region Singapore
   untuk latensi terbaik dari Indonesia).
2. Buka **SQL Editor**, jalankan berurutan (satu per satu, tunggu selesai
   sebelum lanjut ke berikutnya):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_transaction_rpc.sql`
   - `supabase/migrations/0003_reports_rpc.sql`
   - `supabase/migrations/0004_payment_method.sql`
   - `supabase/migrations/0005_all_time_best_sellers.sql`
3. Di **Project Settings → API**, salin `Project URL` dan `anon public key`.
4. (Opsional, untuk auth lebih cepat saat development) di **Authentication →
   Providers → Email**, matikan "Confirm email" supaya bisa langsung login
   setelah daftar tanpa cek inbox.

## 2. Setup project lokal

```bash
npm install
cp .env.local.example .env.local
# isi .env.local dengan URL & anon key dari langkah 1
npm run dev
```

Buka http://localhost:3000 — akan diarahkan ke halaman login.

## 3. Data contoh (opsional)

Jalankan `supabase/seed_products.sql` di SQL Editor Supabase kapan saja —
data produk sudah dibagi ke semua akun, jadi tidak perlu daftar dulu. Ini
akan mengisi 5 produk contoh sesuai spesifikasi (harga modal sengaja
dikosongkan — isi manual nanti di halaman Produk).

> Sudah pernah menjalankan migrasi versi sebelumnya (per-akun)? Jalankan
> `supabase/reset.sql` dulu (ini menghapus semua data), baru jalankan ulang
> keempat file migrasi di atas secara berurutan.

## 4. Deploy ke Vercel (gratis)

1. Push folder ini ke repo GitHub.
2. Import repo di https://vercel.com/new.
3. Tambahkan environment variables `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` di Vercel project settings.
4. Deploy.

## Struktur folder

```
src/
  app/
    login/, register/        halaman auth (publik)
    lupa-password/           minta link reset password
    reset-password/          buat password baru (dibuka dari link email)
    (app)/                   grup route yang wajib login
      dashboard/             ringkasan omzet/modal/laba dgn filter periode
      kasir/                 halaman kasir — pilih menu, keranjang, bayar, simpan
      produk/                daftar produk, tambah, edit, hapus
      transaksi/             daftar, detail, edit, hapus transaksi
      pengeluaran/           CRUD pengeluaran per kategori
      laporan/                ringkasan, grafik, breakdown, export
      pengaturan/            info warung (bersama) + akun saya (pribadi)
  components/
    layout/                  BottomNav, Sidebar, ikon
    kasir/TransactionEditor  keranjang, pembayaran & checkout — dipakai Kasir & edit transaksi
    reports/
      PeriodFilter.tsx        filter periode bersama (Dashboard & Laporan)
      SalesChart.tsx          grafik batang omzet/laba per tanggal
      ExportSection.tsx       export Gambar (1 hari)/Excel/CSV utk periode aktif
      MonthlyExportSection.tsx export Excel/CSV per bulan (bebas dari filter di layar)
      DailyReportCard.tsx     kartu yang di-screenshot untuk export gambar
  lib/
    supabase/                client & server Supabase helper
    format.ts                formatter tanggal/rupiah bersama
    date-range.ts            logika filter periode (hari ini/minggu/bulan/custom)
    expense-categories.ts    daftar kategori pengeluaran
    export/
      report-data.ts          tipe data + hitung ringkasan/kategori/pembayaran
      generate-files.ts       susun data laporan jadi baris export
      xls.ts                  generator .xls multi-sheet (XML, tanpa dependency)
      csv.ts                  generator .csv (tanpa dependency)
      download.ts             helper trigger download di browser
  middleware.ts               proteksi route + refresh sesi
supabase/
  migrations/
    0001_init.sql             skema tabel + RLS
    0002_transaction_rpc.sql  fungsi create_transaction & update_transaction
    0003_reports_rpc.sql      fungsi agregasi untuk Dashboard & Laporan
    0004_payment_method.sql   kolom payment_method + update fungsi transaksi
    0005_all_time_best_sellers.sql  fungsi Menu Terlaris all-time
  seed_products.sql          data contoh produk
  reset.sql                  hapus semua tabel (hanya untuk migrasi ulang)
```

## Kenapa export Excel-nya file .xls, bukan .xlsx?

Cara paling umum bikin file Excel di JavaScript adalah library "xlsx"
(SheetJS). Sayangnya SheetJS sudah berhenti merilis versi yang diperbaiki ke
npm registry publik (rilis terbaru di sana, 0.18.5, membawa kerentanan
**severity tinggi tanpa perbaikan** — perbaikannya hanya tersedia lewat CDN
resmi mereka sendiri). Supaya tidak menambahkan dependency yang berisiko,
export Excel dibuat pakai format **"Excel XML Spreadsheet 2003"** — XML
biasa, nol dependency eksternal, tetap mendukung banyak sheet (Ringkasan,
Per Menu, Per Tanggal, Pengeluaran) dan terbuka normal di Excel, Google
Sheets, maupun LibreOffice.

## Bagaimana harga dijaga tetap benar

Halaman Kasir hanya mengirim `product_id` + jumlah ke server — **tidak
pernah mengirim harga**. Fungsi database `create_transaction` /
`update_transaction` yang mengambil harga jual & harga modal langsung dari
tabel `products` saat itu juga, lalu menghitung subtotal, modal, dan laba.
Ini mencegah harga transaksi dimanipulasi dari browser.

`transaction_items` menyimpan **snapshot** nama & harga produk saat
transaksi dibuat, jadi kalau harga produk berubah minggu depan, laporan
transaksi lama tetap akurat. Produk yang sudah pernah dipakai di transaksi
tidak bisa dihapus (RESTRICT di database) — nonaktifkan saja lewat halaman
Produk supaya tidak muncul lagi di Kasir tapi riwayatnya tetap aman.

## Keamanan yang sudah diterapkan

- RLS aktif di semua tabel. `products`, `transactions`, `transaction_items`,
  `expenses`, `store_settings` bisa diakses oleh **siapa pun akun yang
  login** (`to authenticated`) — sesuai model "satu warung, data dibagi".
  Akun yang belum login (anon) tetap sama sekali tidak bisa akses.
- `profiles` (nama tiap akun) bisa dilihat semua akun login untuk atribusi,
  tapi hanya bisa diubah oleh pemilik akun itu sendiri.
- Tidak ada service role key di frontend — hanya anon key, yang aman untuk
  dipakai di browser karena dibatasi RLS.
- Middleware memblokir akses ke halaman `(app)/*` tanpa sesi login, dan
  layout server-side memvalidasi ulang (defense in depth).
- Password dikelola sepenuhnya oleh Supabase Auth, tidak disimpan sendiri.
- **Batasnya:** karena pendaftaran dibuka bebas, RLS tidak melindungi dari
  orang yang berhasil membuat akun — itu murni soal siapa yang punya link
  daftar. Lihat bagian ⚠️ di atas jika ingin mengubah ini.

## Catatan: dependency Next.js/postcss di luar scope hari ini

`npm audit` akan menunjukkan beberapa kerentanan pada `next` dan `postcss`
yang tidak berkaitan dengan pekerjaan hari ini — itu isu di rilis Next.js
14.2.x sendiri (14.2.35 adalah patch 14.2.x terbaru yang tersedia; beberapa
advisory terbaru butuh Next.js 15.x untuk diperbaiki). Upgrade ke Next 15
adalah perubahan besar (App Router punya beberapa perubahan perilaku) yang
sebaiknya dikerjakan terpisah dengan pengujian menyeluruh, bukan disisipkan
ke fitur export ini. Beri tahu saya kalau Anda mau saya kerjakan itu
sebagai langkah berikutnya.

## Rencana Tahap Berikutnya

- Offline support (IndexedDB + sync saat koneksi kembali).
- Polish UI, empty/loading states menyeluruh.
- (Opsional) Upgrade Next.js ke versi 15 untuk menutup advisory keamanan
  yang tidak lagi di-backport ke 14.2.x.
