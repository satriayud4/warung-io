-- Warung.io — Tahap 3: fungsi database untuk agregasi laporan.
-- Dipakai oleh Dashboard (menu terlaris) dan Laporan (breakdown per menu,
-- grafik per tanggal). Grouping dilakukan di database, bukan di browser,
-- supaya tetap cepat walau jumlah transaksi sudah banyak.

create or replace function public.get_sales_by_product(p_from date, p_to date)
returns table(product_name text, quantity numeric, omzet numeric, laba numeric)
language sql
security invoker
stable
as $$
  select
    ti.product_name_snapshot as product_name,
    sum(ti.quantity) as quantity,
    sum(ti.subtotal) as omzet,
    sum(ti.profit) as laba
  from public.transaction_items ti
  join public.transactions t on t.id = ti.transaction_id
  where t.transaction_date between p_from and p_to
  group by ti.product_name_snapshot
  order by quantity desc;
$$;

grant execute on function public.get_sales_by_product(date, date) to authenticated;

create or replace function public.get_sales_by_date(p_from date, p_to date)
returns table(sale_date date, omzet numeric, laba numeric)
language sql
security invoker
stable
as $$
  select
    t.transaction_date as sale_date,
    sum(t.total_amount) as omzet,
    sum(t.total_profit) as laba
  from public.transactions t
  where t.transaction_date between p_from and p_to
  group by t.transaction_date
  order by t.transaction_date asc;
$$;

grant execute on function public.get_sales_by_date(date, date) to authenticated;
