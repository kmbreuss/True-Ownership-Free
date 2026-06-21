---
name: True Ownership — A1 Purpose Declare re-seed
description: How the Declare step decides whether to seed from the Peel bottom or preserve the user's refined declaration.
---

# Declare seeds from the Peel bottom via a persisted comparison, not a one-shot flag

In A1 (All In It) · Mirror 1 (Purpose), the Declare step (`NewA1DeclareBody`)
shows a one-phrase field seeded from the deepest ("bottom") layer of The Peel,
which the user may then refine into `purpose_final`.

**Rule:** decide whether to re-seed by comparing the *current* Peel bottom
against a persisted `purpose_seededFrom` value on the map:
`bottomChanged = !!lastPeelLayer && lastPeelLayer !== seededFrom`. If changed,
seed the field with the new bottom; otherwise preserve the existing
`purpose_final`. Persist `purpose_seededFrom = lastPeelLayer` in lockstep with
every `purpose_final` write (claim + debounced auto-save), never on mere
mount/pre-fill.

**Why:** the original forward "Ready to Declare →" handoff relied on a volatile
one-shot `fromPeel` ref that did not reliably reach the body, so Declare showed a
stale prior-session declaration even after the user reached a new bottom (live
data: bottom "sdgf" vs orphaned final "I am lighthouse"). The naive
`if (!purpose_final) seed()` is also wrong — it makes the field effectively
write-once. A persisted bottom-vs-seededFrom comparison is path-independent and
self-heals orphaned declarations.

**How to apply:**
- Legacy/first-time records have no `purpose_seededFrom` (empty) → treated as
  changed → seeds from bottom. Intended healing; not a bug.
- Keep the silent-overwrite guard (`userEditedSinceMount = useRef(!bottomChanged)`
  + the `value === initialValueRef.current` early-return): a seeded value the
  user did NOT type must never be persisted unless they actually edit or claim,
  so viewing a pre-filled field and closing leaves stored data intact.
- Baseline `initialValueRef = bottomChanged ? existingFinal : initialValue` so a
  freshly-seeded bottom registers as dirty (button flips to claim/declare-again).
- The `fromPeel` prop is now superseded (left in the signature, no longer drives
  seeding; `noUnusedLocals` is false so it does not error). A future cleanup may
  remove it and the `pendingFromPeelRef`/`consumePendingFromPeel` wiring.
