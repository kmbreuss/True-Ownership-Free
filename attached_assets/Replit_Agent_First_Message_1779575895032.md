# Replit Agent · First Message · A1 Purpose Redesign

**Paste everything below the line into the Replit Agent chat in the True Ownership project. Do not modify it — every constraint is intentional.**

---

## START OF MESSAGE

Hi. I'm Katherine, owner of this Replit project. We're going to redesign **A1 only** in the True Ownership app. This is the first of several scoped handoffs — do not touch A2, A3, A4, A5, or any non-A1 pages.

**Before you write any code, do these four things in order:**

### 1. Fork as snapshot first

Use Replit's project menu → Fork. Name it: `True-Ownership-Snapshot-Pre-A1-Redesign`. Do not edit the fork — it's the rollback. Confirm the fork is created before continuing.

### 2. Read these files in this order

1. `Program_Architecture_v2.md` — the program spine (color semantics, room pattern, veil spec, data model)
2. `Replit_Handoff_A1_Purpose.md` — the scoped handoff for A1 · Mirror 1 (Purpose)
3. `A1_M1_Purpose_v4.html` — the visual reference prototype. **Open it locally and walk the full flow** (Owned Symptoms → True Ownership → Peel → Declare). The flow IS the spec. Where this file and the docs disagree, the file wins, EXCEPT for the design-system overrides in section 4 below.

### 3. Reply with a PLAN, not code

After reading, reply with:

- **(a) Files/components you will touch** — name each one
- **(b) Data migration plan** — what existing data stays, what moves, what gets a new shape
- **(c) Any new DB columns or new endpoints you want to add** — if any, justify each. Default answer should be "none."
- **(d) What you will leave untouched** — explicitly name the things you will NOT change

**Do not write code until I approve the plan.** If you find yourself wanting to add complexity that isn't named in this message or the handoff doc, stop and ask. *Subtractive revisions are usually right.*

### 4. Design system — non-negotiable overrides

The architecture doc lists tokens, but I'm overriding a few here. **Use these exact values inside the new A1 only.** Do not change tokens anywhere else in the app.

**Backgrounds**
- Dark mode background: `#0d1b2e` (the navy already on the live app — keep)
- Light mode background: `#f5f3ef` (warm cream — wire the toggle so it actually works)

**Fonts**
- Body: `DM Sans` (already live — keep)
- Headings inside the new A1: **`Georgia, 'Iowan Old Style', 'Palatino', serif`** — NOT Cormorant Garamond, and explicitly NOT Times New Roman in the fallback stack. The rest of the app stays on Cormorant for now; only A1 (behind the feature flag) gets Georgia.
- **Answer field text: DM Sans, regular weight, NOT italic, NOT serif.** No fancy serif italic inside textareas or inputs. The italic serif look is reserved for declared values and threshold lines only.

**Color semantics (apply consistently)**
- Gold `#C9A24B` (dark) / `#B8892F` (light) = truth, declared, honored
- Burgundy `#A03B3B` (dark) / `#7A2E2E` (light) = cost, gravity, mirror
- Cyan `#4fcbf2` (dark) / `#2a8fb5` (light) = working energy, current focus

**Light/dark toggle**
- A theme toggle currently does not function on the live app. Wire it up properly. Default = dark. Persist the user's choice. Apply across the new A1 (and the global app shell if needed — but no other pages need to be restyled this round).

---

## What's actually being built this round

### Feature flag — build new A1 alongside old A1

Add a URL query flag `?newA1=1`. When present, render the new A1 grid + Purpose flow. When absent (default), render the existing A1 sidebar + pages **exactly as it is today**. Do not modify the default A1 behavior.

This means I can test the new A1 at:
`https://b8363272-ff9f-404c-9632-5af68f34d738-00-2kazqkj8gufie.spock.replit.dev/?newA1=1`

…while the live app at the default URL stays untouched.

### A1 grid replaces the sidebar (behind the flag only)

When `?newA1=1`:
- Hide the current A1 left sidebar
- Render a 4-card Mirror grid: **Purpose** (unlocked), **BAG · 10-Year Vision** (locked), **Identity · Superpowers** (locked), **Values · Behaviors** (locked)
- The current "Introduction" content becomes a collapsed video block at the top of the A1 grid
- "Direction · 3-YEAR" and "Direction · 1-YEAR" sidebar items are hidden — **their database data must be preserved untouched.** They will migrate to A4 in a future handoff.
- "My Map of Me™" moves to a persistent gold button in the top-right header (next to the theme toggle)

### Purpose Mirror — the only Mirror being built this round

When the Purpose card is clicked, open the Explore page → 4 exercises (Owned Symptoms, True Ownership, Peel, Declare). See `Replit_Handoff_A1_Purpose.md` for the exact exercise specs, validation rules, and data model. See `A1_M1_Purpose_v4.html` for the visual treatment.

### Katherine surface — Room only, not Explore

This is an override of any implication that Katherine lives in a persistent right rail on the Explore page.

- The **Explore page is calm** — just the breadcrumb, intro video, and the 4 exercise rows. Right side of the page can show a quiet "Your Purpose so far" status strip (Holding back / True Ownership / Peel layers / Declaration — empty dashes until each exercise saves).
- Katherine appears **inside each Room** as a "Ask Katherine to reflect what she's hearing" button at the bottom. She has the user's saved context.
- The existing Voice picker (Advice / Coach / Challenger) moves into the Room footer next to the Katherine button — only visible when Katherine is invoked.
- The existing Katherine right-rail on the current Purpose · Direction page stays as-is on the default (un-flagged) view. It only goes away inside the new A1.

---

## What to preserve untouched (do not modify)

- The existing A1 sidebar, Introduction page, Purpose · Direction page, Direction · 3-YEAR, Direction · 1-YEAR, Identity · Superpowers, Values · Behaviors pages — all stay exactly as they are when the flag is OFF
- All existing BAG / Time / Wealth / Growth / life priorities database data — **do not delete, do not migrate, do not rename columns**
- `/api/me/profile` endpoint
- Auto-save engine and Katherine AI integration (the underlying engine — only the surface treatment changes inside the new A1 Rooms)
- A1-A5 header stepper
- The True Ownership™ landing page (the "You are the spine. How aligned are you?" page)
- All A2, A3, A4, A5 pages

---

## Done criteria — all 10 must pass on dev before redeploy to prod

1. Default URL (`/`) renders the existing app exactly as today — old sidebar, Cormorant headings, all pages unchanged
2. `?newA1=1` renders the new A1 grid with 4 Mirror cards (Purpose unlocked, three locked)
3. Map of Me moves to a persistent gold button in the top-right header when the flag is on
4. Clicking Purpose opens the Explore page with 4 exercise rows + a quiet status strip on the right
5. Each exercise opens as a centered Room card on a dimmed/blurred Explore page (View A — see prototype HTML)
6. Veil transition plays on Room entry (~2.7s total, per spec)
7. All 4 Purpose exercises (Owned Symptoms, True Ownership, Peel, Declare) work end-to-end with auto-save
8. Returning to a completed exercise lets the user edit in place — no separate review mode
9. Light/dark theme toggle actually works inside the new A1
10. Mobile responsive — test at 380px viewport

---

## How I work — short version

- Direct and fast. I'll push back when something isn't right; push back when you think I'm wrong.
- Test only on dev (`spock.replit.dev`). I'll tell you when to publish to prod.
- **Paste sizes:** keep individual code chunks under ~3KB. Replit silently truncates larger pastes.
- If you find yourself proposing new DB columns or new endpoints — stop and ask. The plan should match the complexity of the actual request.

---

**Now: fork the snapshot, read the three files, and reply with your plan.** No code yet.

## END OF MESSAGE
