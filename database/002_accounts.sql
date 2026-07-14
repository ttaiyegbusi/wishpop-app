-- Accounts (Phase 1): a wishlist can belong to an authenticated user in
-- addition to the anonymous per-device owner_key. Nullable, so existing
-- anonymous lists keep working unchanged. On first sign-in the app "claims" a
-- device's anonymous lists by filling user_id (see claim flow).
--
-- Run this once in the Supabase SQL editor.

alter table public.wishlists
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists wishlists_user_id_idx on public.wishlists(user_id);
