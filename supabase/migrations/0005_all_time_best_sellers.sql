-- Warung.io — Penyempurnaan: Menu Terlaris berbasis ALL-TIME (bukan
-- mengikuti filter periode Dashboard), dipakai khusus untuk widget ranking
-- di Dashboard. "Penjualan Berdasarkan Menu" di halaman Laporan TETAP
-- mengikuti filter periode seperti sebelumnya (pakai get_sales_by_product).

create or replace function public.get_top_products_all_time(p_limit integer default 3)
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
  group by ti.product_name_snapshot
  order by quantity desc
  limit p_limit;
$$;

grant execute on function public.get_top_products_all_time(integer) to authenticated;
