---
name: True Ownership mirror card gating
description: Owner-approved A1 order and grandfathering; new requirements supersede the historical transitive-relock rule.
---

# A1 mirror progression and preserved access

**Rule:** The owner's 2026-10-31 brief changes the intended order to Values →
Identity → Purpose → Vision while keeping the existing 2×2 hub grid. Internal
mirror identities and saved keys must not be renumbered to match display order.
Any meaningful draft, started exercise or claim preserves access to its mirror;
only untouched mirrors follow the new predecessor-completion chain. Values is
available after Reality Check completion (including a completed round) or for a
returning user.

**Why:** A1 starts with concrete clarity before abstract Purpose and Vision.
People already using the old order must never lose access to their work.
This explicitly supersedes the earlier instruction to re-lock completed
downstream mirrors transitively after an upstream reset.

**How to apply:** Treat this as the product requirement, not proof it is already
implemented. Separate a mirror's own saved-progress exemption from normal
predecessor gating, account for drafts rather than only claims, and preserve the
existing returning-user hydration safeguard. Retain all-four A1 completion and
A2 gating. Never rename stores or overwrite answers just to reorder the UI.

## Mirror 4 lives in its own localStorage key (gotcha)

M4 (Values) state does NOT live in `to_map` like the other mirrors — it has a
dedicated `to_mirror4_state_v1` key (Mirror 4 Build Plan v2). To read M4
progress in the A1 grid, call the `loadMirror4State()` helper, never
`loadDataSync(KEYS.map).mirror4` (that is always `undefined`).

- `m4Complete` = `loadMirror4State()?.claimed`
- `m4Started` = `loadMirror4State()?.status` is a string && !== `"not_started"`

M3 is the exception that proves the rule: M3 was never extracted into its own
module, so `to_map.mirror3.pickedGifts` / `to_map.mirror3.sealCompleted` is
correct for M3. Only M4 is relocated.

## Flag-gated routed views need BOTH an init guard and a runtime guard

A new routed `view` (e.g. the A2 Alignment Check hub `"a2m1"`) is persisted to
localStorage and restored on load. Two separate gates are required, because the
restore happens in the `view` useState *initializer* — before the component body
computes its derived completion state:

1. **Init-time restore guard** (in the `view` initializer) drops the persisted
   view when its *flag* is off (`saved.view === "a2m1" && !NEW_A2_FLAG → "grid"`).
   This only sees things loadable synchronously (URL flags, `loadDataSync`).
2. **Runtime effect guard** (in the body) drops the view when a *React-state*
   eligibility predicate is false — e.g. `a1Complete` (built from `progress`,
   `m2Progress`, `m3Complete`, `m4Complete`) is NOT available in the initializer.
   `useEffect(() => { if (view === "a2m1" && !a1Complete) setView("a2"); }, [view, a1Complete])`.

**Why:** without #2, "the hub is only reachable via the gated entry card" is
violated — a user who completed the prereq, entered the hub, then had the prereq
reset would restore straight back into the hub on reload. Don't try to replicate
state predicates synchronously in the initializer; guard at runtime instead.
**How to apply:** the gate's redirect target is the parent hub (`"a2"`) so the
user lands on the card that explains why it's locked, not a bare grid.

## Locked-but-actionable cards must NOT use the `is-locked` class

A card that is locked yet still offers a live CTA (e.g. the A2 hub's M1
Alignment Check card when A1 is incomplete — it shows a "Locked" badge but a
live "Go to All In It →" button that routes to the A1 hub) must use the
*neutral base* `na1-mirror-card` class, NOT `is-locked`.

**Why:** the CSS rule `.na1-mirror-card.is-locked .na1-mirror-card-action {
opacity:0.6 }` dims the action button, so an `is-locked` card with a live button
renders a half-faded CTA that reads as dead. Reserve `is-locked` (dashed border,
0.65 opacity, dimmed action) for genuinely dead/disabled cards (A2 M2/M3 before
their prereq is claimed). A "Locked" badge + neutral card + full-opacity gold
button is the pattern for locked cards that still route somewhere.
**How to apply:** the never-a-dead-button rule — a card is either Up next + live
"Begin …" (prereq met) or Locked + live "Go to … →" (prereq unmet); never
Up-next-with-a-disabled-button.
