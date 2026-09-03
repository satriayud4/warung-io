-- Warung.io — Tahap 4a: metode pembayaran (Tunai / Non-tunai) di transaksi.

alter table public.transactions
  add column if not exists payment_method text not null default 'tunai';

alter table public.transactions
  drop constraint if exists transactions_payment_method_check;

alter table public.transactions
  add constraint transactions_payment_method_check
  check (payment_method in ('tunai', 'nontunai'));

-- =========================================================
-- create_transaction — tambah parameter p_payment_method.
-- Parameter baru diletakkan di akhir dengan default 'tunai', jadi aman
-- untuk kode lama yang belum mengirim parameter ini.
-- =========================================================
create or replace function public.create_transaction(
  p_transaction_date date,
  p_customer_name text,
  p_items jsonb,
  p_payment_method text default 'tunai'
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
  v_payment_method text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  v_payment_method := case when p_payment_method in ('tunai', 'nontunai')
    then p_payment_method else 'tunai' end;

  insert into public.transactions (
    transaction_date, customer_name, total_amount, total_cost, total_profit,
    payment_method, created_by
  )
  values (
    coalesce(p_transaction_date, current_date),
    coalesce(nullif(trim(p_customer_name), ''), 'Umum'),
    0, 0, 0,
    v_payment_method,
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

grant execute on function public.create_transaction(date, text, jsonb, text) to authenticated;

-- =========================================================
-- update_transaction — tambah parameter p_payment_method.
-- =========================================================
create or replace function public.update_transaction(
  p_transaction_id uuid,
  p_transaction_date date,
  p_customer_name text,
  p_items jsonb,
  p_payment_method text default 'tunai'
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
  v_payment_method text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;

  if not exists (select 1 from public.transactions where id = p_transaction_id) then
    raise exception 'Transaksi tidak ditemukan';
  end if;

  v_payment_method := case when p_payment_method in ('tunai', 'nontunai')
    then p_payment_method else 'tunai' end;

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
      total_profit = v_total_profit,
      payment_method = v_payment_method
  where id = p_transaction_id;

  return p_transaction_id;
end;
$$;

grant execute on function public.update_transaction(uuid, date, text, jsonb, text) to authenticated;
