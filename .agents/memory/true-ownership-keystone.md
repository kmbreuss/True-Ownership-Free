---
name: Mirror 4 keystone-per-value
description: Where the A1 Values keystone lives now, and which readers still point at the dead structure.
---

# Keystone-per-value (A1 Values / Mirror 4)

The keystone (the one behavior a user would "defend first" for a value) lives on
`M4Cluster.keystoneBehaviorId` — an id that must be one of the cluster's own
`behaviorIds` (which reference the admire/irks pools). Set via a ★ toggle on each
evidence chip in Name the Standards. Resolve its display text with
`m4BehaviorTextById(state, id)` (scans admire+irks).

**Why:** the ORIGINAL keystone lived in `state.operationalize[clusterId].keystoneId`
with its own separate `behaviors[]` list, set only in the Behaviors room. That room
was retired (removed from `M4_ROOMS`) so `operationalize` is never populated — any
reader of `operationalize.keystoneId` shows stale/empty data (this caused Claim to
display "SFDS" and raw irks as "keystones").

**How to apply:**
- New keystone readers must use `cluster.keystoneBehaviorId` + `m4BehaviorTextById`,
  never `operationalize.keystoneId`.
- `operationalize`/`keystoneId` are kept intentionally (migration safety) and are
  vestigial inside `NewA1M4BehaviorsBody` — leave them.
- Claim's `keystoneName` and Rank pressure-test's `keystoneNameFor` are repointed.
- STILL ON THE DEAD STRUCTURE (deliberately out of A1 scope): the A2 "Align With It"
  value-screen builder reads `op.behaviors`/`ov.keystoneId`. With `operationalize`
  empty it renders no value screens; a user with legacy operationalize data would see
  stale behaviors there. Repointing it to `cluster.behaviorIds`/`keystoneBehaviorId`
  would REVIVE those dead A2 screens — a behavioral change, so it was left for the
  owner to decide, not done silently.

Claim Beat 3 (the "what each one means" line) prints `userDefinition` only for
clusters that have one and omits the whole clause if none do — otherwise it renders
empty quotes. A sealed Claim renders BLACK via `--na1-seal*` tokens, not gold.
