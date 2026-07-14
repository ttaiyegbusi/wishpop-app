import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Single shared client-side Supabase instance, used ONLY for auth (sign-in,
// session, sign-out). Shared so the auth provider and the store observe the
// same session and onAuthStateChange stream. Data access still goes through the
// service-role server actions/routes; this carries only the public anon key,
// which RLS default-denies for table reads.
let client: SupabaseClient | undefined;

export function getBrowserSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}
