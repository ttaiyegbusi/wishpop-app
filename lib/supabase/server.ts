import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase instance bound to the request cookies, so server actions
// can read the signed-in user's session (auth.getUser()). Data mutations still
// use the service-role admin client; this is only for identifying the caller.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called during a Server Component render, where cookies are
            // read-only. The middleware refreshes the session cookie instead,
            // so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** The signed-in user's id, or null when the request is anonymous. */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
