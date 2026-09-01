-- =====================================================================
-- Expense Tracker — Supabase schema, triggers, and Row Level Security
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)
-- =====================================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  currency    text not null default 'PHP',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 2. expenses
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  amount          numeric(12, 2) not null check (amount >= 0),
  category        text not null,
  description     text,
  date            date not null default current_date,
  payment_method  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_date_idx on public.expenses (date);
create index if not exists expenses_category_idx on public.expenses (category);

alter table public.expenses enable row level security;

drop policy if exists "Users can view own expenses" on public.expenses;
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on public.expenses;
create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on public.expenses;
create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on public.expenses;
create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. income
-- ---------------------------------------------------------------------
create table if not exists public.income (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  source       text not null,
  amount       numeric(12, 2) not null check (amount >= 0),
  description  text,
  date         date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists income_user_id_idx on public.income (user_id);
create index if not exists income_date_idx on public.income (date);

alter table public.income enable row level security;

drop policy if exists "Users can view own income" on public.income;
create policy "Users can view own income"
  on public.income for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own income" on public.income;
create policy "Users can insert own income"
  on public.income for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own income" on public.income;
create policy "Users can update own income"
  on public.income for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own income" on public.income;
create policy "Users can delete own income"
  on public.income for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. categories (user-defined, per type: expense / income)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('expense', 'income')),
  created_at  timestamptz not null default now(),
  unique (user_id, name, type)
);

create index if not exists categories_user_id_idx on public.categories (user_id);

alter table public.categories enable row level security;

drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.expenses;
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.income;
create trigger set_updated_at before update on public.income
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'PHP'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Seed a few sensible default categories helper (optional, run manually
-- per user if you want starter categories; not required for the app to work
-- since users/free-text categories are supported from the UI too)
-- ---------------------------------------------------------------------
-- Example (replace :user_id):
-- insert into public.categories (user_id, name, type) values
--   (:user_id, 'Food', 'expense'),
--   (:user_id, 'Transport', 'expense'),
--   (:user_id, 'Utilities', 'expense'),
--   (:user_id, 'Rent', 'expense'),
--   (:user_id, 'Entertainment', 'expense'),
--   (:user_id, 'Healthcare', 'expense'),
--   (:user_id, 'Shopping', 'expense'),
--   (:user_id, 'Other', 'expense'),
--   (:user_id, 'Salary', 'income'),
--   (:user_id, 'Freelance', 'income'),
--   (:user_id, 'Business', 'income'),
--   (:user_id, 'Gift', 'income'),
--   (:user_id, 'Other', 'income');
