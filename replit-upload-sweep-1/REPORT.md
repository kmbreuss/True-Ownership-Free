# Batch 1 staged delivery

The running application has not been changed. No upload, publication, or deployment was performed. The replacement source is `artifacts/true-ownership/src/App.tsx` **inside this staging folder**.

## Changes

- Continue to Under Pressure now calls the existing room-launch path directly, including its entry veil, instead of closing to the Identity hub.
- Own It retains the original power cards, shadow/power pairings, shadow cards, and Big Claim text. Animal cards and the dynamic “I am the …” declaration are added at the beginning.
- All nine requested room bodies have desktop section navigation/pips or, for Two Futures, its existing screen flow plus paged domains and tabbed final readback.
- The desktop breakpoint is 768px. Below that, sections and lists stack.
- Section positions and list pages are UI-only state scoped by account; Two Futures also stores its exact screen. Existing saved-answer schemas are unchanged.
- No inner-scroll or clipping workaround was used to pass the desktop fit checks.

## Measured overflow at 1280 × 800

These are **component-fixture measurements**, not measurements of the authenticated application. The fixtures render the actual before/after room code in the standard room-card shell. Overflow is `scrollHeight - clientHeight`, in pixels. The after column is the maximum observed over the visited section pips; the extended pass also traversed visible list-page controls.

| Room | Before | After |
|---|---:|---:|
| A2 Where time goes | 1608 | 0 |
| A2 Rethink your time | 1977 | 0 |
| A2 The gap | 207 | 0 |
| A3 Shape | 662 | 0 |
| A3 Fill the seats | 282 | 0 |
| Values Name the Standards | 1260 | 0 |
| Values Rank | 647 | 0 |
| Identity Your Gifts | 776 | 0 |
| Two Futures — initial Time chip screen | 231 | 0 |
| Own It — three populated animals | 876 | 0 |

Horizontal overflow was 0 in these measurements.

Fixture data: eight activities; three priorities; six thought lines; six board seats; six named values and nine evidence behaviors; three animals with power/shadow sentences and one gift each. These are synthetic fixtures, not customer answers. Fixture storage is isolated in memory and cannot overwrite real account storage.

## Verification

- Rebuilt and ran `tests/regression.cjs`: **12 passed, 0 failed**. Covers A4 validation, claim gates, persistence and malformed-state handling; A5 plans/support gates and persistence; Vision tier/template completeness, independent futures and seeded shuffle.
- Both before/after component bundles compile successfully with esbuild.
- Staged-vs-live TypeScript checks reported the same existing App.tsx diagnostics, ignoring shifted line numbers; this is **not a clean project typecheck**.
- Browser fixture checks exercised desktop section-pip navigation. The extended audit traversed visible paged lists and checked that remounting a component restored its selected section. This is not equivalent to a full browser refresh through the application router.
- A 390px Your Gifts screenshot confirmed the stacked mobile presentation; a full mobile-room sweep was not performed.
- The normal browser-testing callback was unavailable. A local Playwright attempt was blocked by Chromium/Nix runtime dependencies. The working browser measurements instead came from the screenshot browser loading `tests/browser/audit.html`, whose fixture code performs the measurements and logs them.

### Verification limits

The authenticated UI, full application routing, actual veil playback, server saves, full-page refresh/resume, every Two Futures screen, pressure-test modal interactions, and arbitrarily long answers were **not end-to-end verified**. Zero fixture overflow does not guarantee zero overflow for every account or for the additional chrome of every real container. The test harness uses room bodies, not the complete signed-in navigation hierarchy.

## Choices where splitting was awkward

1. **Rank:** the whole ordered list is useful to see at once, but six values did not fit. Desktop now shows two per page. Arrow buttons reorder across page boundaries; drag-and-drop only reorders the visible page. Phones retain the full list.
2. **Own It:** a populated power/pairing/shadow triptych did not fit as one desktop section. Rather than delete or clip anything, each animal has separate Superpower, Shadow and power, and Under pressure sections. The three-animal fixture has 11 sections including the opening declaration and Big Claim. Phones retain complete stacked animal cards.
3. **Two Futures:** splitting an entire life lens would alter the existing progression. The lens screen and its validation are preserved, with domains paginated inside it; Continue still requires every domain.
4. **Validation:** added internal section navigation allows reviewing sections; the original room-completion gates remain authoritative.

## Files and reruns

- `artifacts/true-ownership/src/App.tsx`: staged replacement source.
- `IMPLEMENTATION.md`: detailed implementation notes, including intermediate fit fixes.
- `tests/regression.cjs`: run with `node replit-upload-sweep-1/tests/regression.cjs` from the project root.
- `tests/build-harness.cjs`: builds both actual source versions into isolated fixture bundles using existing dependencies.
- `tests/browser/audit.html`: browser-driven overflow/section-remount audit. Build the harness first, then open it through Vite's development `/@fs/` route.
- `tests/overflow.cjs`: optional Playwright measurement runner, requiring a working Playwright Chromium installation.

Generated fixture bundles are ignored by Git. Test harnesses are not production application files. Only the staged App.tsx is intended as replacement application code; no changes were applied automatically.
