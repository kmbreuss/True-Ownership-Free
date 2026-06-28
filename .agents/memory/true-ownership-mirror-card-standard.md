---
name: Mirror card progress data shape
description: What per-card progress signals the A1/A2 hub mirror cards actually have, so pip "truthfulness" decisions stay consistent.
---

# Mirror card progress signals (True Ownership hubs)

The 7 hub mirror cards share one display standard (tag = Locked/Up next/Complete,
pips on every card, "N of N" caption only when complete, status line, single CTA,
"[N] exercises · [N] videos" footer). Pip fill is driven by `MirrorPips({done,total})`
in App.tsx, which shows the count only when `done === total`.

The available progress data differs per card — this is the non-obvious part:

- **A1 Purpose / Vision (M1/M2)** — granular: parent passes per-exercise booleans
  (`doneCount`, `m2DoneCount`). Pips can fill partially and truthfully.
- **A1 Identity / Values (M3/M4)** — NOT granular: `NewA1Grid` only receives
  `m3Started/m3Complete` and `m4Started/m4Complete` booleans (no per-step count).
  So pips use `complete ? total : started ? 1 : 0` — one filled pip means "in
  progress", not literally one exercise.
- **A2 Alignment Check (M1)** — has a step pointer: `m1.maxReached` (1-based).
  `done = claimed ? 4 : clamp(maxReached-1, 0, 4)`; `started = maxReached > 1`.
- **A2 Time Audit / Named Truth (M2/M3)** — only `claimed` booleans in state, no
  step pointer and no started signal exposed in `NewA2HubView`, so pips are binary
  (`claimed ? total : 0`). Accepted fallback, not a bug.

**Why:** a code review flagged Identity/Values rendering 0 pips while in progress as
"untruthful". The fix is the started→1 partial, bounded by the data that actually
exists. Do not invent a fake per-step count for cards that only track started/complete.

**How to apply:** before "making pips truthful" on any mirror card, check what the
card's component is actually handed. Granular fill is only possible for Purpose,
Vision, and A2 M1.
