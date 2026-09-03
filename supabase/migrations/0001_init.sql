-- Warung.io — Tahap 1: skema database + RLS
-- Jalankan file ini di Supabase SQL Editor (project baru), sekali saja.
--
-- MODEL DATA: Warung.io ini untuk SATU warung. Semua akun yang login
-- (owner maupun karyawan) melihat dan mengubah DATA YANG SAMA — bukan
-- data terpisah per akun. Pendaftaran akun dibuka bebas sesuai keputusan
-- pemilik, jadi siapa pun yang berhasil membuat akun otomatis punya akses
-- penuh ke seluruh data penjualan warung ini.

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. PROFILES  — identitas tiap akun (1:1 dengan auth.users)
--    Dipakai untuk keperluan tampilan ("dicatat oleh: Budi"), BUKAN untuk
--    membatasi akses data — semua akun authenticated akses data yang sama.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Semua akun yang login boleh melihat nama akun lain (untuk atribusi),
-- tapi hanya boleh mengubah datanya sendiri.
create policy "profiles: authenticated can view all"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: user can update own row"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- 2. STORE_SETTINGS — satu baris tunggal untuk seluruh warung
--    (nama warung, nama pemilik, HP, mata uang). Dibagi ke semua akun.
-- =========================================================
create table if not exists public.store_settings (
  id boolean primary key default true check (id),  -- trik "singleton row": hanya boleh 1 baris
  store_name text not null default 'Warung Saya',
  owner_name text,
  phone text,
  currency text not null default 'IDR',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (true)
  on conflict (id) do nothing;

alter table public.store_settings enable row level security;

create policy "store_settings: authenticated can view"
  on public.store_settings for select
  to authenticated
  using (true);

create policy "store_settings: authenticated can update"
  on public.store_settings for update
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 3. PRODUCTS  (data warung, dibagi ke semua akun)
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  cost_price numeric(12,2),           -- null sampai user isi sendiri, jangan ditebak
  selling_price numeric(12,2) not null check (selling_price >= 0),
  unit text not null default 'porsi',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products: authenticated full access"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 4. TRANSACTIONS  (data warung, dibagi ke semua akun)
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  transaction_date date not null default current_date,
  customer_name text not null default 'Umum',
  total_amount numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  total_profit numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions(transaction_date);

alter table public.transactions enable row level security;

create policy "transactions: authenticated full access"
  on public.transactions for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 5. TRANSACTION_ITEMS
--    Snapshot nama & harga produk saat transaksi terjadi, supaya
--    perubahan harga produk di masa depan tidak mengubah riwayat lama.
-- =========================================================
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  cost_price_snapshot numeric(12,2) not null default 0,
  selling_price_snapshot numeric(12,2) not null,
  quantity numeric(12,2) not null check (quantity > 0),
  subtotal numeric(12,2) not null,
  total_cost numeric(12,2) not null,
  profit numeric(12,2) not null
);

create index if not exists transaction_items_transaction_id_idx
  on public.transaction_items(transaction_id);

alter table public.transaction_items enable row level security;

create policy "transaction_items: authenticated full access"
  on public.transaction_items for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 6. EXPENSES  (data warung, dibagi ke semua akun)
-- =========================================================
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  expense_date date not null default current_date,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses(expense_date);

alter table public.expenses enable row level security;

create policy "expenses: authenticated full access"
  on public.expenses for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- 7. updated_at auto-touch trigger (dipakai beberapa tabel)
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute procedure public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute procedure public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute procedure public.set_updated_at();
