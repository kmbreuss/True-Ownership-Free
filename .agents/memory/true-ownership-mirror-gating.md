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
