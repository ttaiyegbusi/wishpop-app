# Claude Code Prompt — WishPop Hero Section (Pixel-Perfect Implementation)

Copy everything below the line into Claude Code.

---

Build a pixel-perfect, single-page hero section for a product called **WishPop** (a gift wishlist app waitlist page). This is the entire page — one hero section, nothing else. Follow this spec exactly. Do not improvise, do not add sections, do not change copy, colors, or layout.

## Tech Requirements

- Single `index.html` file with embedded `<style>` and minimal `<script>`. No frameworks, no build step, no external CSS libraries.
- Font: **Inter** from Google Fonts (weights 400, 500, 600, 700, 800). Fallback: `-apple-system, "Helvetica Neue", Arial, sans-serif`.
- The page must fill exactly one viewport (`100vh`, no vertical scroll on desktop ≥1280px). Overflow from the folder illustration at the bottom must be clipped with `overflow: hidden` on the page wrapper.
- Design canvas reference: 1440px wide desktop. All measurements below assume this width.

## Global

- Page background: `#F2F2F2` (very light warm gray).
- Text rendering: `-webkit-font-smoothing: antialiased`.
- Base text color (black): `#111111`.
- Muted gray (used in headline and body copy): `#ADADAD` for headline gray words, `#9E9E9E` for the paragraph.

## Layout Structure (top to bottom)

### 1. Navigation Bar

- Full-width, transparent (page background shows through). Horizontal padding: `56px`. Top padding: `40px`.
- Flex row, `justify-content: space-between`, `align-items: center`.
- **Left — logo:** plain text `WishPop`. Font-size `26px`, weight `600`, color `#111111`, letter-spacing `-0.01em`. Not a link style, no icon.
- **Right — button:** text `Join waitlist`. Black pill button: background `#111111`, color `#FFFFFF`, font-size `16px`, weight `500`, padding `14px 24px`, border-radius `14px`, no border, cursor pointer. On hover: background `#000000` with a subtle `transform: translateY(-1px)` and `transition: all 150ms ease`. Clicking it smooth-scrolls/focuses the email input.

### 2. Headline Block (centered)

- Container: max-width `1000px`, centered, text-align center. Margin-top from nav: approximately `140px` (the headline sits slightly above vertical center of the viewport).
- **Headline** — two lines, rendered as one `<h1>` with `<br>` and `<span>`s for the gray words:
  - Line 1: `One list.` — the word `One` in `#111111`, the words `list.` in `#ADADAD` (including the period).
  - Line 2: `Zero duplicate gifts.` — `Zero` in `#111111`, `duplicate gifts.` in `#ADADAD` (including the period).
  - Font-size: `96px`. Font-weight: `800`. Line-height: `1.05`. Letter-spacing: `-0.03em`.
- **Subheadline paragraph**, `28px` below the headline:
  - Exact copy (em dash included, no line-break tags — let it wrap naturally):
    `Create a wishlist, share one link, and let your friends quietly reserve gifts — without spoiling the surprise for you.`
  - Max-width: `620px`, centered. Font-size: `22px`, weight `400`, color `#9E9E9E`, line-height `1.5`, text-align center. It should wrap to roughly 3 lines at this width.

### 3. Waitlist Form

- `40px` below the paragraph. Centered flex row with a `16px` gap.
- **Email input:**
  - Width `480px`, height `60px`. Background `#FFFFFF`, border: none, border-radius `14px`, padding `0 24px`.
  - Placeholder text: `Enter email address`, color `#B8B8B8`, font-size `17px`.
  - Very subtle shadow: `0 1px 2px rgba(0,0,0,0.04)`.
  - Focus state: `outline: 2px solid #111111; outline-offset: 0`.
- **Submit button:**
  - Text: `Join wait list` (three words, exactly as written — note this differs from the nav button's `Join waitlist`).
  - Background `#111111`, color `#FFFFFF`, font-size `17px`, weight `500`, height `60px`, padding `0 32px`, border-radius `14px`, no border, cursor pointer. Same hover treatment as the nav button.
- **Behavior (minimal JS):** on submit, prevent default; if the input is empty or not a valid email, shake the input (small CSS keyframe) and focus it; if valid, replace the form contents with a single line of text: `You're on the list 🎉` in `17px`, weight `500`, color `#111111`, centered. No backend call.

### 4. Folder Stack Illustration (bottom of viewport)

This is the signature visual: a fan of overlapping, rounded "file folder" shapes in different colors, each with white cards peeking out of the top, rising from the bottom edge of the viewport and **cropped by it**. Build this entirely with HTML/CSS (divs, border-radius, transforms, shadows) — no images, no SVG files.

**Container:** absolutely positioned, full-width, anchored to the bottom of the viewport, height around `560px`, `overflow: visible` (the page wrapper does the clipping). All folders are positioned absolutely inside it. Horizontal center of the composition = horizontal center of the page.

**Folder anatomy (reusable component):** a rounded rectangle (`border-radius: 40px` on top corners; bottom corners get cut off by the viewport so radius there is irrelevant) with a classic folder tab — a smaller rounded bump on the top-left of the folder body, wide enough to read as a file-folder tab (roughly 35–40% of the folder width, `24px` tall, same color, border-radius `16px 16px 0 0`). Each folder has one or two **white cards** tucked behind its front panel so the card's top portion sticks out above the folder edge. Cards: white `#FFFFFF`, border-radius `24px`, shadow `0 8px 24px rgba(0,0,0,0.10)`.

**Card contents (skeleton style):**
- A bold title in `#111111` (size varies per card, listed below).
- A thin divider line `#EDEDED` under the title.
- One or two "item rows": a `44px` rounded-square thumbnail (light gray `#F1F1F1` background, `12px` radius, containing a small dark headphone emoji/icon 🎧 rendered in grayscale or a simple CSS shape) followed by two skeleton bars (rounded pills, `#E7E7E7`, heights `10px`, widths ~`120px` and ~`80px`, stacked with `8px` gap).

**The six folders, back to front (z-index ascending). Positions are offsets from the container's horizontal center; rotations included:**

1. **Green folder** — far left, most of it off-canvas. Color `#3BC98A`. Width `420px`. Positioned so only its right ~60% is visible at the left edge of the composition (left: ~`-8%` of page width), bottom-anchored, rotation `-14deg`. A white card peeks out of it, mostly cropped, showing just skeleton bars.
2. **Yellow/orange folder** — left of center. Color `#F5A83B`. Width `440px`, rotation `-10deg`, raised higher than the green one. Behind its front panel, a white card sticks up labeled **`2025`** in bold `28px`. On the folder's front face, render the text `2025` in a darker translucent tone of the folder color (`rgba(0,0,0,0.15)`), bold, `56px`, rotated with the folder — like an embossed year label.
3. **Purple folder** — right of center, behind the blue one. Color `#6D3BEF`. Width `430px`, rotation `10deg`. White card sticking out with title **`2025`** (`24px` bold) and one item row (headphone thumbnail + text partially readable as `Airpod max` in `#111` before being cropped by the folder in front).
4. **Red folder** — far right. Color `#F05A5A`. Width `440px`, rotation `14deg`, only its left ~70% visible at the right edge. White card sticking out with title **`2024`** (`26px` bold) and skeleton rows.
5. **White "Wedding" card** — left-center, sitting in front of the yellow folder but behind the blue folder. This one is a large standalone white card (not a folder): width `380px`, rotation `-8deg`. Title **`Wedding`** in bold `34px` `#111111` (title itself slightly gray-tinted `#3A3A3A` is acceptable), divider, then one item row with the headphone thumbnail and two skeleton bars.
6. **Blue folder (hero of the composition)** — dead center, largest, front-most. Color `#2F7BF6`. Width `680px`, height tall enough that roughly `420px` is visible, rotation `0deg` (perfectly upright). Border-radius `48px` top corners.
   - Sticking out of its top: a large white card, width ~`92%` of the folder, rotation `-2deg`, with title **`Items`** in extra-bold `44px` `#111111`, a divider line, and one item row (headphone thumbnail + the beginning of an item name `Ai…` being visually cropped by the blue folder front panel).
   - On the blue folder's front face, near where the viewport cuts it off: the text **`My 20th Birthday`** in white `#FFFFFF`, bold, `56px`, centered horizontally on the folder, partially cropped by the bottom edge of the viewport (its bottom half may be cut — that matches the design).
   - The blue folder's front panel must visually overlap and clip the bottom of the white `Items` card (achieve with stacking order: card behind the front panel div).

**Shadows/depth:** every folder gets `box-shadow: 0 -12px 40px rgba(0,0,0,0.08)` plus a soft drop to its lower side; the blue folder gets a stronger `0 24px 60px rgba(17, 17, 17, 0.18)`. The composition should feel softly 3-D layered, not flat.

**Cropping:** the entire fan is bottom-anchored so that all folders run off the bottom edge of the viewport. Nothing about the illustration should cause a scrollbar.

## Z-Index Map (low → high)

1. Green folder → 2. Yellow folder (+ its `2025` card) → 3. Purple folder (+ card) → 4. Red folder (+ card) → 5. `Wedding` white card → 6. Blue folder's `Items` card → 7. Blue folder front panel + `My 20th Birthday` text.

## Responsive Behavior

- **≥1280px:** exactly as specified.
- **768–1279px:** headline `64px`, paragraph `19px` max-width `520px`, input width `360px`. Scale the folder composition down with `transform: scale(0.75)` anchored bottom-center.
- **<768px:** nav padding `24px`; headline `44px`; paragraph `17px`; form stacks vertically (input full-width, button full-width, `12px` gap, horizontal page padding `24px`); folder composition scales to `0.55`, still bottom-anchored and center-cropped. Hide the nav `Join waitlist` button below `480px`.

## Quality Bar / Acceptance Checklist

Before finishing, verify each of these:
- [ ] No vertical scrollbar at 1440×900.
- [ ] Headline gray/black word split matches exactly (`One` black + `list.` gray / `Zero` black + `duplicate gifts.` gray).
- [ ] Nav button reads `Join waitlist`; form button reads `Join wait list`.
- [ ] All six folder colors present: green `#3BC98A`, yellow `#F5A83B`, blue `#2F7BF6`, purple `#6D3BEF`, red `#F05A5A`, plus the standalone white `Wedding` card.
- [ ] Blue folder is centered, upright, largest, and in front; `My 20th Birthday` text is white and cropped by the viewport bottom.
- [ ] Cards show bold titles + divider + thumbnail + gray skeleton pills (no lorem ipsum, no real product text beyond what's specified).
- [ ] Email validation + success state (`You're on the list 🎉`) works.
- [ ] Only one file: `index.html`. No external assets besides the Google Fonts import.

Open the finished page in a browser (or describe how to), and screenshot-compare it mentally against this spec before declaring done.
