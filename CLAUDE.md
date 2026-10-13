# CLAUDE.md — True Ownership: Architecture & Consistency Law

**Read this fully at the start of every session. It is the law. When in doubt, reuse what exists and match the live app — never invent.**

The #1 failure mode on this project is *drift*: a new session reinvents a card, guesses a color, or builds a component that already exists. Do not do that. Before building anything, do read-only recon of the existing code and copy its patterns exactly.

---

## 0. Golden rules (in priority order)

1. **Reuse, don't reinvent.** Every new mirror room reuses the existing room shell, card component, veil, claim ceremony, tokens, and helpers. If A1/A2/A3-People/A3-Environment already do it, clone that — do not write a new version.
2. **Recon before building.** Open `App.tsx` and read the most similar existing room end-to-end first. State what you're cloning before you write code.
3. **The live app wins over any doc.** If this file or a mockup disagrees with the running code's tokens/patterns, the running code is right — flag the difference, match the app.
4. **One room at a time. Flag-gated.** Never bundle mirrors. Everything new stays behind its `?newA3=1`-style flag; the old surfaces stay untouched.
5. **Verify at localhost before "done."** The reviewer walks the room at `http://localhost:5173/?newA1=1&newA2=1&newA3=1`. Don't self-declare done.

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

---

## 3. Design tokens — CONFIRMED against the live app. Use these; add nothing new.

**Fonts**
- Body / labels / buttons / eyebrows / sidebar = **DM Sans**. Button text color `#1A1407`.
- **Hub (mirror-card grid + hub hero) = Georgia** (e.g. card title Georgia 21px/600 `#2A2620`; "01" Georgia italic gold; hero Georgia 36px/600). This is `--na1-serif`.
- **Section rooms (heroes/quotes inside a mirror) = Cormorant Garamond** = `--serif`.
- Rule: build the **hub** like A1 (Georgia); build the **rooms** like A2 (Cormorant). Introduce no other serif.

**Colors / CSS variables** (use the variables, not raw hex, wherever they exist)
- Gold `--gold` `#b8892f` (light) / `#c9a84c` (dark). Light bg `#f5f3ef`; dark bg `#0d1b2e`; `--border` `#1e3554`.
- Burgundy `#7A2E2E` (light) / `#A03B3B` (dark).
- Cyan `--cyan` `#6aa9b8` (light) / `#4a8a99` (dark) — the "current / up next" accent (see §4).
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
- **Up next:** the `.na1-mirror-card.is-current` treatment = **cyan** (`--cyan`) border, soft top gradient, glow, number color, tag color. CTA = `Begin [Mirror] →` (or `Continue [Mirror] →`). No "N of N" count.
- **Complete:** gold accents, tag `Complete`, status `Claimed.` (Georgia italic), pips full **with "N of N"**, CTA `Review [Mirror] →` (ghost).
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
- **Known bug (fix pending, "#48"):** `?phase=a3` routes to the OLD A3; the new hub only mounts at the base flag URL. Fix = short-circuit the old A3 entry point when `na3_optin` is set so `phase=a3` and the A3 pill/spine both mount the new hub (like A1/A2). Don't rebuild the hub — it's correct; only the routing is wrong.

### 6a. Sequential gating (LOCKED rule)

The 5A spine is sequential. Hub *reachability* is intentionally open (looking ahead is fine — spine vertebrae gate on the feature flag only). **Exercise *entry* is gated on completion:**
- `a1Complete = purpose && vision && identity && values` (all A1 mirrors claimed) — already defined (~`App.tsx:40806`).
- `a2Complete` = all of A2's mirrors claimed, defined the same way as `a1Complete`.
- **A3 entry requires BOTH:** gate `peopleUnlocked` on `a1Complete && a2Complete` (do NOT hardcode `peopleUnlocked = true`). When locked, the People card shows Locked and its button routes back to the unfinished discipline (A2, or A1 if A1 isn't done) — mirroring the A2 card's locked pattern and the route-guard belt-and-suspenders.
- A3's later mirrors chain off the previous unlock (`envUnlocked = peopleUnlocked && m1Claimed`, etc.). Keep that.

**Caveat — this gating is client-side only (UX affordance, not a security boundary).** Completion flags live in localStorage/React state; anyone editing them could walk through. Acceptable now (no real users). **Once there are real users with real data, the api-server must enforce discipline/data access server-side** — the front-end lock is not sufficient. (Revisit with the data-safety posture in §1.)

**The mockup `A3_Full_Mockup_v3.html` is the source of truth for A3 structure, copy, and flow.** Live app wins for exact tokens/pixels.

---

## 7. Build workflow (every room)

1. **Recon:** read `CLAUDE.md` (this file), then read the existing **People** and **Environment** rooms in `App.tsx`, then read the relevant section of `A3_Full_Mockup_v3.html`. State what you're cloning.
2. **Build** the room by cloning the existing pattern; copy verbatim from the mockup; reuse tokens/components/helpers; flag-gated; introduce no new fonts/colors/breakpoints.
3. **Typecheck** the touched ranges only (the file has a large unrelated error baseline — verify in-range).
4. **Hand to reviewer** to walk at localhost. Don't self-verify in a loop.

## 8. Deploy back to Replit (later)

Replit stays the host/deploy target. Bring back the **`App.tsx`** room work (and any real backend changes when we do those). **Keep `pnpm-workspace.yaml` overrides linux-x64 for Replit** — don't let local macOS/dev-bypass changes break Replit's build. Deploy/Publish from Replit as normal.
