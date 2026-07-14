-- WishPop MVP schema (anonymous, no login).
-- Run this in the Supabase SQL editor for a fresh project.
--
-- Ownership is a per-device secret (owner_key) held in the browser; the public
-- share link is just the wishlist id. All access goes through server actions
-- using the service-role key.
--
-- IMPORTANT: enable RLS on both tables with NO policies, so the public anon key
-- (shipped in the browser bundle) is default-denied and cannot read, insert, or
-- modify any row directly — only the service-role server actions can. This is
-- already the case in the live project; the statements below make a fresh
-- project match it. Do not add anon/authenticated policies without a review.

create table if not exists public.wishlists (
  id            text primary key,               -- client-generated id, also the share token
  owner_key     text not null,                  -- per-device secret: proves ownership (anonymous)
  user_id       uuid references auth.users(id) on delete cascade, -- set once claimed by an account
  title         text not null default '',
  color         text,
  created_at_ms bigint not null,                -- mirrors the client createdAt (epoch ms)
  created_at    timestamptz not null default now()
);
create index if not exists wishlists_owner_key_idx on public.wishlists(owner_key);
create index if not exists wishlists_user_id_idx on public.wishlists(user_id);

create table if not exists public.items (
  id             text primary key,              -- client-generated id
  wishlist_id    text not null references public.wishlists(id) on delete cascade,
  name           text not null default '',
  image_url      text,                          -- MVP: data URL inline (move to Storage later)
  price_amount   text,
  price_currency text,
  link_url       text,
  notes          text,
  sort_order     integer not null default 0,
  reserver_email text,                          -- reservation is inline, 1:1 with the item
  reserved_at_ms bigint,
  created_at     timestamptz not null default now()
);
create index if not exists items_wishlist_id_idx on public.items(wishlist_id);

-- Default-deny the public anon key: RLS on, no policies. Only the service-role
-- server actions (which bypass RLS) can touch these tables.
alter table public.wishlists enable row level security;
alter table public.items enable row level security;
