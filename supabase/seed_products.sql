-- Data contoh produk untuk development.
-- Jalankan di SQL Editor Supabase, kapan saja (tidak perlu akun tertentu
-- karena data produk sudah dibagi ke semua akun).
--
-- Harga modal SENGAJA dibiarkan NULL — jangan ditebak, isi manual lewat
-- halaman Produk setelah Tahap 2 selesai.

insert into public.products (name, cost_price, selling_price, unit)
values
  ('Lontong Kikil Jumbo', null, 25000, 'porsi'),
  ('Lontong Kikil Biasa', null, 15000, 'porsi'),
  ('Lontong Kupang',      null, 15000, 'porsi'),
  ('Sop Iga',             null, 20000, 'porsi'),
  ('Lontong',             null,  2000, 'porsi');
