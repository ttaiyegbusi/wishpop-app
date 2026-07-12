import { NextResponse } from 'next/server';
import {
  backendConfigured,
  deleteWishlistCloud,
  fetchOwnerWishlists,
  pushWishlist,
} from '@/actions/wishlist.actions';
import type { DraftWishlist } from '@/components/product/WishlistStore';

// Cloud-sync endpoints as route handlers rather than server actions on
// purpose: pending server actions serialize with router navigations on the
// client, so a slow push (several Supabase round-trips) fired at save time
// held the post-save navigation — and its "Saving…" state — hostage. Plain
// fetches to these routes run truly in the background. GET also folds the
// "is the backend configured" probe and the initial load into one request.

export async function GET(req: Request) {
  const ownerKey = new URL(req.url).searchParams.get('ownerKey');
  if (!ownerKey) {
    return NextResponse.json({ ok: false, error: 'ownerKey required' }, { status: 400 });
  }
  const configured = await backendConfigured();
  const wishlists = configured ? await fetchOwnerWishlists(ownerKey) : null;
  return NextResponse.json({ ok: true, configured, wishlists });
}

export async function POST(req: Request) {
  let body: { op?: string; ownerKey?: string; wishlist?: DraftWishlist; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const { op, ownerKey } = body;
  if (!ownerKey) {
    return NextResponse.json({ ok: false, error: 'ownerKey required' }, { status: 400 });
  }

  if (op === 'push' && body.wishlist?.id) {
    await pushWishlist(ownerKey, body.wishlist);
    return NextResponse.json({ ok: true });
  }
  if (op === 'delete' && body.id) {
    await deleteWishlistCloud(ownerKey, body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'Unknown op' }, { status: 400 });
}
