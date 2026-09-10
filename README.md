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

## Perbaikan performa (navigasi terasa lambat)

Kalau sebelumnya pindah halaman terasa lambat, penyebab utamanya: setiap
navigasi memanggil `supabase.auth.getUser()` **sampai 3 kali berturut-turut**
(middleware → layout → halaman itu sendiri) — dan `getUser()` selalu
melakukan round-trip jaringan ke server Auth Supabase untuk validasi ulang,
beda dengan `getSession()` yang cukup baca cookie lokal tanpa jaringan.
Sekarang hanya middleware yang memakai `getUser()` (satu-satunya tempat yang
memang perlu validasi jaringan sebagai gerbang keamanan); layout dan semua
halaman lain memakai `getSession()` untuk mengambil `user.id` — RLS di
database tetap jadi lapisan keamanan sebenarnya, jadi tidak ada yang
dikorbankan dari sisi keamanan.

Selain itu, halaman **Laporan** kini memuat grafik (`recharts`) secara lazy
lewat `next/dynamic` — first-load JS halaman ini turun dari ~267kB jadi
~160kB, grafik muncul sekejap belakangan dengan status "Memuat grafik..."
alih-alih ikut memblokir render bagian lain.

Kalau setelah ini masih terasa lambat, kemungkinan besar penyebabnya lokasi
region project Supabase Anda — pastikan dipilih **Singapore** (bukan region
lain) saat membuat project, karena jarak fisik ke server ikut menentukan
latensi setiap query.

Satu lagi yang ditambahkan: file `src/app/(app)/loading.tsx`. Sebelumnya,
begitu menu ditekan, layar terlihat "diam" sesaat sebelum berpindah karena
tidak ada umpan balik visual sama sekali selagi server mengambil data
halaman tujuan. Sekarang Next.js otomatis menampilkan skeleton loading
instan begitu menu ditekan — Sidebar/BottomNav/header tetap langsung
responsif (tidak ikut "loading"), cuma bagian isinya yang menampilkan
skeleton sampai datanya siap. Total waktu ambil data tidak berubah, tapi
transisinya terasa jauh lebih instan karena ada respons visual seketika.

## Polish visual (logo, animasi, empty state)

Perubahan ini murni visual — tidak ada fitur, struktur, atau alur yang
berubah:

- **Logo/brand mark custom** (`src/components/brand/Logo.tsx`) — ikon kios
  sederhana dengan atap terpal bergaris (bukan ikon generik atau cuma
  inisial huruf), dipakai konsisten di halaman login/register/lupa
  password/reset password dan Sidebar desktop lewat komponen
  `AuthHeader` bersama.
- **Satu momen animasi yang sengaja ditonjolkan**: layar "Transaksi
  berhasil disimpan" di Kasir sekarang punya animasi centang yang
  "digambar" (lingkaran lalu centang, berurutan), bukan emoji statis.
  Animasi lain di aplikasi sengaja dibuat minim — meletakkan satu momen
  yang berarti lebih terasa istimewa daripada animasi di mana-mana.
- **Empty state lebih hidup**: halaman Dashboard/Produk/Transaksi/
  Pengeluaran yang belum ada datanya sekarang pakai komponen
  `EmptyState` (ikon dalam lingkaran + judul + deskripsi + tombol aksi),
  memakai kosakata ikon yang sama dengan navigasi supaya terasa satu
  sistem, bukan tempelan ilustrasi baru yang tidak nyambung.
- Skeleton loading (`PageSkeleton`) sekarang punya sapuan shimmer halus,
  bukan cuma pulse polos.
- Semua animasi menghormati pengaturan "Reduce Motion" di perangkat
  (`prefers-reduced-motion`) — otomatis nonaktif kalau pengguna
  mengaktifkan itu di HP/komputernya.

## Perbaikan bug: tanggal "hari ini" salah di sekitar tengah malam WIB

**Penyebab:** aplikasi sebelumnya tidak punya patokan zona waktu tetap —
"hari ini" dihitung berdasarkan jam **komputer/server yang menjalankan
kode**, bukan WIB. Vercel (tempat aplikasi ini di-deploy) menjalankan
server-nya di UTC. Karena WIB = UTC+7, ada jendela 7 jam tiap hari
(kira-kira jam 00:00–06:59 WIB) di mana UTC masih menunjukkan tanggal
**kemarin** — jadi Dashboard/Laporan/tanggal default Kasir & Pengeluaran
sempat menampilkan tanggal yang salah (kurang satu hari) selama jendela
itu, juga jam transaksi bisa salah tampil.

**Perbaikan:** semua tempat yang menghitung "hari ini" atau memformat jam
transaksi sekarang dikunci eksplisit ke zona waktu **Asia/Jakarta (WIB)**
lewat `Intl.DateTimeFormat`/`toLocaleTimeString` dengan opsi `timeZone`,
bukan lagi mengandalkan jam lokal environment tempat kode itu kebetulan
dijalankan. Sudah diuji langsung dengan mensimulasikan server yang jalan
di UTC pada jam 00:15 WIB — hasilnya sekarang benar menunjukkan tanggal
hari yang sama dengan WIB, bukan mundur sehari.

> Catatan: zona waktu dikunci ke WIB (`Asia/Jakarta`) karena itu yang
> dipakai saat ini. Kalau warung Anda ada di zona WITA/WIT, tinggal ganti
> nilai `APP_TIMEZONE` di `src/lib/format.ts` (misal ke `Asia/Makassar`
> atau `Asia/Jayapura`) — satu tempat itu saja yang perlu diubah.

## Loading saat klik filter periode (Dashboard & Laporan)

`loading.tsx` yang sudah ada sebelumnya cuma muncul saat **pindah
halaman** — klik filter periode ("Hari ini"/"Bulan ini"/dst) tidak
memicu itu karena cuma mengubah query string di URL yang sama, bukan
pindah rute. Sekarang `PeriodFilter` pakai `useTransition` dari React
supaya bisa kasih umpan baliknya sendiri:
- Bar loading tipis muncul di paling atas layar (menghormati
  safe-area-inset-top supaya tidak ketutup notch/status bar HP)
- Tombol/chip yang baru ditekan menampilkan spinner kecil, tombol lain
  meredup sementara (mencegah tap ganda selagi data masih diambil)
- Di mobile, ikon panah di dropdown berubah jadi spinner selagi memuat

**Perbaikan lanjutan (v1):** dropdown native di HP nilainya (`value`)
sempat murni mengikuti prop `activePeriod` dari server, yang baru
ter-update SETELAH data baru selesai dimuat. Akibatnya begitu Anda memilih
opsi baru, dropdown sempat kembali menampilkan pilihan LAMA selama proses
loading (terasa seperti pilihannya tidak kesimpan/nge-glitch). Sekarang
dropdown menampilkan pilihan yang baru saja Anda tap secara optimistis
(state lokal), baru disinkronkan ke data server setelah selesai. Field
select juga tidak lagi di-disable saat loading (sebelumnya bikin
tampilannya terasa "macet" tepat setelah disentuh) — cukup ikon spinner
saja sebagai penanda.

**Perbaikan lanjutan (v2):** spinner di dropdown sempat dibongkar-pasang
tiap render (ganti-ganti antara ikon panah dan ikon spinner lewat
conditional render) — di sebagian browser mobile, animasi CSS yang
elemennya di-mount ulang akan restart dari awal tiap kali, yang bisa
kelihatan seperti macet/patah-patah alih-alih muter mulus. Sekarang
spinner-nya diganti jadi elemen CSS murni (border + rotate, bukan SVG
berlapis) yang **selalu ter-mount di DOM** — cuma opacity-nya yang
ditoggle, jadi animasinya tidak pernah restart dan selalu terlihat mulus
begitu muncul.

**Perbaikan lanjutan (v3):** di PC/koneksi cepat, transisinya kadang
selesai dalam puluhan milidetik — spinner-nya kedip sekilas lalu hilang
sebelum sempat kelihatan jelas (beda dengan HP/koneksi lebih lambat yang
jendela loading-nya cukup lama untuk terlihat, makanya sempat terasa
"cuma hilang pas di PC, di HP aman"). Sekarang indikator loading dijamin
tampil **minimal ~400ms** sekali muncul, jadi konsisten kelihatan di
perangkat apa pun secepat apa pun data sebenarnya selesai diambil.

## Perbaikan bug: badge jumlah di Kasir tidak hilang saat item dihapus

Ditemukan lewat pengujian otomatis (bukan tebak-tebakan): dua elemen
bersaudara di kartu produk Kasir sempat memakai `key` React yang sama
persis (`key={qty}` di badge dan di pembungkus animasi), yang membuat
React salah mencocokkan elemen saat re-render — badge jumlah bisa
"nyangkut" menampilkan angka lama walau item itu sudah dihapus dari
keranjang. Sudah diperbaiki dengan memberi key yang unik untuk masing-
masing elemen.

## Umpan balik "satisfying" saat tap produk di Kasir

- Tiap kali produk di-tap, kartunya memantul singkat (bukan cuma
  press-down biasa) dan muncul **badge angka** di pojok kanan atas
  menunjukkan berapa kali item itu sudah masuk keranjang.
- Warna kartu **berjenjang mengikuti jumlah** — makin sering di-tap, makin
  pekat warnanya (putih → hijau muda → hijau sedang → hijau tua). Sengaja
  dikaitkan ke jumlah (bukan warna acak) supaya tetap menyampaikan info
  berguna ("oh ini sudah 3x ditekan") sambil tetap terasa hidup — warna
  acak murni berisiko membingungkan saat sedang buru-buru melayani
  pembeli.
- Badge angkanya juga ikut "pop" tiap bertambah, jadi kelihatan jelas
  setiap tap kehitung.

## Ubah Password dari dalam aplikasi

Sebelumnya ganti password cuma bisa lewat alur "Lupa Password" (kirim link
email). Sekarang di halaman **Pengaturan** ada card "Ubah Password" —
cukup masukkan password baru + konfirmasi selagi masih login, tidak perlu
ketik ulang password lama (mengandalkan sesi login yang sudah aktif, sama
seperti kebanyakan aplikasi lain). Kalau memang lupa password dan sedang
tidak login sama sekali, tetap pakai alur "Lupa Password" di halaman login.

## Kategori produk (Makanan/Minuman/Snack/Lainnya)

- Setiap produk sekarang punya kategori — pilihannya: Makanan, Minuman,
  Snack, Lainnya. Produk lama otomatis dapat kategori "Makanan" (lewat
  default kolom di migrasi), tinggal diedit satu-satu kalau perlu diubah.
- Halaman **Produk** mengelompokkan daftarnya per kategori (section
  terpisah per kategori, cuma yang ada isinya yang ditampilkan).
- Halaman **Kasir** menampilkan chip filter kategori di atas grid menu
  (cuma muncul kalau produk aktifnya lebih dari satu kategori) — tinggal
  tap "Minuman" untuk cuma lihat menu minuman, "Semua" untuk balik lihat
  semuanya. Sangat membantu begitu jumlah menunya banyak.

## Filter periode: Tahun, Semua, dan lebih nyaman di mobile

- Filter periode di Dashboard & Laporan sekarang punya 7 pilihan: Hari
  ini, Kemarin, 7 hari, Bulan ini, **Tahun ini**, **Semua** (all-time —
  dari awal warung tercatat sampai hari ini), dan Custom.
- **Di HP**, filter ini sekarang tampil sebagai dropdown native (bukan
  deretan chip yang harus digeser) — sekali tap langsung terbuka picker
  bawaan HP, jauh lebih cepat dipilih dengan satu tangan dibanding
  menggeser-geser 7 pilihan di layar sempit.
- Di tablet/desktop tetap memakai deretan chip seperti sebelumnya, karena
  di layar lebar semua opsi sudah cukup ruang untuk terlihat sekaligus.
- Catatan kecil: untuk periode panjang (Tahun ini/Semua), grafik
  "Penjualan per Tanggal" tetap mengelompokkan per hari (bisa terlihat
  padat kalau rentangnya bertahun-tahun). Kalau ini terasa mengganggu,
  bilang saja — bisa ditambahkan pengelompokan per bulan untuk periode
  panjang.

## Optimasi tampilan mobile

- **Bottom nav diperbaiki** — sebelumnya menampilkan 6 tab dalam grid
  5-kolom (bug peninggalan saat Laporan ditambahkan di Tahap 3), sehingga
  tombol Kasir tidak lagi benar-benar di tengah dan tampilannya berantakan.
  Sekarang bottom nav berisi 5 tab: Dashboard, Produk, **Kasir** (tombol
  bulat di tengah, benar-benar center), Transaksi, dan **Lainnya**
  (menampung Pengeluaran/Laporan/Pengaturan lewat halaman `/lainnya`).
  Sidebar desktop tidak berubah, tetap menampilkan ketujuh menu langsung.
- **Angka terpenting ditonjolkan** — di Dashboard & Laporan, Laba Bersih
  sekarang tampil sebagai kartu besar tersendiri di bagian atas, bukan
  ikut berdesakan 1-dari-5 di grid 2 kolom.
- **Kasir**: keranjang sebelumnya ada di bawah seluruh daftar produk, jadi
  di HP harus scroll melewati semua menu dulu untuk sampai ke total &
  tombol Simpan. Sekarang ada bar ringkas melayang ("N item · Rp total ·
  Lihat Keranjang") begitu ada isi keranjang, tinggal tap untuk lompat ke
  bagian checkout.
- Padding aman untuk HP dengan notch/status bar (safe-area-inset) di header
  atas, melengkapi yang sudah ada di bottom nav.
- Chip filter periode (Hari ini/Kemarin/dst) diperbesar sedikit area tapnya.

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
   - `supabase/migrations/0006_product_category.sql`
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
    layout/                  BottomNav, Sidebar, ikon, PageSkeleton
    brand/                   Logo & AuthHeader (mark kios + tagline)
    ui/EmptyState.tsx        tampilan kosong konsisten (ikon+judul+aksi)
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
    0006_product_category.sql       kolom kategori produk
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
