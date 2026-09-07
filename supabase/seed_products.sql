-- Data contoh produk untuk development.
-- Jalankan di SQL Editor Supabase, kapan saja (tidak perlu akun tertentu
-- karena data produk sudah dibagi ke semua akun).
--
-- Harga modal SENGAJA dibiarkan NULL — jangan ditebak, isi manual lewat
-- halaman Produk setelah Tahap 2 selesai.

insert into public.products (name, category, cost_price, selling_price, unit)
values
  ('Lontong Kikil Jumbo', 'Makanan', null, 25000, 'porsi'),
  ('Lontong Kikil Biasa', 'Makanan', null, 15000, 'porsi'),
  ('Lontong Kupang',      'Makanan', null, 15000, 'porsi'),
  ('Sop Iga',             'Makanan', null, 20000, 'porsi'),
  ('Lontong',             'Makanan', null,  2000, 'porsi'),
  ('Es Teh Manis',        'Minuman', null,  5000, 'gelas'),
  ('Es Jeruk',            'Minuman', null,  6000, 'gelas'),
  ('Teh Hangat',          'Minuman', null,  3000, 'gelas');
