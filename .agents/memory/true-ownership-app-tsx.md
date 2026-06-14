---
name: True Ownership App.tsx — giant single-file app
description: Working conventions for the ~50k+ line single-file React app and its ?newA1=1 surface gating.
---

# artifacts/true-ownership/src/App.tsx is one enormous file

The entire True Ownership app (auth gate, A1 grid, all four Mirrors, Entry Hall,
Framework, Spine) lives in a single `App.tsx` of tens of thousands of lines.

**Gotcha — the `read` tool reports a stale/wrong line count and "file length"
for this file** (e.g. claims ~27k when the file is ~55k). Trust `wc -l` + `sed`/
`rg` for line numbers, not `read`. Edit with `edit` using copied context, and
verify with fresh `rg`/`sed`, not `read` offsets.

**Why:** the file is large enough that the read tool's snapshot lags behind
edits, so its line numbers drift and lead you to edit the wrong place.

**How to apply:** when working in this file, locate anchors with `rg -n`,
read ranges with `sed -n 'A,Bp'`, and after edits re-`rg` to confirm.

## Pre-existing typecheck noise

`pnpm --filter @workspace/true-ownership run typecheck` emits ~1000+ pre-existing
TS7006/TS7031/TS7053 "implicitly any" errors plus junk from `App (copy)*.tsx`
files. These are unrelated to new work. To verify your change, filter errors to
your edited line ranges (`rg -o 'App.tsx\((\d+),' -r '$1' | awk` a range), don't
expect a clean run. Verify with `typecheck`, never `build` (build needs the
workflow-provided PORT/BASE_PATH and fails from bash).

## New experimental surfaces are gated behind `?newA1=1`

The Entry Hall / Framework / Spine / new A1 grid render only when the URL has
`?newA1=1`. The app is auth-gated (email+password, invite-only login screen), so
these surfaces cannot be screenshotted without credentials — the user walks them
with their own account.

**Flag convention:** feature flags here use `URLSearchParams.has("flag")`, NOT
`=== "1"`. So `?newA1` / `?newA1=anything` all enable. When adding a nested flag
(e.g. A2's `NEW_A2_FLAG = NEW_A1_FLAG && has("newA2")`), keep `.has()` to match
A1 — do not "harden" it to `=== "1"`. **Why:** consistency with the established
A1 convention was the explicit ruling; both behave identically for the user's
actual `?flag=1` usage, and diverging makes the surfaces inconsistent. Persisted
`view` values for a flag-gated surface must fall back to `"grid"` when the flag
is off (restore-eligibility check) so dropping the flag fully hides the surface.

## Video surfaces: data in videoConstants.ts, but UI is per-surface

`videoConstants.ts` (`VIDEOS` record, `isVideoReady`, `getVimeoEmbedUrl`) is the
single source of truth for all seven video surfaces' metadata. Only surfaces
with a `vimeoId` are "ready" and playable; the rest render a placeholder.

**Gotcha:** adding a `vimeoId`/`vimeoHash` to a surface in `videoConstants.ts`
does NOT auto-make it playable. Each surface needs its own player-capable card
component wired to its `VIDEOS[...]` entry. Only the Entry Hall (`EntryHallVideoCard`
in App.tsx) has that treatment so far. Future video ships must add the card UI to
the target surface (Framework / A1 hub / M1–M4), not just the data row.

**Vimeo embed:** private videos need the `?h=<hash>` unlock param or the embed
fails with "video unavailable". Never autoplay (browsers block it without a user
gesture anyway). Mobile (<600px) opens a full-screen portal overlay that pushes a
history entry so the Back button dismisses it; desktop expands inline.

## Spine nav (NewA1Spine) — current marker reuses `is-here`

The left spine's "you are here" marker is the existing `.na1-vertebra.is-here`
gold-halo class — there is NO separate `is-current` class; do not add one.
`claimed` (gold dot, `.is-claimed`, driven solely by `a1Complete`) and current
(`is-here`) are independent and can coexist on one vertebra; CSS order keeps the
halo on top of the dot. **Current follows the active `view`:** `view === "a2"` *or* `view === "a2m1"`
(the Alignment Check mirror hub) → Align lit, every other spine surface → All
In lit. Any future A2 mirror-hub views must be added to this Align mapping too. **Status-label precedence is
enforced in JS, not CSS:** "You are here" whenever current (even if also
claimed), "Claimed" only when claimed-and-not-current. Navigable vertebrae
render as `<button class="na1-vertebra is-nav">`; Align is gated on the A2 flag
only (reachable mid-A1), not on A1 completion; 03–05 are inert plain divs.
**Why:** the ruling was to reuse the spine's existing treatment and never add new
tokens/classes — a future "is-current" duplicate would diverge the two states.

## Breadcrumb "Entry Hall" link threading

The `onEntryHall` handler must be threaded through *both* a hub view component
(e.g. `NewA1M3HubView`) *and* its container (`NewA1M3Container`) — the container
declares the prop but you must also forward it into the hub, or the hub's
breadcrumb `<a onClick={onEntryHall}>` throws "onEntryHall is not defined".
