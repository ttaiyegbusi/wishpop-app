import { NextResponse } from 'next/server';

// Public health probe (no secrets): reports whether the Supabase backend is
// wired up in this environment. Visit /api/status to check a deployment.
export async function GET() {
  return NextResponse.json({
    supabaseConfigured:
      !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
