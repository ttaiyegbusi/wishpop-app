-- WishPop MVP schema (anonymous, no login).
-- Run this in the Supabase SQL editor for a fresh project.
--
-- Ownership is a per-device secret (owner_key) held in the browser; the public
-- share link is just the wishlist id. All access goes through server actions
-- using the service-role key, so RLS stays off for the MVP.

create table if not exists public.wishlists (
  id            text primary key,               -- client-generated id, also the share token
  owner_key     text not null,                  -- per-device secret: proves ownership
  title         text not null default '',
  color         text,
  created_at_ms bigint not null,                -- mirrors the client createdAt (epoch ms)
  created_at    timestamptz not null default now()
);
create index if not exists wishlists_owner_key_idx on public.wishlists(owner_key);

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
