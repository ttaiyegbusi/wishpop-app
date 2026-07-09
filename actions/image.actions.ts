'use server';

import { randomUUID } from 'node:crypto';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const BUCKET = 'item-images';

/**
 * Upload a base64 data-URL image to Supabase Storage and return its public URL.
 * Returns null when the backend isn't configured or the upload fails (callers
 * then keep the inline data URL, so offline/no-backend mode still works).
 * A value that's already a URL is returned unchanged.
 */
export async function uploadImage(dataUrl: string): Promise<string | null> {
  const db = createAdminSupabaseClient();
  if (!db) return null;
  if (!dataUrl.startsWith('data:')) return dataUrl;

  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!match) return null;
  const contentType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

  // Ensure the public bucket exists (no-op if it already does).
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const path = `${randomUUID()}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return null;

  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
