-- HANYA jalankan ini jika Anda SUDAH pernah menjalankan migrasi versi lama
-- (versi per-akun/multi-tenant) dan ingin beralih ke versi baru (satu
-- warung, data dibagi ke semua akun). Ini MENGHAPUS SEMUA DATA yang ada.
--
-- Setelah menjalankan file ini, jalankan ulang migrations/0001_init.sql.

drop table if exists public.transaction_items cascade;
drop table if exists public.transactions cascade;
drop table if exists public.expenses cascade;
drop table if exists public.products cascade;
drop table if exists public.store_settings cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user cascade;
drop function if exists public.set_updated_at cascade;
