create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text default 'landing_page',
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) <= 100),
  description text check (description is null or char_length(description) <= 500),
  occasion_date date,
  share_token text not null unique,
  notifications_muted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  name text not null,
  link_url text not null,
  price_amount numeric(12, 2),
  price_currency text,
  notes text,
  image_url text,
  priority boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default true,
  reserver_email text,
  created_at timestamptz not null default now()
);

create index if not exists wishlists_owner_id_idx on public.wishlists(owner_id);
create index if not exists wishlists_share_token_idx on public.wishlists(share_token);
create index if not exists items_wishlist_id_idx on public.items(wishlist_id);
create index if not exists reservations_item_id_idx on public.reservations(item_id);

alter table public.waitlist enable row level security;
alter table public.users enable row level security;
alter table public.wishlists enable row level security;
alter table public.items enable row level security;
alter table public.reservations enable row level security;

-- Waitlist is written through the server-side service role route only.
-- Add RLS policies when Supabase Auth is wired in.
