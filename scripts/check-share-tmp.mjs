import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const env = {}; for (const l of raw.split('\n')){const m=l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if(m) env[m[1]]=m[2].replace(/^["']|["']$/g,'');}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
const { data } = await db.from('wishlists').select('*').eq('id', process.argv[2]).maybeSingle();
console.log('DB row for id:', JSON.stringify(data));
