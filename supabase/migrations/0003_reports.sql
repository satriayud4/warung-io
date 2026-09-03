-- Warung.io — Tahap 3: fungsi database untuk Dashboard & Laporan.
-- Agregasi (menu terlaris, penjualan per hari) dihitung di database supaya
-- cepat dan tidak perlu menarik semua baris transaction_items ke browser.

-- =========================================================
-- get_top_products — penjualan per menu dalam rentang tanggal.
-- Dipakai oleh Dashboard ("Menu Terlaris", limit kecil) dan Laporan
-- ("Penjualan berdasarkan menu", tanpa limit).
-- =========================================================
create or replace function public.get_top_products(
  p_start date,
  p_end date,
  p_limit int default null
)
returns table (
  product_name text,
  qty numeric,
  omzet numeric,
  laba numeric
)
language sql
security invoker
stable
as $$
  select
    ti.product_name_snapshot as product_name,
    sum(ti.quantity) as qty,
    sum(ti.subtotal) as omzet,
    sum(ti.profit) as laba
  from public.transaction_items ti
  join public.transactions t on t.id = ti.transaction_id
  where t.transaction_date between p_start and p_end
  group by ti.product_name_snapshot
  order by qty desc
  limit p_limit;
$$;

grant execute on function public.get_top_products(date, date, int) to authenticated;

-- =========================================================
-- get_daily_sales — omzet/modal/laba per hari dalam rentang tanggal.
-- Dipakai oleh grafik di halaman Laporan.
-- =========================================================
create or replace function public.get_daily_sales(
  p_start date,
  p_end date
)
returns table (
  sale_date date,
  omzet numeric,
  modal numeric,
  laba numeric
)
language sql
security invoker
stable
as $$
  select
    transaction_date as sale_date,
    sum(total_amount) as omzet,
    sum(total_cost) as modal,
    sum(total_profit) as laba
  from public.transactions
  where transaction_date between p_start and p_end
  group by transaction_date
  order by transaction_date;
$$;

grant execute on function public.get_daily_sales(date, date) to authenticated;
