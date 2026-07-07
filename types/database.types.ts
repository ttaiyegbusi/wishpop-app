// Generate stronger types from Supabase later with:
// npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
