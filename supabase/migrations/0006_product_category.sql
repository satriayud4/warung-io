-- Warung.io — Penyempurnaan: kategori produk (Makanan/Minuman/dst).
-- Dipakai untuk mengelompokkan tampilan di halaman Produk & Kasir, supaya
-- tetap gampang dicari begitu jumlah menunya bertambah (mis. mulai jualan
-- minuman selain makanan).

alter table public.products
  add column if not exists category text not null default 'Makanan';

alter table public.products
  drop constraint if exists products_category_check;

alter table public.products
  add constraint products_category_check
  check (category in ('Makanan', 'Minuman', 'Snack', 'Lainnya'));
