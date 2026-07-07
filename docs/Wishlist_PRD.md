# Product Requirement Document: Wishlist

**Version:** 2.0
**Status:** Draft
**Author:** Product Team
**Date:** July 4, 2026

---

## Document Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | July 4, 2026 | Product Team | Initial draft |
| 2.0 | July 4, 2026 | Product Team | Expanded: acceptance criteria, edge cases, business rules, IA, release plan, risks, analytics |

---

## 1. Executive Summary

Wishlist is a web platform that lets users create wishlists of items they'd like to receive as gifts, share those lists with friends and family through a public link, and lets viewers reserve items so that gift-givers never duplicate purchases — all while preserving the element of surprise for the wishlist owner.

The product serves two sides of the same social interaction: the **Owner**, who wants to receive gifts they actually want, and the **Viewer** (friend/family member), who wants confidence that their chosen gift isn't already taken. The core mechanic — reservation with optional anonymity, hidden from the owner — is what differentiates Wishlist from simply sharing a list of links in a group chat.

## 2. Background & Problem Statement

### 2.1 The Problem

Gift-giving around birthdays, weddings, holidays, and baby showers suffers from three recurring failures:

1. **Duplicate gifts.** Multiple gift-givers independently buy the same popular item because there is no coordination channel between them.
2. **Unwanted gifts.** Givers guess at what the recipient wants, leading to wasted money and awkward returns.
3. **Spoiled surprises.** The existing workaround — asking the recipient directly, or the recipient policing a shared document — reveals who is buying what and removes the joy of surprise.

Today, people solve this with fragmented tools: text messages with links, notes apps, retailer-specific registries (which lock all gifts to one store), or shared spreadsheets (which the recipient can see, spoiling everything).

### 2.2 The Opportunity

A lightweight, store-agnostic platform that separates what the owner sees from what viewers see solves all three failures at once. The owner curates; the viewers coordinate invisibly.

### 2.3 Competitive Context

| Existing solution | Limitation Wishlist addresses |
|---|---|
| Retailer registries (e.g. Amazon Lists) | Locked to one store; limited anonymity controls; requires retailer account |
| Shared notes/spreadsheets | Owner can see reservations; no structure; manual coordination |
| Dedicated gifting apps | Often require every viewer to create an account, creating friction for casual gift-givers |

Wishlist's wedge: **viewers need no account to view or reserve**, items can link to any store on the internet, and the reservation layer is invisible to the owner.

## 3. Goals & Non-Goals

### 3.1 Goals

- G1: Let users create and manage an unlimited number of wishlists.
- G2: Let users add rich item entries: name, external link, price, notes, and image.
- G3: Let users share any wishlist via a unique public link, viewable without an account.
- G4: Let viewers reserve an item in one action, with a choice to be anonymous or named.
- G5: Prevent duplicate gifting by locking reserved items.
- G6: Preserve surprise: the owner can never see which items are reserved or by whom.
- G7: Keep the owner engaged with a lightweight notification when reservations happen.

### 3.2 Non-Goals (Explicitly Out of Scope for v1)

- NG1: In-app purchasing, checkout, or payment processing. Items link out to external stores.
- NG2: Group gifting / cost-splitting on a single item.
- NG3: Un-reserving. Once an item is reserved, it is locked (see Section 8 for edge-case handling).
- NG4: Private or invite-only sharing. v1 sharing is public-link only.
- NG5: Native mobile apps. v1 is a responsive web app.
- NG6: Social feed, comments, likes, or follower mechanics.
- NG7: Automatic price tracking or price-drop alerts.

## 4. Success Metrics

**North Star Metric:** Number of items reserved per month (this captures the full loop: list created → shared → viewed → reserved).

### 4.1 Supporting KPIs

| Metric | Definition | Target (6 months post-launch) |
|---|---|---|
| Activation rate | % of new signups who create a wishlist with ≥1 item within 24h | ≥ 60% |
| Share rate | % of created wishlists whose public link is copied/shared | ≥ 70% |
| Viewer conversion | % of unique link visitors who reserve an item | ≥ 25% |
| Reservation coverage | Average % of items reserved on shared lists 30 days after sharing | ≥ 40% |
| Retention | % of owners who create a second wishlist within 90 days | ≥ 30% |
| Anonymity usage | % of reservations made anonymously | Tracked (no target; informs product decisions) |

### 4.2 Counter-Metrics (Guardrails)

- Support tickets about "reserved by mistake / can't undo" — a spike signals we need to revisit NG3.
- Owner complaints about surprise being spoiled — signals a leak in the visibility model.

## 5. User Personas

### 5.1 The Owner — "Ada"

Ada, 27, has a birthday coming up. Her friends always ask what she wants; she always answers vaguely and ends up with three scented candles. She wants to give people concrete options across different stores and price points, without knowing what she'll get. She's moderately tech-savvy, uses her phone for everything, and won't tolerate a clunky setup process.

**Needs:** fast list creation, easy link sharing to WhatsApp/group chats, confidence the surprise is protected.

### 5.2 The Viewer — "Tunde"

Tunde, 30, receives Ada's link in a group chat. He doesn't want another app or account. He wants to open the link, pick something in his budget, claim it in seconds, and be sure nobody else buys the same thing. He may or may not want Ada's other friends to know which gift he picked.

**Needs:** zero-friction viewing, clear reserved/available states, one-tap reservation, anonymity option.

### 5.3 The Dual-Role User

Most users will eventually play both roles: they create lists for their own occasions and reserve items on friends' lists. The account model must support both seamlessly.

## 6. User Stories & Acceptance Criteria

### Epic A: Account & Authentication

**A1.** As a new user, I can sign up with email and password so I can own wishlists.
- AC: Signup requires name, email, password; email must be verified before sharing a list.
- AC: Passwords follow standard strength requirements; errors are shown inline.

**A2.** As a returning user, I can log in and see all my wishlists on a dashboard.
- AC: Dashboard lists all wishlists with title, item count, created date, and a copy-link button.

**A3.** As a viewer, I can view and reserve on a shared list **without an account**.
- AC: Opening a share link never presents a login wall.
- AC: If a viewer chooses a named (non-anonymous) reservation, they provide a display name (and optionally an email for their own confirmation) without creating an account.

### Epic B: Wishlist Management

**B1.** As an owner, I can create a wishlist with a title and optional description and occasion date.
- AC: Title is required (max 100 chars); description optional (max 500 chars); date optional.
- AC: No limit on the number of wishlists per user.

**B2.** As an owner, I can edit or delete a wishlist.
- AC: Deleting a wishlist requires confirmation and permanently removes its items and reservations.
- AC: Deleting a wishlist invalidates its share link (visitors see a friendly "list no longer available" page).

### Epic C: Item Management

**C1.** As an owner, I can add an item with name, link, price, notes, and image.
- AC: Name and link are required; price, notes, image are optional.
- AC: Link must be a valid URL; it opens in a new tab for viewers.
- AC: Image can be uploaded (JPEG/PNG/WebP, max 5 MB, auto-resized) — with auto-fetch from the link's page metadata as a stretch goal.
- AC: Price is a number with a currency selector (defaults to the owner's locale currency).

**C2.** As an owner, I can edit or remove items.
- AC: Editing a reserved item's details is allowed (owner doesn't know it's reserved) — the reservation stays attached.
- AC: Removing an item that has a reservation deletes the reservation silently; if the reserver provided an email, they are notified the item was removed (see Section 8, EC4).

**C3.** As an owner, I can reorder items or mark priority.
- AC: Drag-to-reorder on desktop; move up/down controls on mobile.
- AC: Optional priority flag ("really want this") displayed to viewers.

### Epic D: Sharing

**D1.** As an owner, I can copy a public share link for any wishlist.
- AC: The link contains a cryptographically random token (≥ 128 bits), not a sequential ID.
- AC: One-tap "Copy link" plus native share sheet on mobile.

**D2.** As an owner, I can regenerate the share link.
- AC: Regenerating immediately invalidates the previous link; old links show the "no longer available" page.
- AC: Existing reservations are preserved through regeneration.

### Epic E: Viewing & Reservation

**E1.** As a viewer, I can see all items with name, image, price, notes, priority, link, and reservation state.
- AC: Reserved items are visually distinct (e.g., badge + reduced emphasis) but remain visible.
- AC: A named reservation shows "Reserved by {name}"; an anonymous one shows "Reserved".

**E2.** As a viewer, I can reserve an available item.
- AC: Reservation is a two-step action: tap "Reserve" → choose Anonymous or Enter name → confirm.
- AC: The confirm screen clearly states: **"Reservations can't be undone."**
- AC: On success, the item immediately shows as reserved for all viewers.
- AC: Concurrent attempts: the first confirmed reservation wins; the second viewer sees "Sorry, someone just reserved this" (see Section 8, EC1).

**E3.** As a viewer, I optionally get a confirmation of my reservation.
- AC: If the viewer enters an email at reservation time (optional), they receive a confirmation email with the item details and list link.

### Epic F: Owner Visibility & Notifications

**F1.** As an owner, I never see reservation state on my own lists.
- AC: The owner's view of their own wishlist renders every item as normal — no badges, counts, or filters that reveal reservation status.
- AC: This applies across all surfaces: web UI, notification content, emails, API responses, and data exports.

**F2.** As an owner, I get notified when a reservation happens.
- AC: Notification (email and in-app) says: "Someone reserved an item on '{Wishlist title}' 🎁" — it never reveals which item or who reserved it.
- AC: Notifications can be muted per-wishlist in settings.

## 7. Functional Requirements (Prioritized)

MoSCoW prioritization for v1.

### Must Have
- FR1: Email/password signup, login, logout, password reset.
- FR2: Create, edit, delete unlimited wishlists (title, description, occasion date).
- FR3: Add, edit, delete, reorder items (name*, link*, price, notes, image).
- FR4: Image upload with validation and resizing.
- FR5: Unique, unguessable public share link per wishlist; copy and regenerate.
- FR6: Public list view requiring no account.
- FR7: One-tap reservation flow with anonymous/named choice and irreversibility warning.
- FR8: Reservation locking — one reservation per item, permanent, race-condition safe.
- FR9: Owner-blind reservation model enforced at the API level (not just UI).
- FR10: Generic reservation notification to owner (email + in-app), mutable per list.

### Should Have
- FR11: Optional viewer email at reservation for confirmation message.
- FR12: Priority flag on items.
- FR13: Native share sheet integration on mobile browsers.
- FR14: "List no longer available" pages for deleted lists / regenerated links.

### Could Have
- FR15: Auto-fetch item title/image/price from a pasted product URL (link unfurling).
- FR16: Wishlist cover image / theme.
- FR17: Occasion-date countdown on the shared view.

### Won't Have (this release)
- FR18: Group gifting, un-reserving, private sharing, payments, native apps, comments.

## 8. Business Rules & Edge Cases

- **EC1 — Race condition on reservation.** Two viewers attempt to reserve the same item simultaneously. The reservation write is atomic (unique constraint on item_id); the loser receives a clear, friendly failure state and the list refreshes.
- **EC2 — Owner opens their own share link.** If a logged-in owner opens their own public link, the system detects ownership and renders the owner view (reservation states hidden). If the owner is logged out, we cannot reliably detect them — this is an accepted limitation; the irreversibility and anonymity of reservations still limits what they learn (mitigation note: warn owners in onboarding not to open their own link logged-out).
- **EC3 — Reserved item's external link goes dead.** Out of platform control; notes field and item name still give the giver enough to find an alternative retailer. No v1 handling.
- **EC4 — Owner deletes a reserved item.** The reservation is deleted. If the reserver left an email, they receive: "An item you reserved on '{list}' was removed by the owner." The notification does not tell the owner anything.
- **EC5 — Owner deletes an entire list with reservations.** Same as EC4, applied to every reserved item.
- **EC6 — Owner edits a reserved item.** Allowed (owner is blind to reservations). If the edit is substantial (name or link changed) and the reserver left an email, send an "item you reserved was updated" notice.
- **EC7 — Link regeneration after sharing.** Old link dies; reservations persist. Owner is warned before confirming regeneration that previously shared links will stop working.
- **EC8 — Abuse of public links.** Rate-limit reservation attempts per IP; require a minimal anti-bot check on reservation confirm if abuse is detected.
- **EC9 — Duplicate list titles.** Allowed; lists are identified by ID/token, not title.
- **EC10 — Empty list shared.** Allowed; viewers see an empty state ("No items yet — check back soon").
- **EC11 — Anonymous reservation with no email.** Fully supported; the reservation simply has no contact trail. The viewer is warned they won't receive updates about the item.

## 9. User Flows

### 9.1 Owner: Create & Share

1. Sign up / log in → lands on Dashboard.
2. Tap "New Wishlist" → enter title, optional description and occasion date → Create.
3. On the (empty) list page, tap "Add item" → fill name + link (+ price, notes, image) → Save. Repeat.
4. Tap "Share" → link copied / native share sheet → paste into WhatsApp, iMessage, email, etc.
5. Later: receives "Someone reserved an item on 'Ada's Birthday' 🎁" notifications as reservations occur.

### 9.2 Viewer: View & Reserve

1. Tap shared link → wishlist opens instantly, no login wall.
2. Browse items; reserved ones are badged; available ones show a "Reserve" button.
3. Tap "Reserve" on an item → modal: "Reserve anonymously" or "Reserve with your name" (name field) → optional email for confirmation → warning: reservations can't be undone → Confirm.
4. Item flips to Reserved for all viewers. Optional confirmation email sent.
5. Viewer clicks the item's external link to go buy it at the retailer.

### 9.3 Owner: Manage Over Time

1. Open a wishlist from Dashboard → add/edit/remove/reorder items at any time.
2. Regenerate link if it leaked somewhere unwanted (warned that old links break).
3. Delete list after the occasion (warned it's permanent).

## 10. Information Architecture & Key Screens

1. **Landing page** — value proposition, sign-up CTA, sample wishlist demo.
2. **Auth screens** — sign up, log in, forgot password.
3. **Dashboard** — grid/list of the user's wishlists with quick actions (open, copy link, delete).
4. **Wishlist editor (owner view)** — item list with add/edit/reorder; share button; settings (notifications, regenerate link, delete list). No reservation indicators anywhere.
5. **Public wishlist (viewer view)** — read-only list header (title, description, occasion countdown), item cards with reserve buttons and reservation badges.
6. **Reservation modal** — anonymity choice, optional name/email, irreversibility warning, confirm.
7. **System pages** — list no longer available; item just got reserved; generic error/empty states.

## 11. Data Model (High-Level)

**User**
- id (PK), name, email (unique), password_hash, email_verified_at, created_at

**Wishlist**
- id (PK), owner_id (FK → User), title, description, occasion_date, share_token (unique, ≥128-bit random, indexed), notifications_muted (bool), created_at, updated_at

**Item**
- id (PK), wishlist_id (FK → Wishlist), name, link_url, price_amount, price_currency, notes, image_url, priority (bool), sort_order, created_at, updated_at

**Reservation**
- id (PK), item_id (FK → Item, **unique** — enforces one reservation per item), display_name (nullable), is_anonymous (bool), reserver_email (nullable), created_at

Key constraints:
- `Reservation.item_id` unique constraint is the race-condition guard (EC1).
- Owner-facing queries must never join or select from Reservation (FR9) — enforced by API-layer authorization, not client logic.

## 12. Non-Functional Requirements

### 12.1 Privacy & Surprise Integrity
- The owner-blind model is enforced server-side. No API endpoint accessible to an owner returns reservation data for their own lists.
- Reserver emails are used only for transactional messages about their own reservation; never exposed to owners or other viewers.
- Anonymous reservations store no display name.

### 12.2 Security
- Share tokens: cryptographically random, ≥128 bits, non-sequential.
- Standard protections: HTTPS everywhere, hashed passwords (bcrypt/argon2), CSRF protection, rate limiting on auth and reservation endpoints.
- Uploaded images validated by type and size; served from a separate asset domain/CDN.

### 12.3 Performance
- Public wishlist page loads in under 2 seconds on a mid-range mobile device over 3G (this page is the viral surface — it must be fast).
- Reservation confirmation round-trip under 1 second p95.

### 12.4 Availability & Scalability
- 99.9% uptime target for the public list view.
- No hard limits on wishlists per user or items per wishlist; soft pagination beyond 100 items per list.

### 12.5 Accessibility & Compatibility
- WCAG 2.1 AA: reservation state conveyed by text/badge, not color alone; full keyboard navigation; screen-reader labels on reserve actions.
- Responsive web supporting the last two major versions of Chrome, Safari, Firefox, and Edge; mobile-first layout.

### 12.6 Localization (Future-Ready)
- Currency selector on price from day one. UI copy structured for future translation; v1 ships in English.

## 13. Analytics & Instrumentation

Track (anonymized/aggregated where appropriate):
- `signup_completed`, `wishlist_created`, `item_added`, `share_link_copied`
- `public_list_viewed` (unique visitors per token), `reserve_started`, `reserve_completed` (with anonymous flag), `reserve_conflict` (EC1 losses)
- `link_regenerated`, `list_deleted`, `notification_muted`

These map directly to the KPIs in Section 4. Reservation analytics shown to owners in any future dashboard must remain aggregate and non-identifying, consistent with the owner-blind rule — v1 shows owners no reservation analytics at all.

## 14. Release Plan

### Phase 1 — MVP (target: 8–10 weeks)
Auth, wishlist CRUD, item CRUD with image upload, public share link, viewer reservation with anonymity choice, owner-blind enforcement, reservation notification email.

### Phase 2 — Polish (following 4–6 weeks)
Link unfurling (auto-fetch item details), priority flags, native share sheet, occasion countdown, in-app notification center, reservation-conflict UX refinements, per-list notification muting.

### Phase 3 — Expansion (post-validation)
Revisit top non-goals based on data and feedback: un-reserve with a time window, group gifting, private/invite sharing, owner "thank-you tracker" post-occasion reveal (owner can choose to reveal reservations after the occasion date passes — candidate feature, needs validation).

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Viewers frustrated they can't undo a reservation (mis-taps, changed minds) | High | Medium | Strong confirmation step with explicit warning; monitor support tickets as a counter-metric; Phase 3 candidate: short undo window |
| Owner discovers reservations by opening their link logged-out (EC2) | Medium | Medium | Onboarding education; anonymity option limits exposure; accept as v1 limitation |
| Public links leak beyond intended audience | Medium | Low | Unguessable tokens; one-tap regeneration; future private sharing |
| Low viewer conversion because reserving feels like commitment | Medium | High | Frictionless flow (no account), clear copy that reserving ≠ paying; measure `reserve_started` vs `reserve_completed` drop-off |
| Dead/changed retailer links reduce trust | Medium | Low | Encourage notes field; Phase 2 link unfurling refreshes metadata |
| Notification spam annoys owners with popular lists | Low | Low | Per-list mute; digest batching if volume is high |

## 16. Assumptions & Dependencies

- A1: Viewers will reserve without creating accounts if friction is low enough (core bet — validate early).
- A2: Email is a sufficient notification channel for v1 (no push/SMS).
- D1: Transactional email provider (e.g., for notifications and confirmations).
- D2: Object storage + CDN for item images.
- D3: No retailer API integrations are required for v1 (links are plain URLs).

## 17. Open Questions

- OQ1: Should the owner be able to optionally reveal reservations *after* the occasion date (a "post-birthday reveal") — or does that undermine trust in the blind model?
- OQ2: Should named reservations be visible to other viewers by default, or should the anonymity choice also control viewer-facing visibility separately from owner-facing (owner never sees it either way)?
- OQ3: Minimum viable anti-abuse for public reservation endpoints — is rate limiting enough, or do we need a lightweight challenge at launch?
- OQ4: Do we need soft-delete/recovery for accidentally deleted lists?
- OQ5: What is the policy for stale lists (e.g., occasion date long past) — archive automatically or leave untouched?

## 18. Glossary

- **Owner** — an account holder who creates and manages wishlists.
- **Viewer** — anyone who opens a shared wishlist link; no account required.
- **Reservation** — a viewer's permanent claim on one item, signalling to other viewers that it will be gifted.
- **Owner-blind model** — the principle that no reservation information (state, item, identity) is ever exposed to the wishlist owner.
- **Share token** — the random, unguessable string embedded in a wishlist's public URL.
