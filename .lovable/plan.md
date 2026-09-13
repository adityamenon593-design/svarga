# Trust badge + expanded Svarga.ai features section

## What to build

Two homepage upgrades:

### 1. Security trust strip (the "https lock" badge)

A visible trust row so visitors see the site is safe before paying:

- A **padlock icon + "https://svarga.digital — Secured connection"** badge
- Companion trust chips: **"Payments secured by Razorpay"**, **"UPI / GPay accepted"**, **"Your data stays private"**
- Placement: right under the hero stats (so it's seen immediately) **and** repeated compactly above the pricing section where payment anxiety is highest
- Same cream/saffron/ink design language — small rounded chips, leaf-green padlock, no clutter

### 2. Expanded + polished features ("Capacities") section

Replace the current 3-card section with a richer **6-card grid** covering everything Svarga actually does, keeping the existing card style but tightening typography and hover polish:

1. **Vedantic Reasoning** (existing, kept)
2. **Image Generation** (existing, kept)
3. **39 Languages** (existing, expanded copy — Hindi, Tamil, Malayalam, Bengali + 35 more)
4. **Live Web Answers** — current info with cited sources
5. **Your Document Library** — upload books/PDFs, Svarga searches them
6. **Baby Krishna Buddy** — wisdom companion from Krishna's principles
7. **Privacy Controls** — learning on/off, delete remembered data
8. **Invite & Earn** — bonus questions for every friend who joins

(6 or 8 cards in a clean 2/4-col grid — exact count tuned to look balanced.)

Polish: consistent icon tiles, hover lift/border-warm transition, tightened spacing — no layout overhaul.

## Technical details

- All edits in `src/routes/index.tsx` (trust strip as a small inline component; capacities array-driven like the Professional section for easy future edits).
- Uses existing design tokens (`bg-sand`, `text-crimson`, `border-ink/10`, `bg-leaf/15`) — no hardcoded colors.
- Verify: `bunx tsgo --noEmit`, `bun run lint`, `bun run build`, then screenshot the hero and capacities sections in the preview.
