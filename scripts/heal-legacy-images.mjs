// One-time migration: move inline base64 item images out of the `items.image_url`
// column and into the `item-images` Storage bucket, replacing each row's value
// with the small public URL. Legacy rows (created before images went to Storage)
// carry hundreds of KB of base64 inline, which re-downloads on every sync.
//
// Usage:
//   node scripts/heal-legacy-images.mjs           # dry run — report only
//   node scripts/heal-legacy-images.mjs --apply    # perform the migration
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'item-images';
const APPLY = process.argv.includes('--apply');

function loadEnv() {
  const env = {};
  let raw = '';
  try {
    raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  } catch {
    throw new Error('.env.local not found');
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function main() {
  console.log(APPLY ? '=== APPLYING migration ===' : '=== DRY RUN (pass --apply to migrate) ===');

  // Page through all items whose image_url is still an inline data URL.
  const legacy = [];
  const pageSize = 100;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('items')
      .select('id, image_url')
      .like('image_url', 'data:%')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    legacy.push(...data);
    if (data.length < pageSize) break;
  }

  const totalBytes = legacy.reduce((n, it) => n + (it.image_url?.length ?? 0), 0);
  console.log(`Found ${legacy.length} item(s) with inline base64 images (~${fmtKB(totalBytes)} in rows).`);
  if (legacy.length === 0) return;

  if (APPLY) {
    await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});
  }

  let healed = 0;
  let failed = 0;
  for (const item of legacy) {
    const match = item.image_url.match(/^data:(.+?);base64,(.*)$/);
    if (!match) {
      console.log(`  skip ${item.id}: not a base64 data URL`);
      continue;
    }
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');

    if (!APPLY) {
      console.log(`  would heal ${item.id}: ${contentType}, ${fmtKB(buffer.length)}`);
      continue;
    }

    const path = `${randomUUID()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
    if (up.error) {
      console.log(`  FAIL upload ${item.id}: ${up.error.message}`);
      failed++;
      continue;
    }
    const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const upd = await db.from('items').update({ image_url: publicUrl }).eq('id', item.id);
    if (upd.error) {
      console.log(`  FAIL update ${item.id}: ${upd.error.message}`);
      failed++;
      continue;
    }
    healed++;
    console.log(`  healed ${item.id} → ${publicUrl}`);
  }

  if (APPLY) {
    console.log(`\nDone. Healed ${healed}, failed ${failed}, of ${legacy.length}.`);
  } else {
    console.log(`\nDry run complete. Re-run with --apply to migrate ${legacy.length} image(s).`);
  }
}

main().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});
