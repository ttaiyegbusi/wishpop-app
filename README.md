# WishPop Next.js Rebuild

This is the restructured WishPop project using Next.js App Router.

## What changed

The old static structure:

```txt
index.html
css/styles.css
js/main.js
assets/
fonts/
```

is now:

```txt
app/
components/
lib/
actions/
database/
types/
public/
```

## Run locally

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Waitlist setup

1. Create a Supabase project.
2. Run `database/schema.sql` in the Supabase SQL editor.
3. Copy `.env.local.example` to `.env.local`.
4. Add your Supabase URL, anon key, and service role key.
5. Restart the dev server.

The waitlist form will only show success after the email is saved in Supabase.

## Deploy

Push to GitHub, connect the repo to Vercel, then add the same environment variables in Vercel project settings.
