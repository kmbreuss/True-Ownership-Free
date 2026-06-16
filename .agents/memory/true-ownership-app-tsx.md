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

## Room-container resume pattern (M3/M4/A2M1) + StrictMode is OFF

Room containers (M3, M4, A2.2 Alignment Check) resume an open room after a
refresh by seeding `roomOpen`/`openRoom` in the `useState` *initializer* from
`initialRoomKey`, NOT in a mount `useEffect`. A mount effect would let the
`onRoomChange` reporter fire `null` first and clear the persisted overlay route
before resume runs.
**Why:** the parent consumes the saved overlay roomId as a one-shot
(`initial*RoomKeyRef.current` read+nulled during render). React StrictMode is
intentionally NOT enabled in this app, so that render-time ref consumption is
safe (no double render). If StrictMode is ever turned on, every room
container's one-shot resume breaks — revisit then, don't pre-emptively rewrite.

## Veil backdrop: A2 mirror containers must render inside `.na1-root`

`NewA1Veil` paints a translucent cream wash (`rgba(245,243,239,0.55)` in light
theme). It is `position:fixed`, so its colour depends on whatever it composites
over. A1 rooms render inside `.na1-root` (cream `#f5f3ef`) → the veil reads warm.
The A2 mirror room containers (`NewA2M2Container`, `NewA2M3Container`) originally
returned a bare `<>` fragment; the cream `.na1-room-overlay` only mounts once the
room *opens* (hold phase). So during the veil's *rising* phase (intro hidden,
room not yet open) the veil composited over the dark page body `rgb(8,15,28)` and
read cold grey (~`#8a9099`), and the warm wash was only briefly visible.

**Fix/rule:** every A2 mirror container's top-level return must be
`<div className="na1-root">…</div>`, mirroring A1, so the cream backdrop is
present for the full veil lifecycle. `NewA2MirrorHubView` already self-wraps in
`.na1-root`, so the wrapper only adds the backdrop during the rising phase and
the resulting nested `.na1-root` during the intro is harmless (cream-on-cream).
**Why:** this single change fixes BOTH the grey colour and the "too short" feel
(warm veil now visible across rising+hold+falling ≈2s) without touching shared
`NA1_VEIL_TIMING` — A1 and A2 share that timing already, so no constant edit.

**Filtered-typecheck caveat:** `pnpm --filter @workspace/true-ownership run
typecheck` runs `tsc -p` WITHOUT building libs first, so it reports ~6000 errors
(mostly unresolved `@workspace/*` imports + the implicit-any noise). That's the
expected baseline, not a regression. To verify a JSX edit, grep the error list
for TS17002/structural errors (must be 0) and for your edited line ranges (must
be 0) rather than expecting a clean run.

## Container hook/derived-state ordering vs the resume-seed `roomOpen`

In the per-Mirror room containers (e.g. `NewA2M1Container`) `roomOpen` is a
`useState` seeded from `initialRoomKey` partway down the component body (M3/M4
resume pattern). Any derived state or `useMemo`/`useCallback` that reads
`roomOpen` (e.g. a model built only when the room is open) MUST be declared
AFTER that `useState` line, not up near `mutateM1` at the top.

**Why:** placing it earlier compiles past a glance but throws at runtime
`Cannot access 'roomOpen' before initialization` (TDZ) and tsc also flags
TS2448/TS2454. The whole container then crashes with a cascade of
"Invalid hook call" warnings (React unwinding a mid-render throw).

**How to apply:** add new room-model memos/handlers immediately after the
`const [roomOpen, setRoomOpen] = useState(...)` block, before the veil/timer
hooks and before `onBack`/`onContinue`.
