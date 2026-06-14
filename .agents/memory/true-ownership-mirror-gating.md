---
name: True Ownership mirror card gating
description: How the A1-hub Mirror cards (Purpose/Vision/Identity/Values) cascade unlock state, and the relock trap to avoid.
---

# A1 Mirror card cascading gate

The four A1-hub Mirror cards each resolve to one of four states — Locked → Up
next → In progress → Complete — with a cascading unlock chain: M1 (Purpose) is
always unlocked; M2 (Vision) unlocks once M1 is complete; M3 (Identity) once M2
is complete; M4 (Values) once M3 is complete.

**Rule:** an unlock boolean must be `priorUnlocked && priorComplete`, never just
`priorComplete`.

**Why:** completion flags are persisted absolute values (e.g. `vision.complete`,
`mirror3.sealCompleted`, `mirror4.claimed`). If a user finishes a downstream
mirror and then an upstream mirror is reset, the persisted downstream completion
would otherwise leak an *active* card while its predecessor shows Locked. Chaining
through the predecessor's `*Unlocked` makes the whole chain re-lock transitively.

**How to apply:** in `NewA1Grid` (artifacts/true-ownership/src/App.tsx), keep
`identityUnlocked = visionUnlocked && visionComplete` and
`valuesUnlocked = identityUnlocked && identityComplete`. CTA wording is Option B
(Begin / Continue / Review {Mirror} →) with a disabled "Unlocks after {Prior}"
button on locked cards. Whole feature ships under the `?newA1=1` surface.

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
