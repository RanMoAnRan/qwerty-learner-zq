create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  price_cny int not null,
  duration_days int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null references public.plans(id),
  status text not null,
  source text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  user_id uuid not null,
  plan_id uuid not null references public.plans(id),
  channel text not null,
  amount int not null,
  status text not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null,
  provider_txn_id text not null,
  raw_payload jsonb not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, provider_txn_id)
);

create table if not exists public.user_daily_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  target_count int not null,
  done_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.share_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  owner_user_id uuid not null,
  resource_type text not null,
  resource_id text not null,
  expires_at timestamptz,
  max_redeem int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.share_redeems (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.share_tokens(id),
  redeemer_user_id uuid not null,
  redeemed_at timestamptz not null default now(),
  unique (token_id, redeemer_user_id)
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_share_tokens_owner_user_id on public.share_tokens(owner_user_id);
