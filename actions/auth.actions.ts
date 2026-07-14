'use server';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getSessionUserId } from '@/lib/supabase/server';

/**
 * On sign-in, claim this device's anonymous wishlists into the account: fill
 * user_id for every wishlist still on the device's owner_key that no account
 * owns yet. Idempotent, and a no-op when the caller isn't authenticated.
 * Returns how many lists were claimed.
 */
export async function claimDeviceWishlists(ownerKey: string): Promise<number> {
  const userId = await getSessionUserId();
  if (!userId || !ownerKey) return 0;
  const db = createAdminSupabaseClient();
  if (!db) return 0;

  const { data } = await db
    .from('wishlists')
    .update({ user_id: userId })
    .eq('owner_key', ownerKey)
    .is('user_id', null)
    .select('id');
  return data?.length ?? 0;
}

/**
 * Permanently delete the signed-in account and everything it owns. The user's
 * wishlists (and their items) cascade via the wishlists.user_id foreign key.
 * The caller must sign out afterwards to clear the now-orphaned session.
 * Returns whether the account was deleted.
 */
export async function deleteAccount(): Promise<boolean> {
  const userId = await getSessionUserId();
  if (!userId) return false;
  const db = createAdminSupabaseClient();
  if (!db) return false;
  const { error } = await db.auth.admin.deleteUser(userId);
  return !error;
}
