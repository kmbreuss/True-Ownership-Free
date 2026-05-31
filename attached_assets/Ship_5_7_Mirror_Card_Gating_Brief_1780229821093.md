# Ship 5.7 · Mirror Card Status & Gating — Replit Build Brief

**Date:** May 30, 2026
**Owner:** Katherine Breuss (AG45)
**App:** True Ownership · `artifacts/true-ownership/src/App.tsx`
**Dev URL:** `https://b8363272-ff9f-404c-9632-5af68f34d738-00-2kazqkj8gufie.spock.replit.dev/?newA1=1`
**Status:** BLOCKER for the Entry Hall + Framework + Spine build. Ship this first.
**Estimated size:** ~50-80 lines of changes in App.tsx, single file.

---

## TL;DR

The four Mirror cards on the A1 hub need consistent 4-state status logic with proper gating between them. Right now M3 (Identity) and M4 (Values) are completely static — hardcoded `"Up next"` chips and hardcoded `"Begin Identity →"` / `"Begin Values →"` buttons regardless of state. M2 has computed logic but no visible "Locked" branch. M1's logic is the cleanest of the four. This ship makes all four cards consistent with a single pattern.

After this ship:
- All four cards display correct state: **Locked → Up next → In progress → Complete**
- Button labels: **"Begin {Mirror} → / Continue {Mirror} → / Review {Mirror} →"** in all four cards
- A mirror is **truly locked** (chip + disabled button) until the prior mirror is complete
- Dev flags `?newM3=1` and `?newM4=1` removed (both mirrors shipped; flags no longer needed)

---

## What's currently broken (with line refs)

Read `App.tsx` and confirm before editing.

### M1 Purpose card (mostly right, needs wording change)

Around line ~28058 area (variables in the parent component). Current logic:
```js
const purposeComplete = doneCount === [...].length;
const purposeInProgress = doneCount > 0 && !purposeComplete;
const purposeStatusLabel = purposeComplete ? "Complete" 
                         : purposeInProgress ? "In progress" 
                         : "Up next";
const purposeCtaLabel = purposeComplete ? "Review with Katherine →" 
                      : purposeInProgress ? "Continue with Katherine →" 
                      : "Explore with Katherine →";
```

✅ Status branching correct (no Locked needed — M1 is always unlocked)
❌ CTA labels use "with Katherine" — needs to change to "Purpose" per Option B

### M2 Vision card (right structure, missing Locked branch)

Around line ~28145. Current logic:
```js
const visionUnlock = !!progress.purposeFinal;
const visionComplete = !!m2Progress.complete;
const visionInProgress = visionUnlock && m2DoneCount > 0 && !visionComplete;
const visionStatusLabel = visionComplete ? "Complete" 
                        : visionInProgress ? "In progress" 
                        : "Up next";   // ← missing: "Locked" branch when !visionUnlock
const visionCtaLabel = (same 3-state pattern, "with Katherine →");
```

✅ Has the `visionUnlock` variable
❌ Status label has no "Locked" branch — when `!visionUnlock`, it falls through to "Up next"
❌ CTA labels need to change to "Vision" per Option B
❌ CTA has no "Unlocks after Purpose" disabled state

### M3 Identity card (completely static)

Around line ~28258 (right before "Begin Identity →" at position ~1731435). Current JSX has:
```jsx
<span className="na1-mirror-card-status">Up next</span>     {/* hardcoded */}
<button ...>Begin Identity →</button>                       {/* hardcoded */}
```

Zero status computation. No unlock gate. No started detection. No complete detection.

### M4 Values card (completely static, same as M3)

Around line ~28342 (right before "Begin Values →" at position ~1738876). Same pattern as M3.

---

## What to build

### Single state computation pattern, applied to all four mirrors

Add these computed variables in the parent component (same place where `purposeComplete` etc. already live), in order so each mirror's unlock can reference the prior:

```js
// ────────────────────────────────────────────────────────────────
// M1 PURPOSE
// ────────────────────────────────────────────────────────────────
const purposeUnlock = true;  // M1 is always unlocked
const purposeHasStarted = doneCount > 0 || !!progress.purposeFinal;
const purposeComplete = (existing logic — keep as-is)
const purposeInProgress = purposeHasStarted && !purposeComplete;
const purposeStatusLabel = !purposeUnlock ? "Locked"
                         : purposeComplete ? "Complete"
                         : purposeInProgress ? "In progress"
                         : "Up next";
const purposeCtaLabel = !purposeUnlock ? "Unlocks first"
                      : purposeComplete ? "Review Purpose →"
                      : purposeInProgress ? "Continue Purpose →"
                      : "Begin Purpose →";

// ────────────────────────────────────────────────────────────────
// M2 VISION
// ────────────────────────────────────────────────────────────────
const visionUnlock = !!purposeComplete;  // unlock when M1 complete
const visionHasStarted = m2DoneCount > 0 || !!m2Progress.complete;
const visionComplete = !!m2Progress.complete;
const visionInProgress = visionUnlock && visionHasStarted && !visionComplete;
const visionStatusLabel = !visionUnlock ? "Locked"
                        : visionComplete ? "Complete"
                        : visionInProgress ? "In progress"
                        : "Up next";
const visionCtaLabel = !visionUnlock ? "Unlocks after Purpose"
                     : visionComplete ? "Review Vision →"
                     : visionInProgress ? "Continue Vision →"
                     : "Begin Vision →";

// ────────────────────────────────────────────────────────────────
// M3 IDENTITY · SUPERPOWERS
// ────────────────────────────────────────────────────────────────
const identityUnlock = !!visionComplete;  // unlock when M2 complete
// Started detection: use whatever state path mirror3 progress writes to.
// Strong candidate: mapState?.mirror3?.pickedGifts (used in shouldRouteToM3)
// Plus any other m3 state fields that indicate the user started — clusters, animals, etc.
const identityHasStarted = (
  Array.isArray(mapState?.mirror3?.pickedGifts) && mapState.mirror3.pickedGifts.length > 0
) || !!mapState?.mirror3?.claimed;
const identityComplete = !!mapState?.mirror3?.claimed;
const identityInProgress = identityUnlock && identityHasStarted && !identityComplete;
const identityStatusLabel = !identityUnlock ? "Locked"
                          : identityComplete ? "Complete"
                          : identityInProgress ? "In progress"
                          : "Up next";
const identityCtaLabel = !identityUnlock ? "Unlocks after Vision"
                       : identityComplete ? "Review Identity →"
                       : identityInProgress ? "Continue Identity →"
                       : "Begin Identity →";

// ────────────────────────────────────────────────────────────────
// M4 VALUES · THE ORDER YOU LIVE BY
// ────────────────────────────────────────────────────────────────
const valuesUnlock = !!identityComplete;  // unlock when M3 complete
const valuesHasStarted = (
  Array.isArray(mapState?.mirror4?.values) && mapState.mirror4.values.length > 0
) || !!mapState?.mirror4?.claimed;
const valuesComplete = !!mapState?.mirror4?.claimed;
const valuesInProgress = valuesUnlock && valuesHasStarted && !valuesComplete;
const valuesStatusLabel = !valuesUnlock ? "Locked"
                        : valuesComplete ? "Complete"
                        : valuesInProgress ? "In progress"
                        : "Up next";
const valuesCtaLabel = !valuesUnlock ? "Unlocks after Identity"
                     : valuesComplete ? "Review Values →"
                     : valuesInProgress ? "Continue Values →"
                     : "Begin Values →";
```

**For M3/M4 "started" and "complete" detection:** Agent should read the actual mirror3 and mirror4 state paths in the source first. The above is the strong-candidate guess based on `shouldRouteToM3`'s `pickedGifts` check and the Mirror 4 Build Plan's `state.mirror4.claimed = true` field. If actual fields differ, use those.

### Replace the static M3 and M4 JSX

Replace the hardcoded `"Up next"` and `"Begin Identity →"` / `"Begin Values →"` strings in the M3 and M4 card JSX with `{identityStatusLabel}` / `{identityCtaLabel}` and `{valuesStatusLabel}` / `{valuesCtaLabel}` respectively.

The M3 card status chip class name `na1-mirror-card-vision-up-next` is wrong (legacy from a prior pattern) — change it to dynamic. Use the same chip styling as M1/M2 (which already vary by status).

### Card-level "Locked" visual treatment

When a mirror card is locked:

| Element | Treatment |
|---|---|
| Card itself | Reduced opacity (~0.55), pointer-events: none on the card surface (so it isn't clickable), but the card still renders fully so the user sees what's coming |
| Status chip | Reads `Locked` — muted treatment (use a 4th chip variant: `na1-mirror-card-status--locked`) — muted gold border, muted text |
| CTA button | Disabled (`disabled` attribute), reads `Unlocks after [Prior]`, dimmed background (no gold fill), no hover lift |
| Pips/progress | Hidden when locked (don't render the dashes) |
| Quote/seal area | Replace with a single line: *"Locked"* in italic Georgia muted color, OR omit entirely (Agent's call — prefer omit if the card already feels populated) |

### Disable the dev flags

Both M3 and M4 have shipped. The `?newM3=1` and `?newM4=1` URL flags exist solely as dev unlocks. **Remove them**:

1. Find and delete the `NEW_M3_FLAG_URL`, `NEW_M3_FLAG_LOCAL`, `NEW_M4_FLAG_URL`, `NEW_M4_FLAG_LOCAL` constants (~lines 1707900-1709100 in current source)
2. Find the localStorage sticky-opt-in writes (`localStorage.setItem("newM3", "1")` etc.) — delete them
3. Find `shouldRouteToM3(mapState)` — simplify to:
   ```js
   function shouldRouteToM3(mapState) {
     if (!NEW_A1_FLAG) return false;
     return !!mapState?.mirror2?.complete;  // unlock when M2 complete
   }
   ```
4. Same simplification for `shouldRouteToM4` (or wherever M4 routing decisions are made)
5. localStorage cleanup: on app boot, if `localStorage.getItem("newM3") === "1"` or `"newM4" === "1"`, remove those keys (they were set by previous dev sessions and now they're noise)

After removal, the URL `?newM3=1` or `?newM4=1` becomes a no-op. The cascading lock works purely from completion state.

### M1 Purpose — wording change

Change M1's CTA labels from `"Explore/Continue/Review with Katherine →"` to `"Begin/Continue/Review Purpose →"`. Apply Option B consistently across all four mirrors.

---

## Definition of done

A ship is complete when ALL of these are true under URL `?newA1=1` (with no other flags):

### State 1 — Fresh user (no progress)
- [ ] M1 Purpose: chip "Up next", button "Begin Purpose →"
- [ ] M2 Vision: chip "Locked", button "Unlocks after Purpose" (disabled, dimmed)
- [ ] M3 Identity: chip "Locked", button "Unlocks after Vision" (disabled, dimmed)
- [ ] M4 Values: chip "Locked", button "Unlocks after Identity" (disabled, dimmed)
- [ ] M2, M3, M4 cards all show at ~0.55 opacity, no pointer events

### State 2 — M1 started but not complete
- [ ] M1: chip "In progress", button "Continue Purpose →"
- [ ] M2/M3/M4 still locked

### State 3 — M1 complete, M2 not started
- [ ] M1: chip "Complete", button "Review Purpose →"
- [ ] M2: chip "Up next", button "Begin Vision →", card fully visible
- [ ] M3/M4 still locked

### State 4 — M1+M2 complete, M3 in progress
- [ ] M1: "Complete" + "Review Purpose →"
- [ ] M2: "Complete" + "Review Vision →"
- [ ] M3: "In progress" + "Continue Identity →"
- [ ] M4: still locked

### State 5 — all four complete (claimed)
- [ ] All four chips read "Complete"
- [ ] All four buttons read "Review {MirrorName} →"

### Dev flag removal
- [ ] URL `/?newA1=1&newM4=1` behaves identically to `/?newA1=1` (the `newM4` param does nothing)
- [ ] URL `/?newA1=1&newM3=1` behaves identically to `/?newA1=1`
- [ ] `localStorage.getItem("newM3")` and `("newM4")` both return `null` after first page load (cleanup ran)
- [ ] `shouldRouteToM3` returns true only when M2 is complete; returns false otherwise
- [ ] `shouldRouteToM4` returns true only when M3 is complete; returns false otherwise

### Visual parity
- [ ] All four mirror cards use the same chip styling (status chip is in the same position, same font, same letter-spacing)
- [ ] All four mirror cards use the same button styling (gold fill when unlocked, dimmed/disabled when locked)
- [ ] Mobile (under 600px viewport): cards stack to single column, chip + button stay readable

---

## DO NOT

- ❌ Don't touch any mirror's internal room flows (M1/M2/M3/M4 room overlays unchanged)
- ❌ Don't touch Map of Me
- ❌ Don't change the M1/M2 unlock logic for `purposeFinal` / `m2Progress.complete` — those work. Just add the "Locked" branch to the status label.
- ❌ Don't introduce new state fields. Read existing `mapState.mirror3.*` and `mapState.mirror4.*` paths from the source.
- ❌ Don't introduce a new feature flag — this ships under existing `?newA1=1`
- ❌ Don't add an icon (lock emoji etc.) to the LOCKED chip — keep it text-only ("Locked"), matching the rest of the chip system
- ❌ Don't write a migration for the localStorage cleanup — just `.removeItem()` on boot, no fanfare

---

## Verification (Claude walk via Chrome MCP)

After Agent ships, walk these states:

1. **Reset state** (clear localStorage, reload at `?newA1=1`) — confirm State 1 above
2. **Inspect M1, complete it (or set state.mirror1.complete in console)** — confirm State 3
3. **Set state.mirror2.complete = true** — confirm State 4 (with M3 unlocked but locked button)
4. **Start M3 (add a picked gift via console)** — confirm "In progress" + "Continue Identity →"
5. **Set state.mirror3.claimed = true** — confirm M3 complete + M4 unlocked
6. **Verify both dev flags are no-ops** — load with `?newA1=1&newM3=1&newM4=1`, confirm same display as `?newA1=1` alone for the same state
7. **Mobile** — resize to ~600px, verify cards stack and chips/buttons remain readable

---

## File touched

**Only one file:** `artifacts/true-ownership/src/App.tsx`

Estimated change size: ~50-80 lines added (status computation block) + ~20 lines modified (JSX swaps) + ~30-40 lines deleted (dev flag plumbing). Net: -10 to +30 lines.

---

## Why this blocks the Entry Hall build

The Entry Hall + Framework + Spine ship adds the persistent spine that shows A1's status as YOU ARE HERE / CLAIMED / AHEAD. Those statuses are computed from the same mirror completion flags. **If the mirror gating is broken, the spine status will be broken too.** Fix the foundation first, then the spine sits on solid ground.

---

## Quick reference

| What | Value |
|---|---|
| Dev URL to test | `https://b8363272-ff9f-404c-9632-5af68f34d738-00-2kazqkj8gufie.spock.replit.dev/?newA1=1` |
| File touched | `artifacts/true-ownership/src/App.tsx` |
| Wording option | **B** (Begin/Continue/Review {MirrorName} →) |
| Dev flags after ship | `newM3` and `newM4` removed; only `newA1` remains |
| Lock unlock chain | M1 always · M2 ← M1 · M3 ← M2 · M4 ← M3 |

— end of brief —
