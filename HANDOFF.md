# WishPop — Session Handoff

A summary of the work done in this chat so you can continue in a new one.

## What the app is
- **WishPop product app** (behind the waitlist). Repo: `ttaiyegbusi/wishpop-app`, deployed on Vercel at `wishpop-app.vercel.app`. Landing page is a separate repo (`ttaiyegbusi/wishpop`).
- **Stack:** Next.js 16 (App Router) + React 18 + TypeScript, Supabase (DB + Storage), Vercel Analytics, self-hosted **Baloo 2** font.
- **Local path:** `/Users/temitopeaiyegbusi/Downloads/wishpop-app`. Main branch: `main`. All work is pushed to `main` (Vercel auto-deploys).

## Core flows / routes
- `/` — Home (folder grid; logo + hamburger; FAB / "New wishlist")
- `/wishlists/new` — name a folder (opens as an **intercepting-route modal** over the current page on soft-nav)
- `/wishlists/new/items` — add/edit an item (also a modal via interception; `?wishlist=<id>` = add to existing, `&item=<id>` = edit)
- `/wishlists/[wishlistId]` — wishlist detail (item gallery + story viewer)
- `/w/[shareToken]` — public reserve view (share token = the wishlist id)
- `/api/status` — public probe: `{ supabaseConfigured: bool }` (open on any deployment to check env vars)

## What we built/changed this session (high level)
1. **Folder art & item icon** — fixed the folder preview (opaque front so the “Items” card tucks behind); replaced hand-drawn add-image icon with `lucide-react`.
2. **Font** — switched everything to **Baloo 2**, then **self-hosted** it via `next/font/local` (`app/fonts/Baloo2-VariableFont_wght.ttf`) to remove the render-blocking Google Fonts request. Wordmark logo is `public/assets/wordmark.png` (rendered in Pacifico — **placeholder**, see Open items).
3. **Wishlist detail** — replaced the horizontal swipe deck with a **vertical zig-zag scatter** of framed item cards (white matte, ±6° tilt, edge gradient fades), a `count • date` subtitle, and a **Stories-style item viewer** (swipe/arrows/wrap, tap-to-open, Edit/Delete with confirm).
4. **Create-item screen** — stacked-label white fields, **currency picker** (NGN default) on price, live **Invalid URL Link** warning, comma price formatting, bottom CTA.
5. **Folder ⋮ menus** — Rename / Share / Delete on both home cards and detail (store methods `renameWishlist`, `deleteWishlist`, `deleteItem`, `updateItem`).
6. **Reserve flow** — public `/w/[shareToken]` view: browse → open in reserve mode → enter email → **Reserved** toast with Undo; reserved items badged/dimmed/locked.
7. **Supabase backend (MVP, no auth)** — anonymous wishlists via a per-device `owner_key`; wishlist id doubles as share token; reservation stored inline on the item. Schema: `database/wishpop_mvp.sql`. Server actions in `actions/wishlist.actions.ts`, `actions/reservation.actions.ts`, `actions/image.actions.ts`. Client store syncs to/from cloud (falls back to localStorage when unconfigured). Images upload to a **Supabase Storage** bucket `item-images` (public URLs), not base64.
8. **Home redesign** — logo + hamburger header, grey empty-folder state, 2-col folder grid with photo peeks + per-card ⋮ menu, hamburger nav (Sign up / Account / How it works / Sign out — **placeholders**, no auth yet).
9. **Web (desktop, ≥900px) layout** — home = top bar + wide grid; detail & public = centered header + gallery grid; **create/add = dim-backdrop modals** rendered **over the current page** via Next.js intercepting + parallel routes (`app/@modal/...`). Mobile is unchanged below 900px.
10. **Save flow made instant** — adding to an existing wishlist now **closes the modal (`router.back()`)** to reveal the already-loaded detail (no slow re-navigation); brand-new wishlist still navigates to its detail. The **"New Item added" toast is wired through the store** (`justAdded` / `flagItemAdded` / `clearJustAdded`) so it fires on every add.
11. **PWA** — installable manifest (`app/manifest.ts`), icons in `public/icons/`, `viewport-fit=cover` + `interactiveWidget=resizes-content`.
12. **Item-loss bug fixed** — cloud pushes are now **serialised per wishlist** (promise chain in the store) so a slow push can’t wipe a just-added item.

## Latest commits on `main` (newest first)
- `23c433a` Wire the "New Item added" toast through the store
- `c086e6c` Make saving an item instant by closing the modal to reveal the detail
- `45c891b` Open create/add modals over the current page via intercepting routes
- `100a1d9` Present create-folder and add-item as modals on the web
- `524d48d` Make create/add screens content-fit panels on desktop
- `e7ac6f3` Wide desktop layout for public reserve view + create/add panels
- `612a493` Add wide desktop layout for the wishlist detail
- `280150c` Home + viewer fixes: close-on-tap, instant save, card polish, wordmark
- `ab2865b` Fix items being lost by serialising cloud pushes
- `2b950e3` Add PWA

## Supabase setup (already done, but note)
- Project ref `iaamkfexnwqdxbzhqrfl`; URL `https://iaamkfexnwqdxbzhqrfl.supabase.co`.
- Env vars needed **locally (`.env.local`, gitignored) and in Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Vercel env vars only apply to **new** deploys — must redeploy after adding.
- Schema to run in Supabase SQL editor: `database/wishpop_mvp.sql`.

## ⚠️ Open items / to verify next
1. **ROTATE the Supabase `service_role` key** — it was pasted in chat earlier, so treat it as compromised. Regenerate it, then update `.env.local` and Vercel.
2. **Verify on a real device/deploy** (my dev environment couldn't run the live app — the localhost render hangs, so desktop layouts + intercepting-route modals were validated with mocks/build, not live clicks). Specifically check:
   - Create/add **modals show the home/detail behind them** on web (should NOT render the full create page behind the dim backdrop — if it does, the `@modal` parallel-route slot needs adjusting).
   - Adding several items to an existing wishlist in a row: each snaps back **instantly** with the **"New Item added" toast**.
   - Brand-new wishlist → lands on its detail.
3. **Keyboard auto-open** on the create screen: works on Android/installed PWA; **iOS Safari blocks** programmatic keyboard open without a tap — platform limitation, not fully fixable in a browser tab.
4. **Wordmark logo** is Pacifico (approximation). Drop in the real WishPop logo SVG/PNG (`public/assets/wordmark.png`) for an exact match.
5. **Auth** — the hamburger items (Sign up / Account / Sign out) are placeholders. Real accounts are the natural next feature (would also let wishlists follow a user instead of a per-device key).
6. **Images** are stored inline as data URLs when the backend is unconfigured; with Supabase they go to Storage. Fine for MVP.

## How to run / verify locally
```bash
cd /Users/temitopeaiyegbusi/Downloads/wishpop-app
npm install
npm run dev        # http://localhost:3000
npm run build      # production build / typecheck
npx tsc --noEmit   # typecheck only
```
