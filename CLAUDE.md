# CLAUDE.md — True Ownership: Architecture & Consistency Law

**Read this fully at the start of every session. It is the law. When in doubt, reuse what exists and match the live app — never invent.**

The #1 failure mode on this project is *drift*: a new session reinvents a card, guesses a color, or builds a component that already exists. Do not do that. Before building anything, do read-only recon of the existing code and copy its patterns exactly.

---

## 0. Golden rules (in priority order)

1. **Reuse, don't reinvent.** Every new mirror room reuses the existing room shell, card component, veil, claim ceremony, tokens, and helpers. If A1/A2/A3-People/A3-Environment already do it, clone that — do not write a new version.
2. **Recon before building.** Open `App.tsx` and read the most similar existing room end-to-end first. State what you're cloning before you write code.
3. **The live app wins over any doc.** If this file or a mockup disagrees with the running code's tokens/patterns, the running code is right — flag the difference, match the app.
4. **One room at a time.** Never bundle mirrors. The new A1/A2/A3 flows are the **default for everyone** — there are no `?newA…` flags any more. `?legacy=1` (testing only, this tab only, via sessionStorage; `?legacy=0` clears it) shows the old flows. New work that isn't ready for members must still be gated, but by its own switch, not the retired flags.
5. **Verify at localhost before "done."** The reviewer walks the room at `http://localhost:5173/` (no flags needed). Don't self-declare done.

---

## 1. What this app is (full-stack)

- **Front-end:** React + Vite + Tailwind, single large file at `artifacts/true-ownership/src/App.tsx` (~90k lines). Theme via `next-themes`. Light default + dark toggle.
- **Backend:** a separate `artifacts/api-server/` (Node) with real auth — owner/users, `bootstrapOwner.ts`, `authPassword.ts`, `auth.ts`, routes like `/api/auth/me`, `/api/userdata/...`.
- **Database:** Postgres (users, saved data). 
- **Auth model:** front-end gate in `App.tsx` renders `<SignInScreen/>` when not authenticated; `lib/auth-context.tsx` owns the auth state; owner-only Admin screen checks `user?.role === "owner"`.
- **Current data-safety posture:** *No real users yet.* We are free to reset/reseed the database while building. **This changes once real users exist** — at that point, never overwrite production user data on deploy. (Revisit this section then.)

---

## 2. Local dev (how to run it on a Mac)

This repo is pinned to Replit's **linux-x64** runtime. To run on macOS (arm64) we made **local-only** adjustments — keep them local, keep Replit's linux-x64 setup intact.

- **Start the dev server** (front-end): from project root:
  `export PATH="$HOME/.local/bin:$PATH"` then
  `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/true-ownership run dev`
  (Both `PORT` and `BASE_PATH` are mandatory — vite.config throws without them.)
- **pnpm workspace** (`catalog:` protocol). Use pnpm, not npm. pnpm installed via corepack into `~/.local/bin`.
- **macOS binaries:** `pnpm-workspace.yaml` `overrides` were pinned to linux-x64; four `darwin-arm64` exclusions were commented out locally so esbuild/rollup/tailwind-oxide/lightningcss resolve. Backups exist (`*.bak_pre_darwin`). **Do not let these local changes break Replit's linux-x64 build when syncing back.**
- **Dev auth bypass:** `lib/auth-context.tsx` has an `import.meta.env.DEV`-guarded block in `refresh()` that injects a fake owner (`role: "owner"`) so local dev skips the login and the Admin screen is reachable. **DEV-only — a production build strips it; the real login is untouched.** Leave it as-is unless told otherwise.
- **Backend not required for UI work:** `saveData` writes `localStorage` first, then best-effort PUTs to the server (fails silently with no backend). So rooms can be built and tested front-end-only. Stand up `api-server` + Postgres only when working on real login/sync/admin.
- **DEV reset/seed tooling (`DevResetBar`, local-only):** shown only when the Vite dev server is running **and** `VITE_LOCAL_DEV_TOOLS=true` is set in the untracked, never-uploaded `artifacts/true-ownership/.env.local` (restart the dev server after editing it). Replit's dev preview is also a Vite dev server, so `import.meta.env.DEV` alone is not enough — without the flag the bar stays hidden there. Lives at the top of the A1 and A3 hubs. Buttons: **"Reset all progress"** (clears A1/A2/A3 stores) · **"Seed A1+A2 complete"** (marks all A1 + A2 mirrors genuinely claimed, clears A3 — **this is how you get a testable A3**, since A3 requires A1+A2 complete per §6a) · **"A2 M1 → claim"** and **"A3 M6 → claim"** (seed that mirror's inputs filled but **unclaimed**, landing directly on its claim step, for inspecting claim ceremonies without re-walking). All DEV-guarded, never in production. Reuse them; don't rebuild. **Note:** A1 mirrors cannot be seeded to their claim screen — see §2c.

### 2a. State model notes (so seeds/gates aren't faked)

- **A1 completion is not a single flag.** `a1Complete = purposeComplete && visionComplete && m3Complete && m4Complete`. Purpose & Vision derive from **shared `KEYS.map` / `KEYS.done` stores** (not a simple `claimed` boolean); Identity (M3) and Values (M4) use `mirror3.claimed` / `mirror4.claimed`. Any seed must write the *real* derivation, or the gate reads it inconsistently.
- **A2 completion:** `a2Complete = a2.m1.claimed && a2.m2.claimed && a2.m3.claimed` (loaded via `loadA2State()`, read on the `[view, roomOpen]` cadence). All three A2 mirrors are genuinely claimable.
- **A3 store:** `to_a3_state_v1` — m1 People (name→rating), m2 Environment (`{name, kind:"habit"|"place", rating}`), plus each mirror's `claimed` flag. Extend this store for new mirrors; don't create a parallel one.

### 2c. Known technical debt

- **A1 uses a legacy architecture.** A1's Purpose (and the old Explore/Declare flow) predates the A2/A3 **claim container** pattern. Its claim screen is gated on **ephemeral React state (`ai.purpose`) that does NOT survive a reload** (only `purpose_draft` is persisted), it has **no gold-burst claim ceremony** and **no Re-claim**. Consequence: A1 mirrors **cannot be dev-seeded to their claim screen**, and A1 does not match the canonical claim standard (§5a).
- **Planned:** migrate A1's mirrors (Purpose, Vision, Identity, Values) onto the A2/A3 claim container so all disciplines share one ceremony. **Scope it before touching it** — A1 is shipped and heavily used; breaking it is costly. Do not attempt this migration as a side-effect of other work.

### 2d. Known pre-existing quirks (don't "fix" blindly)

- **Typecheck baseline:** the file has a **large pre-existing baseline of ~985 unrelated `TS7006` implicit-any errors scattered throughout** (it's a loosely-typed file; the ~56716–59403 `align_check_*`/`map_focus_text`/`align1_growth` cluster is just the visible tail, not the whole set). When building, **verify only the ranges you touched** (grep by identifier AND line-range) — do NOT try to clear the baseline, and don't assume a clean global typecheck.
- **A2 hero counter quirk:** the A2 hub hero reads "{n} of 3" but its counter only tallies m1+m2 (forgets m3). Cosmetic; `a2Complete` correctly requires all three. Fix the hero counter someday, but it's separate from gating.

### 2e. Saving to the member's account (new-flow data)

- The server only ever accepted seven keys (`map, voice, mapofme_origin, intake, phase, step, done`). New-flow answers lived **only in the browser**. They now sync through six **versioned** keys: `a1progress` (A1 exercise ticks + answers: `a1_ex1..4_done`, `a1_to_curq`, `a1_to_answers`, `a1_sym_*`, `a1_peel_draft`), `a2state` (`to_a2_state_v1`), `a3state` (`to_a3_state_v1`), `a4state` (`to_a4_state_v1`), `a5state` (`to_a5_state_v1`), `m4state` (`to_mirror4_state_v1`).
- Each is stored as `{ t, v }` (`t` = when it was last changed on the writing device, `v` = payload). **Rules (client `newFlowSync.ts` + server `lib/syncGuard.ts`, identical):** local has data & server none → push; server has data & this browser none → adopt; both → the **newer `t` wins and an older copy never replaces a newer one** (the server answers `409` with its copy, the client adopts it); a pristine `EMPTY_*` seed is never pushed or stamped; nothing is ever deleted. Reconciliation runs once in `ServerDataLoader`, **before** any screen renders.
- State modules announce writes with `notifyLocalChange(key)` (`syncHook.ts`); `saveData()` does it for `a1_*` keys. **A new persisted new-flow store must be added to `STORES` in `newFlowSync.ts` and to `SYNC_KEYS` in `syncGuard.ts`**, or it stays browser-only.
- `?syncstatus=1` shows, per store, what this browser vs. the account holds, plus **Export / Import** of this browser's answers (import never replaces data the browser already has, and keeps each store's own change time so it can never beat a newer account copy). The legacy items (`map`, `intake`, `voice`, `done`) carry no timestamps, so "account wins" would keep an older copy forever: after an import the panel shows file-vs-account sizes and offers a **member-confirmed** "Use the file's copy as my account copy", which first downloads a backup of the account's current copy. Moving answers from the Replit dev preview to the published site: dev and production are separate databases, so Export on the preview, then Import on the published address. The legacy `map/intake/voice/done` are pushed automatically on first open when the server has none; the server's copy always wins when both exist.
- Local dev has no backend, so nothing syncs from `localhost:5173` — use export/import to move those answers to the deployed address.

---

## 3. Design tokens — CONFIRMED against the live app. Use these; add nothing new.

**Fonts**
- **KB fonts, by role (use the tokens):** headings = **Tenor Sans** `--f-display`; body + reflective text = **Cormorant Garamond** `--f-body` (about +2px over the old DM Sans sizes; lining numerals); labels, eyebrows, chips, buttons, breadcrumbs = **Questrial** `--f-label`. Tenor Sans and Questrial are single-weight with no italic: never set bold or italic on them — carry emphasis with size, caps or colour. Cormorant has real 400/500/600 and italic 400/500. Legacy `--sans/--na1-sans` alias body, `--serif` aliases body, `--na1-serif` aliases display. Exception: Framework Phase 2 stays Cormorant headings + **Inter** body. Primary button = Spruce fill via `--btn` / `--btn-ink` (white in light, Ice in dark).
- **Readability tokens (mobile/desktop).** `--b-min` (Cormorant body floor: 18px desktop, 19px below 768px), `--b-bump` (+0 desktop, +3px phone), `--b-w` (body weight 400 desktop, 500 phone), `--b-lh` (line-height floor: none on desktop, 1.5 phone), `--l-min` (Questrial label floor: none on desktop, 13px phone), `--e-min` (tracked eyebrow caps floor: none on desktop, 12px phone). Cormorant body size = `max(var(--b-min), calc(Npx + var(--b-bump)))`; labels = `max(var(--l-min), Npx)`. The phone override sits on `:root, html[data-theme=…]` so it beats the theme blocks. Body text is Umber (`--na1-text`); grey is only for helper text and is never lighter than `#4F4D4E` (light) / `#B3BEC1` (dark). Single-weight fonts (Tenor, Questrial) MUST set `font-weight:400` explicitly or they inherit the 500 body weight and render fake-bold. Semantic accents (bronze, Spruce up-next, burgundy) keep their brand colours.
- **AG45 logo (business side).** Use the supplied AG45 marks only: `public/ag45-logo-navy.png` (navy letters, for light backgrounds — the Framework Phase 2 panel is cream in both themes, so it always takes navy) and `public/ag45-logo-cream.png` (cream letters, for dark backgrounds). `ag45-logo-cream-pdf.png` is a 600px copy of the cream mark for the Map of Me PDF header (navy bar). Keep the 1000:595 aspect ratio (set width, `height:auto`) and leave clear space around it. The old square `ag45_logo*.png` files are no longer referenced.
- Hub and room headings are Tenor Sans (`--f-display`); reflective quotes and seals are Cormorant italic. Introduce no other family.

**Colors / CSS variables** (use the variables, not raw hex, wherever they exist)
- **KB brand palette (light is the default theme).** Ice `#F5F5F7` · Umber `#353334` · Spruce `#036360` · Deepwater `#012325` · Bronze `#A5875E` · Powder `#B0CCDA` · Burgundy `#7A2E2E`. Variable names are unchanged from the AG45 build; only values moved.
- **Buttons** = Spruce (`--btn`, `--btn-ink`, hairline `--btn-edge` in dark). **Honored moments** (claim seal, ★, claimed spine/dots, pips) = Bronze `--gold` (`#A5875E`). **Small bronze TEXT** = `--gold-text` (`#735F43` light / `#C4A87F` dark) — never `--gold` for small text. Text on a Bronze fill = `--on-gold` (Deepwater).
- **Powder** `--cyan` (`#B0CCDA`) is for fills and borders only; Powder-family TEXT = `--cyan-text` (`#3C6B82` light / Powder dark). (No longer the up-next accent — that is Spruce, §4.)
- **Burgundy** `--burgundy` = cost: `#7A2E2E` (light) / `#C29C9C` (dark text variant, `--burgundy-text`; `--burgundy` stays `#B68C8C` for lines); a solid burgundy fill uses `--burgundy-fill` (`#7A2E2E`).
- **Surfaces** (`--na1-bg`, `-soft`, `-card`, `-input`, `-text`, `-text-sec`, `-text-mute`, `-border`): light Ice / `#EDEDEF` / white · Umber · `#4F4D4E` · `#4F4D4E` · `#DADADC` (secondary helper text is darkened Umber-grey; `-text-mute` now equals `-text-sec` in light); dark Deepwater / `#0B2B2D` / `#123234` · Ice · `#C9D1D3` · `#B3BEC1` · `#024645`. Legacy dark-only screens (`--bg` family) map to Deepwater with no light version.
- **Categorical:** lens (Time = Bronze, Wealth = Spruce, Self = Powder), values clusters `--c1/2/3` and the five pillars (`--pillar-*`) all derive from the palette via CSS variables. Never hardcode a hex for these; use the token (and never concatenate a hex alpha onto a `var()`).
- **The Framework page is the one exception to the tokens:** Phase 1 (Own It) is KB (Spruce→Deepwater glow, cream `#EFE6D6`, bronze `#A5875E` dots, `#CDB48E` small labels, Tenor Sans, KB signature) and Phase 2 (Build It) is frozen AG45 Boardroom (cream `#F9F6EE`, navy `#1A2A44`, gold `#C9A24B` for dots/rules, `#7F6528` for small gold text and deliverable pills, slate `#2C3E50`, Cormorant Garamond headings + Inter body, AG45 logo). Both skins are fixed literals in `.na1-fw[data-phase=…]` and look the same in light and dark.
- Burgundy-line / tints are `--burgundy-soft|line|glow`; Bronze tints are `--gold-soft|warm|line|glow`.
- Radii: `--na1-radius` `10px`, `--na1-radius-xl` `18px`. Rail width `--rail-w` `220px`.
- **Semantic (locked):** Advocate = gold · Neutral = muted grey · Anchor = burgundy.

**User-facing energy labels (LOCKED — use verbatim, don't reinvent synonyms):**
- Advocate → **"Close to you"**
- Neutral → **"Just there"**
- Anchor → **"Weight"** (or "Weighing on you")
These are the words the user reads (Energy Map stats/chips, and anywhere the three categories are shown). The internal rating values stay `advocate|neutral|anchor` and the colors stay gold/grey/burgundy — only the *display* uses these labels. **Energy Map (a see-it room) NAMES the weight; The Move DECIDES what to do about it** — so keep "Weight" as a state description here, and reserve action/decision language ("handle it", "the move") for The Move (M6). Do not drift back to "advocate/neutral/anchor" in user-facing copy, and do not invent alternates like "drifting" or "still carrying".

**Mobile** — reuse existing responsive classes. Breakpoints: **768 / 640 / 600**. Rail (`.na1-spine`, 220px) is fixed ≥768px and collapses below; mirror-card grid (`.na1-mirror-grid`) → 1 column ≤600px; room phase layouts (`.na1-phase-body`) → 1 column ≤640px; heroes shrink ≤767px. Introduce no new breakpoints.

---

## 4. Mirror card states (Locked / Up next / Complete)

Exactly one of three states per card. Reuse the existing card component and the shared pips helper — do not re-implement.

- **Locked:** dashed border at ~0.65 opacity, muted number/tag, empty pips (no "N of N"), no CTA, status = `Unlocks after [prev mirror]`.
- **Up next:** the `.na1-mirror-card.is-current` / `.is-vision-up-next` treatment = **Spruce** (`--spruce-line` border, `--spruce-soft` top gradient, `--spruce-glow`, number + status text `--spruce-text`: `#036360` light / `#7DB0B7` dark). The same Spruce marks the current exercise row (`.na1-ex-row.is-current`, gold and cyan tones) and the flash ring. Bronze is reserved for claimed / complete. CTA = `Begin [Mirror] →` (or `Continue [Mirror] →`). No "N of N" count.
- **Complete:** gold accents, tag `Complete`, status `Claimed.` (Cormorant italic), pips full **with "N of N"**, CTA `Review [Mirror] →` (ghost).
- **"N of N" appears only when Complete.** One CTA per card. Only one card is Up next at a time.

**Card display precedence (LOCKED rules — learned the hard way):**
- **Claimed always overrides Locked on display.** If a card is claimed/complete, its status, copy, AND button all show the Complete state ("Claimed." / "Review →") — never the locked "finish X first" copy or a route-back button, even if a prerequisite was later reset. Gate all locked messaging/buttons on `!claimed`.
- **Hub-entry gates must behave identically across disciplines.** The A1/A2/A3 hub-entry cards share one pattern (locked = live gold route-back button, never a dead control; claimed overrides locked). When you fix a gating or display bug on one, fix it on all where it appears — do not leave A2 broken while fixing A3, or the gates drift.
- **Spine vertebra completion is uniform.** Every discipline vertebra in the left spine drives its completion circle from the same "all mirrors claimed" signal (`a1Complete` / `a2Complete` / `a3Complete` / …), defined identically. **Never hardcode `claimed: false/true`** on a vertebra. Disciplines with no content yet (A4/A5) stay `false` honestly — do not fake a flag — until real mirrors exist behind them.

**Unlocking:** claiming mirror N flips it to Complete and flips N+1 Locked→Up next (with a flash) and increments hub progress. Drive unlocks via **unlock booleans chained off the previous card's unlock — NOT persisted completion** (persisting completion leaks downstream cards after a reset). A reset re-locks everything except the first mirror.

---

## 5. Room stage model (how a mirror behaves inside)

Reuse the A2 room shell (top header + 220px left section sidebar + VOICE dropdown + room content).

- **Veil fires on every entry**, including re-entries and Review revisits.
- Display-only **phase stepper** (e.g. "Name them → Rate them").
- **One primary button per stage:** `Continue →` (disabled until the stage's requirement is met) → on the last stage `Claim →` → after claim `Continue to [next mirror] →` (closes the room + applies completion).
- `← Back` link on every stage past the first; `×` closes to the hub anytime.
- **Review** re-enters a completed mirror at stage 1 with working Back/Next and **no re-claim**.
- **Claim ceremony:** validate → seal message (with a **gentler variant** when the result is thin, e.g. advocates = 0 or anchors > advocates) → `Claim →` → gold burst → card flips to Complete → next unlocks + flash → progress +1. Seal is italic serif, gold, signed "— Katherine".

### 5a. Claim ceremony standard (CANONICAL — modelled on A2 Mirror 1. Every mirror matches this.)

**Pre-claim:** summary of what they produced → seal (italic serif, gold box, signed "— Katherine"; gentler variant when the result is thin) → single primary button **`Claim →`** (never "Claim this →").

**On claim:** **gold burst** animation (`.na1-gold-burst`, ~2000ms) → the mirror's card flips to **Complete** ("Claimed.", pips full, "N of N") → the **next** mirror flips to **Up next** (cyan) with a **flash** → hub progress increments → when it's the last mirror of a discipline, the **spine vertebra fills** (via `aNComplete`).

**Post-claim (all of these, matching A2 M1):**
- The eyebrow gains a **★** (e.g. `A3 · MIRROR 6 · CLAIM ★`).
- The seal remains, in its gold box.
- A **Re-claim path**: a prompt line + **`↺ Re-claim`** button. **Mechanic (Option B, uniform everywhere — no in-place re-commit):** ↺ **un-seals** (`claimed → false`, the card flips back to in-progress) and **returns the user to Step 1** so they can change their inputs, then they re-walk to `Claim →` to re-seal. Energy Map is not special-cased — its Step 1 is the map view. Re-claim notes are per-mirror but parallel in form: People "Changed how someone sits with you? Re-rate and re-claim." · Environment "…a habit or place…" · Thoughts "Hear that voice differently now? Re-shape and re-claim." · Energy Map "Want to look again? Re-open the map and re-claim." · Board "Changed who's at your table? Re-seat and re-claim." · The Move "Changed your mind? Re-choose your move." · A2 M1 "Changed your ratings? Re-commit your alignment."
- **Closing a room always returns to the discipline hub** (A3 hub for A3 mirrors, A2 hub for A2 mirrors) — never to a mirror's own overview.
- A forward CTA that **names the next real destination** — `Continue to [next mirror] →`, or when the mirror completes a discipline, `Continue to A4 →` (routing to the hub). Never a dead or greyed button.

**A room without a working Claim → burst → Complete → Re-claim is NOT done.**

### 5b. Audit mirrors take no action input (LOCKED)

The audit mirrors (People, Environment, Thoughts) **only see and rate**. They must NOT contain takeaway fields, action fields, "what will you change" prompts, or any planning input. **Choosing** what to release/reframe happens in **The Move (M6)**; **acting** on it happens in **A4**. (A "TAKEAWAY · OPTIONAL" box had crept into the Environment claim — removed. Don't reintroduce this pattern anywhere.)

---

## 6. A3 "Advocate For It" — the six mirrors

Order: **People (M1) · Environment (M2) · Thoughts (M3) · Energy Map (M4) · The Board (M5) · The Move (M6)** → then My Map of Me™.

**Status:** M1 People ✅ · M2 Environment ✅ · M3 Thoughts ✅ · M4 Energy Map ✅ · M5 The Board ✅ · M6 The Move ✅ — **A3 feature-complete, pending final walkthrough.**

- People / Environment / Thoughts are pure "see it" audits: rate **Advocate / Neutral / Anchor** only (no category dropdowns, no per-person action — action lives in The Move).
- **Thoughts (M3):** Listen phase is **one moment at a time** (not a scrolling list) — earlier moments show `Next →`; only the **last** moment offers `Shape what you found →`, so users can't skip the pacing. "+ Add your own" appears only on the last moment. Shape = mark each thought Coach/Critic, Critics get a reframe, then name the voice (now) + the best-friend voice. Gentler seal when `critics > coaches || (critics > 0 && reframed === 0)`.
- **Energy Map (M4):** read-only synthesis — aggregates People + Environment + Thoughts (**coach→advocate, critic→anchor**); stores only `{claimed, claimedAt}`. Bullseye SVG (you at centre; advocates inner/gold, neutral middle, anchors outer/burgundy). **Percentages are integers summing to exactly 100 (largest-remainder); 0/0/0 when empty.** Detail-on-tap panel sits at the **TOP** (never below the fold). Stats show as a **single horizontal line** ("8 close · 50%  2 just there · 13%  6 weight · 37%") — count and % word-separated so they can't misread as decimals; **no collapse toggle**. On the Claim screen, the three chips reveal their item list on **hover (desktop) / tap (mobile)** — plain labels only (name, habit, place, or thought text), no icons or ratings.
- **Data:** A3-namespaced store (`to_a3_state_v1`). People = name→rating. Environment items = `{name, kind:"habit"|"place", rating}`. These feed Energy Map and The Move later.
- **Phase hand-offs (resolved):** a saved phase of `a2`/`a3` mounts the new A2/A3 hub (`A2`/`A3` short-circuit into `NewA1View` with `initialView`), and a saved `done` lands on the new Entry Hall. Old-flow answers stay in storage untouched but the new flow does not read them (see §2e).

### 6a. Sequential gating (LOCKED rule)

The 5A spine is sequential. Hub *reachability* is intentionally open (looking ahead is fine — spine vertebrae gate on the feature flag only). **Exercise *entry* is gated on completion:**
- `a1Complete = purpose && vision && identity && values` (all A1 mirrors claimed) — already defined (~`App.tsx:40806`).
- `a2Complete` = all of A2's mirrors claimed, defined the same way as `a1Complete`.
- **A3 entry requires BOTH:** gate `peopleUnlocked` on `a1Complete && a2Complete` (do NOT hardcode `peopleUnlocked = true`). When locked, the People card shows Locked and its button routes back to the unfinished discipline (A2, or A1 if A1 isn't done) — mirroring the A2 card's locked pattern and the route-guard belt-and-suspenders.
- A3's later mirrors chain off the previous unlock (`envUnlocked = peopleUnlocked && m1Claimed`, etc.). Keep that.

**Caveat — this gating is client-side only (UX affordance, not a security boundary).** Completion flags live in localStorage/React state; anyone editing them could walk through. Acceptable now (no real users). **Once there are real users with real data, the api-server must enforce discipline/data access server-side** — the front-end lock is not sufficient. (Revisit with the data-safety posture in §1.)

**The mockup `A3_Full_Mockup_v3.html` is the source of truth for A3 structure, copy, and flow.** Live app wins for exact tokens/pixels.

---

## 6b. A4 "Act On It" — three mirrors, one promise each (A4-1 + A4-2 built)

App purpose: **Build self-trust. Recognize yourself. Build a life around you.** North star: **Align life to you, not you to life.** A4 builds self-trust — one kept promise at a time. A4 is the *inside* work (the gap, the promise, the 1 year, what's most likely to stop me and what I'll do); A5 owns plan, supports, rhythm.

**Status:** hub + Map of Me ✅ · M1 Self ✅ · M2 Time ✅ · M3 Wealth ✅ · My Promises + A4 claim + "Continue to A5 →" ✅ — **A4 feature-complete.** After the A4 claim the hub shows a live A5 card ("Begin A5 →"); A4's last seal ("Continue to A5 →") lands on the A5 hub.

- **Unlock:** A4 Self opens when `a3Complete` (all six A3 mirrors claimed). Mirrors chain Self → Time → Wealth off the previous claim (a claimed card stays Complete even if an earlier one is later un-sealed, same as A3). **My Promises** opens when all three are claimed and is not a fourth mirror (the hub still counts "N of 3"). A3's last seal ("Continue to A4 →") lands on the A4 hub. Routes: `a4` (hub), `a4m1` Self (`self`), `a4m2` Time (`time`), `a4m3` Wealth (`wealth`), `a4p` My Promises (`promises`); each is guarded by its unlock. The route validator accepts room overlays for every `a3m*`/`a4m*` view so a refresh mid-room restores the room and screen with no veil.
- **State:** `to_a4_state_v1` (`a4Constants.ts`), synced as `a4state`. Per mirror: `{ step 0–5, picked (gapId|"own"), own, gap (snapshot of the picked gap), every, prove, will, when, sayNo (Time/Wealth only), year, gives, stop, plan, sure ("yes"|"not-yet"), claimed, claimedAt }`, plus `wealth.moneyCheck {0..4: Always|Sometimes|Rarely}` and `a4 {claimed, claimedAt}`. `claimed` alone drives card completion. **A5 reads `will/when`, `year`, `gives`, `stop`, `plan` (and `sayNo` for Time/Wealth) — keep those names stable.**
- **Six screens, one per step (desktop AND phone), never a long scroll:** See it 1/2 (their own words side by side) · See it 2/2 (gap cards, 2×2 / 1 col, "Or choose your own →") · Name it ("Every time I ___, I prove to myself ___.") · Promise it 1/3 ("your why" strip + "I will ___ when ___.") · Promise it 2/3 ("A year from now…" + "Keeping this gives me…") · Promise it 3/3 (stop + plan + "100% sure?" — *Not yet* → "Make it smaller until the answer is yes…"; claim enabled only on Yes + every field). Stepper = See it · Name it · Promise it (display only: done = filled, current = ring) + one pip per screen.
- **Screen 1 on a phone must fit one screen (no scrolling inside the card).** Self (What I value | Who I am) and Wealth (My future | Money today · n/5) show their two sides as tabs below 768px, side by side above it; Time is one compact list. Keep that rule for any new mirror screen.
- **Time:** screen 1 = their A2 priorities in rank order as bars out of awake hours (burgundy where hours don't match the rank; a priority gets burgundy if it has zero hours or a LOWER-ranked one has more), a "No priority" row, tap a row for its activities (Lifts me / Drains me). Gaps (`buildTimeGaps`): priority vs. hours · something that matters with zero hours (A2 "missing") · an A3 Weight habit that still takes hours · The Move person with no time. **Wealth:** screen 1 = their A1 wealth vision (Building · Cash flow · Stability) + a fresh five-question money check (Always/Sometimes/Rarely, all five required). Gaps (`buildWealthGaps`): each vision part vs. a Rarely/Sometimes answer · the Finances priority vs. its hours · the top value vs. "My spending matches what I value." Time and Wealth add "To make room, I'll say no to…" chips (own draining/no-priority activities; Wealth adds Weight habits) + "+ Write my own", and `sayNo` is required.
- **Gap cards are built only from real answers** (`buildSelfGaps`): keystone behavior vs. A3 Critic thought · gift rated ≤ Slipping in A2 · keystone behavior vs. A3 Environment *Weight* · Purpose vs. A2 purpose rating < 9. A missing source is dropped (never a placeholder); fewer than 2 gaps → "choose your own" leads.
- **Reused, never re-authored:** `NA1_VEIL_TIMING` + `.na1-veil` (room ENTRY only, never on resume), `na1-gold-burst` claim (no replay on re-entry), `.na1-a2m1-seal` seal personalised with `resolveDisplayName()`, the A2/A3 room shell + stepper classes, the shared mirror card (LOCKED · UP NEXT · COMPLETE; never "Sealed"). Map of Me (hub) is a fixed-brand Spruce→#024845→Deepwater panel with cream text and the KB signature.

## 6c. A5 "Accountable To It" — Keeping My Word (Ship A5-1 built)

**A4 = the inside work. A5 = the outside work: the plan, the people and places that hold you, and the rhythm that makes it stick.** Self-trust is built by keeping your word, checked weekly. Horizon ladder: 10 years (A1) → **1 year + promise (A4)** → **90 days + this week (A5)**.

**Status:** hub + Keeping My Word (5 screens) + claim ✅ (Ship A5-1). ⏳ Ship A5-2: the weekly 2-minute check-in, the 90-day look-back, and the Entry Hall's "This week" lead once all five As are claimed. `checkins[]` and `reset90` already exist in the store (empty) — keep those names.

- **Unlock / routes:** A5 opens when `a4.claimed`. Views `a5` (hub) and `a5m1` (room id `keeping`); a stale `a5m1` without the A4 claim bounces to the hub. Spine A5 = You are here / Claimed.
- **State** `to_a5_state_v1` (`a5Constants.ts`, synced as `a5state`, listed "A5 · Accountable To It"): `{ step 0–4, plans{self|time|wealth}{ninety, ninetyBy ISO, week, days[], time}, supports{…}{person{name,from board|close|own}, place{…}, system{name,own}}, rhythm{checkinDay/Time, personDay, reminderDay/Time, channel:"app", reminderDismissedAt}, claimed, claimedAt, checkins[], reset90 }`. `claimed` is the sole completion driver. `ninetyBy` = today + 90 and is fixed at the claim.
- **Five screens (one at a time, all fit one phone screen at 812px):** 1 Your promises from A4 · 2 Plan (Self|Time|Wealth tabs; 1 YEAR · A4 read-only → 90 DAYS by {date} → THIS WEEK prefilled from A4 `will`, days/time prefilled from `when`) · 3 Supports (tabs; one person [A3 Board + "Close to you" + "+ Someone else"], one place [A3 places that lift + "+ Somewhere else"], one system [Calendar block · Phone reminder · Automatic transfer · App weekly check-in · "+ My own system"]; the promise's default system first and preselected) · 4 Rhythm (weekly check-in Sun 7:00 pm, people hear from you Fri, reminder Mon 6:45 am, channel **In the app only**) · 5 Claim → seal "Keeping My Word." + What happens next. Continue on Plan/Supports needs all three tabs done (✓).
- **Honest scope:** no Email/Text options exist until they work. The in-app reminder (their "Keeping this gives me…" words + the this-week action, rotating through the three promises) appears on the Entry Hall and A5 hub from the reminder day/time until "Got it", then returns next week. "Send to {person} →" opens the phone's share sheet with an editable note; on desktop it copies the note with a toast. **The app never sends anything itself.**

## 7. Build workflow (every room)

1. **Recon:** read `CLAUDE.md` (this file), then read the existing **People** and **Environment** rooms in `App.tsx`, then read the relevant section of `A3_Full_Mockup_v3.html`. State what you're cloning.
2. **Build** the room by cloning the existing pattern; copy verbatim from the mockup; reuse tokens/components/helpers; flag-gated; introduce no new fonts/colors/breakpoints.
3. **Typecheck** the touched ranges only (the file has a large unrelated error baseline — verify in-range).
4. **Hand to reviewer** to walk at localhost. Don't self-verify in a loop.

## 8. Deploy back to Replit (later)

Replit stays the host/deploy target. Bring back the **`App.tsx`** room work (and any real backend changes when we do those). **Keep `pnpm-workspace.yaml` overrides linux-x64 for Replit** — don't let local macOS/dev-bypass changes break Replit's build. Deploy/Publish from Replit as normal.
