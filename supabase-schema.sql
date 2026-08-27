-- ============================================================
-- RINJANI AWESOME CRM
-- DATABASE INITIAL SCHEMA
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- PACKAGES
-- ============================================================

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_per_pax numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text,
  nationality text,
  whatsapp text not null,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TRIPS
-- ============================================================

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  package_id uuid
    references public.packages(id)
    on delete set null,

  package_name text not null,

  booking_date date,
  start_date date not null,
  end_date date not null,

  pax integer not null default 1
    check (pax > 0),

  price_per_pax numeric(14,2) not null default 0
    check (price_per_pax >= 0),

  total_price numeric(14,2)
    generated always as (pax * price_per_pax) stored,

  guide_name text,

  status text not null default 'Booked'
    check (status in ('Booked', 'Ongoing', 'Completed', 'Cancelled')),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (end_date >= start_date)
);

-- ============================================================
-- PAYMENTS
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  trip_id uuid not null
    references public.trips(id)
    on delete cascade,

  amount numeric(14,2) not null default 0
    check (amount >= 0),

  payment_status text not null default 'Belum Bayar'
    check (
      payment_status in (
        'Belum Bayar',
        'DP',
        'Lunas',
        'Refund'
      )
    ),

  payment_method text,
  payment_date date,
  notes text,

  created_at timestamptz not null default now()
);

-- ============================================================
-- FOLLOW UPS
-- ============================================================

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references public.customers(id)
    on delete cascade,

  trip_id uuid
    references public.trips(id)
    on delete set null,

  follow_up_date date not null,

  subject text,
  notes text,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Contacted',
        'Completed',
        'Cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_customers_name
  on public.customers(name);

create index if not exists idx_customers_country
  on public.customers(country);

create index if not exists idx_customers_whatsapp
  on public.customers(whatsapp);

create index if not exists idx_trips_customer
  on public.trips(customer_id);

create index if not exists idx_trips_status
  on public.trips(status);

create index if not exists idx_trips_start_date
  on public.trips(start_date);

create index if not exists idx_payments_trip
  on public.payments(trip_id);

create index if not exists idx_follow_ups_customer
  on public.follow_ups(customer_id);

create index if not exists idx_follow_ups_date
  on public.follow_ups(follow_up_date);

-- ============================================================
-- RLS
-- ============================================================

alter table public.packages enable row level security;
alter table public.customers enable row level security;
alter table public.trips enable row level security;
alter table public.payments enable row level security;
alter table public.follow_ups enable row level security;

-- ============================================================
-- DEVELOPMENT POLICIES
-- ============================================================
-- Untuk tahap pembangunan awal CRM.
-- Nanti setelah Login Admin dibuat, policy ini akan kita
-- perketat agar hanya user/admin yang login yang bisa mengakses.

drop policy if exists "dev_packages_all" on public.packages;
create policy "dev_packages_all"
on public.packages
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_customers_all" on public.customers;
create policy "dev_customers_all"
on public.customers
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_trips_all" on public.trips;
create policy "dev_trips_all"
on public.trips
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_payments_all" on public.payments;
create policy "dev_payments_all"
on public.payments
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_follow_ups_all" on public.follow_ups;
create policy "dev_follow_ups_all"
on public.follow_ups
for all
to anon, authenticated
using (true)
with check (true);

-- ============================================================
-- DEFAULT PACKAGES
-- ============================================================

insert into public.packages
  (name, description, price_per_pax)
values
  ('VIP Package', 'Paket VIP Rinjani Awesome', 3000000),
  ('Premium Rinjani', 'Paket Premium Rinjani Awesome', 3750000),
  ('Private Package', 'Paket Private Rinjani Awesome', 2250000)
on conflict do nothing;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at
before update on public.trips
for each row
execute function public.set_updated_at();

drop trigger if exists follow_ups_updated_at on public.follow_ups;
create trigger follow_ups_updated_at
before update on public.follow_ups
for each row
execute function public.set_updated_at();
