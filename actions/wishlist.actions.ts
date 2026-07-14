'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { DraftWishlist, WishlistItem } from '@/components/product/WishlistStore';
import type { ThemeColorId } from '@/lib/product/colors';

// Row shapes (snake_case) as stored in Supabase.
type ItemRow = {
  id: string;
  wishlist_id: string;
  name: string | null;
  image_url: string | null;
  price_amount: string | null;
  price_currency: string | null;
  link_url: string | null;
  notes: string | null;
  sort_order: number | null;
  reserver_email: string | null;
  reserved_at_ms: number | null;
};
type WishlistRow = {
  id: string;
  owner_key: string;
  user_id: string | null;
  title: string;
  color: string | null;
  created_at_ms: number;
};

function rowToItem(r: ItemRow): WishlistItem {
  return {
    id: r.id,
    title: r.name ?? '',
    imageDataUrl: r.image_url ?? null,
    price: r.price_amount ?? '',
    currency: r.price_currency ?? 'NGN',
    link: r.link_url ?? '',
    notes: r.notes ?? '',
    // Never ship the reserver's email to a client: the public share view (and
    // the owner view) only need to know an item IS reserved, not by whom, and
    // leaking it would expose every gift-giver's email to anyone with the link.
    // The email stays in the DB for future server-side use (e.g. notifications).
    reservation: r.reserver_email ? { email: '', createdAt: Number(r.reserved_at_ms) || 0 } : null,
  };
}

function rowToWishlist(w: WishlistRow, items: ItemRow[]): DraftWishlist {
  return {
    id: w.id,
    title: w.title,
    color: (w.color ?? 'red') as ThemeColorId,
    createdAt: Number(w.created_at_ms),
    items: [...items]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(rowToItem),
  };
}

/** Whether the Supabase backend is configured (service-role key present). */
export async function backendConfigured(): Promise<boolean> {
  return createAdminSupabaseClient() !== null;
}

/** All wishlists (with items) owned by this device. Null when not configured. */
export async function fetchOwnerWishlists(ownerKey: string): Promise<DraftWishlist[] | null> {
  return fetchWishlistsBy('owner_key', ownerKey);
}

/** All wishlists (with items) belonging to an account, across devices. */
export async function fetchUserWishlists(userId: string): Promise<DraftWishlist[] | null> {
  return fetchWishlistsBy('user_id', userId);
}

async function fetchWishlistsBy(
  column: 'owner_key' | 'user_id',
  value: string,
): Promise<DraftWishlist[] | null> {
  const db = createAdminSupabaseClient();
  if (!db) return null;
  // One round-trip: the items FK lets us embed them per wishlist, instead of a
  // second query keyed on the returned ids (halves the startup latency).
  const { data: lists } = await db
    .from('wishlists')
    .select('*, items(*)')
    .eq(column, value)
    .order('created_at_ms', { ascending: false });
  if (!lists) return [];
  return (lists as (WishlistRow & { items: ItemRow[] })[]).map((w) =>
    rowToWishlist(w, w.items ?? []),
  );
}

/** Public read of a shared wishlist by its id (the share token). */
export async function fetchPublicWishlist(shareToken: string): Promise<DraftWishlist | null> {
  const db = createAdminSupabaseClient();
  if (!db) return null;
  const { data: w } = await db.from('wishlists').select('*').eq('id', shareToken).maybeSingle();
  if (!w) return null;
  const { data: items } = await db.from('items').select('*').eq('wishlist_id', shareToken);
  return rowToWishlist(w as WishlistRow, (items ?? []) as ItemRow[]);
}

/**
 * Mirror a wishlist to the cloud. Upserts the wishlist and its items (owner
 * fields only — reservation fields are left untouched) and removes items the
 * owner has deleted. `userId` is the signed-in account (from the session) or
 * null for anonymous. No-ops when the backend isn't configured.
 */
export async function pushWishlist(
  ownerKey: string,
  wishlist: DraftWishlist,
  userId: string | null = null,
): Promise<void> {
  const db = createAdminSupabaseClient();
  if (!db) return;

  // Guard: don't let anyone overwrite a wishlist they don't own. An account
  // owns rows by user_id; an anonymous device owns rows by owner_key.
  const { data: existing } = await db
    .from('wishlists')
    .select('owner_key, user_id')
    .eq('id', wishlist.id)
    .maybeSingle();
  if (existing) {
    if (existing.user_id) {
      if (existing.user_id !== userId) return; // owned by an account, not this caller
    } else if (existing.owner_key !== ownerKey) {
      return; // anonymous list from a different device
    }
  }

  await db.from('wishlists').upsert({
    id: wishlist.id,
    owner_key: ownerKey,
    // Keep an existing account owner; otherwise stamp the caller's account (if
    // signed in). Anonymous pushes leave it null.
    user_id: existing?.user_id ?? userId,
    title: wishlist.title,
    color: wishlist.color,
    created_at_ms: wishlist.createdAt,
  });

  if (wishlist.items.length) {
    await db.from('items').upsert(
      wishlist.items.map((it, i) => ({
        id: it.id,
        wishlist_id: wishlist.id,
        name: it.title,
        image_url: it.imageDataUrl,
        price_amount: it.price,
        price_currency: it.currency,
        link_url: it.link,
        notes: it.notes,
        sort_order: i,
      })),
    );
  }

  const keepIds = wishlist.items.map((it) => it.id);
  let del = db.from('items').delete().eq('wishlist_id', wishlist.id);
  if (keepIds.length) del = del.not('id', 'in', `(${keepIds.join(',')})`);
  await del;
}

/** Delete a wishlist from the cloud (owner only — by account if signed in, else device). */
export async function deleteWishlistCloud(
  ownerKey: string,
  id: string,
  userId: string | null = null,
): Promise<void> {
  const db = createAdminSupabaseClient();
  if (!db) return;
  const q = db.from('wishlists').delete().eq('id', id);
  await (userId ? q.eq('user_id', userId) : q.eq('owner_key', ownerKey));
}
