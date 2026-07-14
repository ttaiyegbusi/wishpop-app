import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase instance, used ONLY for auth (sign-in, session, sign-out).
// Data access still goes through the service-role server actions/routes — this
// client carries the public anon key, which RLS default-denies for table reads.
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
