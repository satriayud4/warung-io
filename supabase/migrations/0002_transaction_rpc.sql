-- Warung.io — Tahap 2: fungsi database untuk transaksi.
--
-- Jika Anda sudah menjalankan migrations/0001_init.sql sebelumnya, baris di
-- bawah ini memperbaiki constraint transaction_items.product_id supaya
-- produk yang sudah pernah dipakai di transaksi TIDAK BISA dihapus (hanya
-- bisa dinonaktifkan) — sinkron dengan pesan error di halaman Produk.
alter table public.transaction_items drop constraint if exists transaction_items_product_id_fkey;
alter table public.transaction_items
  add constraint transaction_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete restrict;

--
-- PENTING: harga yang dipakai untuk menghitung transaksi SELALU diambil
-- ulang dari tabel products di server, TIDAK PERNAH dipercaya dari client.
-- Client hanya mengirim product_id + jumlah; fungsi ini yang menentukan
-- harga jual, harga modal, subtotal, dan laba.

-- =========================================================
-- create_transaction — dipakai oleh halaman Kasir untuk transaksi baru.
-- =========================================================
create or replace function public.create_transaction(
  p_transaction_date date,
  p_customer_name text,
  p_items jsonb  -- array of {"product_id": uuid, "quantity": number}
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_transaction_id uuid;
  v_total_amount numeric := 0;
  v_total_cost numeric := 0;
  v_total_profit numeric := 0;
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_subtotal numeric;
  v_item_cost numeric;
  v_item_profit numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  insert into public.transactions (transaction_date, customer_name, total_amount, total_cost, total_profit, created_by)
  values (
    coalesce(p_transaction_date, current_date),
    coalesce(nullif(trim(p_customer_name), ''), 'Umum'),
    0, 0, 0,
    auth.uid()
  )
  returning id into v_transaction_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Jumlah item harus lebih dari 0';
    end if;

    select id, name, cost_price, selling_price into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if not found then
      raise exception 'Produk tidak ditemukan atau sudah dihapus';
    end if;

    v_subtotal := v_product.selling_price * v_qty;
    v_item_cost := coalesce(v_product.cost_price, 0) * v_qty;
    v_item_profit := v_subtotal - v_item_cost;

    insert into public.transaction_items (
      transaction_id, product_id, product_name_snapshot,
      cost_price_snapshot, selling_price_snapshot, quantity,
      subtotal, total_cost, profit
    ) values (
      v_transaction_id, v_product.id, v_product.name,
      coalesce(v_product.cost_price, 0), v_product.selling_price, v_qty,
      v_subtotal, v_item_cost, v_item_profit
    );

    v_total_amount := v_total_amount + v_subtotal;
    v_total_cost := v_total_cost + v_item_cost;
    v_total_profit := v_total_profit + v_item_profit;
  end loop;

  update public.transactions
  set total_amount = v_total_amount,
      total_cost = v_total_cost,
      total_profit = v_total_profit
  where id = v_transaction_id;

  return v_transaction_id;
end;
$$;

grant execute on function public.create_transaction(date, text, jsonb) to authenticated;

-- =========================================================
-- update_transaction — dipakai oleh halaman Transaksi untuk edit.
-- Mengganti seluruh item lama dengan item baru (lebih sederhana &
-- aman daripada diff), lalu hitung ulang total dari harga produk saat ini.
-- =========================================================
create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_transaction_date date,
  p_customer_name text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_total_amount numeric := 0;
  v_total_cost numeric := 0;
  v_total_profit numeric := 0;
  v_item jsonb;
  v_product record;
  v_qty numeric;
  v_subtotal numeric;
  v_item_cost numeric;
  v_item_profit numeric;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  if not exists (select 1 from public.transactions where id = p_transaction_id) then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  delete from public.transaction_items where transaction_id = p_transaction_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Jumlah item harus lebih dari 0';
    end if;

    select id, name, cost_price, selling_price into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;

    if not found then
      raise exception 'Produk tidak ditemukan atau sudah dihapus';
    end if;

    v_subtotal := v_product.selling_price * v_qty;
    v_item_cost := coalesce(v_product.cost_price, 0) * v_qty;
    v_item_profit := v_subtotal - v_item_cost;

    insert into public.transaction_items (
      transaction_id, product_id, product_name_snapshot,
      cost_price_snapshot, selling_price_snapshot, quantity,
      subtotal, total_cost, profit
    ) values (
      p_transaction_id, v_product.id, v_product.name,
      coalesce(v_product.cost_price, 0), v_product.selling_price, v_qty,
      v_subtotal, v_item_cost, v_item_profit
    );

    v_total_amount := v_total_amount + v_subtotal;
    v_total_cost := v_total_cost + v_item_cost;
    v_total_profit := v_total_profit + v_item_profit;
  end loop;

  update public.transactions
  set transaction_date = coalesce(p_transaction_date, transaction_date),
      customer_name = coalesce(nullif(trim(p_customer_name), ''), 'Umum'),
      total_amount = v_total_amount,
      total_cost = v_total_cost,
      total_profit = v_total_profit
  where id = p_transaction_id;

  return p_transaction_id;
end;
$$;

grant execute on function public.update_transaction(uuid, date, text, jsonb) to authenticated;
