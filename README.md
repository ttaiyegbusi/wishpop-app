# WishPop — Product App

The WishPop product application (the app behind the waitlist). The
marketing/waitlist landing page lives in a separate repo
([wishpop](https://github.com/ttaiyegbusi/wishpop)).

- **This repo** → the product app, deployed to `app.wishpop.online`.
- **wishpop repo** → the landing page, deployed to the apex domain.

## Routes

- `/` — Home (your wishlists)
- `/wishlists/new` — name a wishlist folder
- `/wishlists/new/items` — add an item (image, title, price, link, notes)
- `/wishlists/[id]` — wishlist view (fanned, swipeable item cards)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Notes

- Mobile-first. On desktop each screen renders as a centred phone frame.
- State is currently client-side (localStorage) — no backend yet. Supabase
  server actions and auth are the next step.
