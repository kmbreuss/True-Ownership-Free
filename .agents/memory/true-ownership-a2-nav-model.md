---
name: A2 return-to-list nav model (M1/M2/M3)
description: How A2 mirror "Done → back to step list" navigation and step-completion status must work.
---

# A2 mirrors use a "return to step list" nav model

Each A2 mirror (M1 Align, M2 Time Audit, M3 Named Truth) presents a step-card
hub; tapping a card opens the room AT that step. Completing a step returns to the
hub (not auto-advance). Two rules make this correct:

## 1. The "Done" handler must advance the step pointer BEFORE closing

**Rule:** a "Done → Back to [Mirror]" handler must advance the canonical step
pointer (then close), never just close. M2/M3 do this in `onDone`
(`goToStep(currentStep+1); setRoomOpen(false)`); M1 does it in `onPrimary`
(`mutateM1` bump `currentStep`/`maxReached`, then `closeRoom()`), guarded so the
Claim step is untouched (its forward CTA lives in the claim body, not onPrimary).

**Why:** if Done only closes, the finished step never registers complete and the
next step stays locked — a fresh-run deadlock. This is the exact regression that
broke when auto-advance was replaced with return-to-list.

## 2. Hub completion status must read a monotonic signal, not the in-room pointer

**Rule:** the hub's per-step "complete" check must derive from data that only
moves forward — persisted per-step data predicates (M2/M3) or, when a mirror has
no per-step artifact, the persisted monotonic `maxReached` (M1). Never use
`currentStep` as the completion signal.

**Why:** in a continuous-room mirror the same `currentStep` both selects the
visible in-room screen AND gets seeded to the tapped step on entry — so
revisiting an earlier step *lowers* it, which would wrongly un-complete later
steps in the hub. `maxReached` is monotonic and survives remount, so revisits
don't regress the display. `claimed` always seals every step regardless.

**How to apply:** when adding/altering an A2 mirror step flow, wire Done to
advance-then-close, and keep the hub status reading data/`maxReached`/`claimed`.
