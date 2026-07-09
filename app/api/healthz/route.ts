import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Temporary health check for Supabase wiring — remove after verification.
export async function GET() {
  const db = createAdminSupabaseClient();
  if (!db) {
    return NextResponse.json({ configured: false, reason: 'missing service role key or url' });
  }
  const wishlists = await db.from('wishlists').select('id', { count: 'exact', head: true });
  const items = await db.from('items').select('id', { count: 'exact', head: true });
  return NextResponse.json({
    configured: true,
    wishlists: { ok: !wishlists.error, count: wishlists.count, error: wishlists.error?.message },
    items: { ok: !items.error, count: items.count, error: items.error?.message },
  });
}
