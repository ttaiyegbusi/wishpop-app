'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Reserve an item on a shared wishlist. Only succeeds if the item exists on
 * that wishlist and isn't already reserved. Returns whether it was reserved.
 */
export async function reserveItem(
  shareToken: string,
  itemId: string,
  email: string,
): Promise<boolean> {
  const db = createAdminSupabaseClient();
  if (!db) return false;
  const { data } = await db
    .from('items')
    .update({ reserver_email: email.trim(), reserved_at_ms: Date.now() })
    .eq('id', itemId)
    .eq('wishlist_id', shareToken)
    .is('reserver_email', null)
    .select('id');
  return !!data && data.length > 0;
}

/** Release a reservation (used by the viewer's Undo). */
export async function unreserveItem(shareToken: string, itemId: string): Promise<void> {
  const db = createAdminSupabaseClient();
  if (!db) return;
  await db
    .from('items')
    .update({ reserver_email: null, reserved_at_ms: null })
    .eq('id', itemId)
    .eq('wishlist_id', shareToken);
}
