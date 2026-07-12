import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// Image upload as a route handler rather than a server action on purpose:
// pending server actions serialize with router navigations on the client, so
// an in-flight action upload held the post-save navigation (and its "Saving…"
// state) hostage until the whole image finished uploading. A plain fetch to
// this route runs truly in the background.

const BUCKET = 'item-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Remembered per server instance so we don't pay a createBucket round-trip on
// every upload; the call is an idempotent no-op once the bucket exists anyway.
let bucketEnsured = false;

export async function POST(req: Request) {
  const db = createAdminSupabaseClient();
  if (!db) {
    return NextResponse.json({ ok: false, error: 'Backend not configured' }, { status: 503 });
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json({ ok: false, error: 'Unsupported image type' }, { status: 415 });
  }

  const buffer = Buffer.from(await req.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image missing or too large' }, { status: 413 });
  }

  if (!bucketEnsured) {
    await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});
    bucketEnsured = true;
  }

  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const path = `${randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
  });
}
