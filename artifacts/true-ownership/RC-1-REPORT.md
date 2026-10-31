# RC-1 implementation report

## Scope delivered

Reality Check is available in the existing signed-in app with `?newRC=1`.
The unflagged app retains its previous entry behavior.

- Start / Reality Check entry in the desktop and phone spine and Entry Hall.
- Hub (board 0) and screens 1–5: opening video slot, Own It scales, focus choice, what isn't working, four defaults and named answers, and cost.
- Screen 6 is only a terminal Two futures placeholder. It does not complete RC or unlock A1.
- Optional named answers appear inside selected defaults, in Cormorant italic, and save per area under `defaultsNamed`. Blank named answers never block Continue.
- Existing A3/A4 overlay classes, veil component/timing, brand typography and navigation conventions are reused.
- Room refresh restores the saved RC step without replaying the veil. New room entries play the veil.
- `to_rc_state_v1` is registered as `rcstate` in the existing sync registry/server key set, including the generic export/import and sync-status machinery.
- RC writes use the existing Preview All scratch storage and write protections. Preview exit still performs a full reload to restore real progress.

## Approved scope changes

The owner's final go supersedes the original account-related plan:

- Every real account is treated as **member in code**.
- **No users.access column, database migration, signup endpoint, auth changes, or free-user write restrictions were added.**
- Free access is only a DEV checkbox in DevResetBar. Its value is in memory and resets on reload/Preview exit. It never modifies account permissions.
- Preview All bypasses the simulated access gate. The feature flag is still required to expose RC.
- The only backend edit adds `rcstate` to the existing versioned sync allow-list. The existing authenticated own-account storage endpoint is otherwise unchanged.
- Work was performed by one agent. No subagents or architect/reviewer loops were used.
- Nothing was published.

## Choices and differences

1. **No completion in RC-1.** New members cannot satisfy the new RC prerequisite until RC-2 provides completion. Existing substantive A1–A5 progress exempts them from the additional RC prerequisite; the original downstream sequential rules remain unchanged.
2. **Named defaults retain drafts.** Deselecting a card hides its input without deleting the text. None of these deselects all defaults but retains those hidden drafts; only selected defaults are active. RC-2 should intersect `defaultsNamed` with the selected defaults when constructing its wake-up/list.
3. **Explicit None of these metadata.** `defaultsNone` records this answer per area, distinguishing it from an unanswered empty array.
4. **Incomplete focus is null.** Until all scores and a required choice are entered, `focus` and `focusChosenBy` can be null. All-low ties and all-8+ scores never silently choose an area. Changing a score recalculates the suggestion and clears an explicit choice where necessary.
5. **Room routing.** RC uses the existing persisted app route (`rc` or `rcroom`) plus its store's `step`, rather than adding a redundant overlay room-id field for its single room. This has the same entry/resume intent as the A3 pattern.
6. **Layout.** Desktop default cards use a 2×2 layout with all selected inputs visible. “Sounds like” text is expandable, in a small overlay, to leave space for the optional inputs without removing copy. Phone defaults stack. Other dense phone screens use local tabs for Person A/B, Own It areas and cost areas; symptoms can expand beneath the textarea. This is a deviation from showing all three phone score/cost cards simultaneously, following the approved plan's allowance for local paging rather than shrinking text. Desktop cost always shows all three columns.
7. **Video.** Empty video URL shows the card with an explanatory note and no play control. Watching is not required.
8. **Storage failures.** RC save failures show an error rather than pretending an answer saved.
9. **Cost without amounts.** If only Wealth/Time cost chips are selected, the summary lists those costs rather than inventing numeric totals. Numeric zero/omitted values are not displayed.

## Verification

### Passed

- Unit tests: **13 passed, 0 failed** in one run:
  - Existing Preview All safety suite, extended to include the RC writer.
  - Unscored initialization and additive named-answer hydration.
  - Suggested/overridden focus, ties, all-high scores and score labels.
  - Symptom toggles preserving original and edited text.
  - Optional named answers and None of these.
  - Cost math and absent/zero values.
  - Real versus preview RC persistence, sync registration and exit reload.
  - DEV-only in-memory access simulation.
  - Existing-progress exemption versus pristine stores.
  - Server RC key acceptance and newer-wins conflict rule.
- Typecheck baseline comparison: **6,055 before / 6,055 after; no additional normalized diagnostics**. This is not a clean repository-wide typecheck.
- Production frontend build: passed on its first run. Existing large-bundle warning remains.
- Production DEV-tool leak scan: no matches for Preview All/session flag/access-toggle UI markers.
- API workflow rebuild and startup: passed.
- Frontend and API restarted once each after implementation; no new runtime errors in the inspected workflow/browser logs.
- Whitespace diff check: passed.
- Screenshot at 1280×800 loaded the signed-out page and Preview banner with no JavaScript errors.

### Not verified — do not treat these as passed

The screenshot browser is signed out and cannot authenticate. Authentication was left intact.

- The actual signed-in RC walkthrough, field interactions and route transitions.
- Measured desktop overflow, especially all four selected defaults at 1280×800.
- Actual 375px layouts, light/dark appearance and soft-keyboard behavior.
- Live account RC sync, cross-device conflict handling and export/import through the UI.
- Live-browser storage/network observation and visible post-preview restoration.

The state/permission/preview behaviors above were tested with the actual modules in isolated test environments, not through an authenticated browser. The RC screens are implemented, but visual and live-account acceptance is **not fully signed off**.

## Future real free-signup/access work

Deferred intentionally, not implemented:

- Add a persisted, validated free/member account entitlement with an additive migration and safe member backfill for existing users.
- Add secure free-entry registration using existing password/session protections; assign free server-side and prevent user-selected elevated access.
- Return authoritative access through authenticated account responses and replace the DEV simulation with real entitlement checks.
- Define and enforce server-side free/member data access and write rules while preserving users' existing answers and their own Map of Me.
- Connect joining/upgrading to the eventual membership/payment system, and test entitlement transitions and existing-user exemptions.

## Changed files

Application:
- `artifacts/true-ownership/src/App.tsx`
- `artifacts/true-ownership/src/newFlowSync.ts`
- `artifacts/true-ownership/src/rcConstants.ts` (new)
- `artifacts/true-ownership/src/reality-check/access.ts` (new)
- `artifacts/true-ownership/src/reality-check/progress.ts` (new)
- `artifacts/true-ownership/src/reality-check/RealityCheck.tsx` (new)
- `artifacts/true-ownership/src/reality-check/RealityCheckScreens.tsx` (new)
- `artifacts/true-ownership/src/reality-check/reality-check.css` (new)
- `artifacts/api-server/src/lib/syncGuard.ts`

Tests and report:
- `artifacts/true-ownership/tests/dev-preview.cjs`
- `artifacts/true-ownership/tests/reality-check.cjs` (new)
- `artifacts/true-ownership/RC-1-REPORT.md` (new)

Project memory:
- `.agents/memory/MEMORY.md`
- `.agents/memory/reality-check-scope.md` (new)

No dependency, authentication, schema, migration, artifact configuration or deployment files changed.

## Commands used

```sh
node --test artifacts/true-ownership/tests/dev-preview.cjs artifacts/true-ownership/tests/reality-check.cjs
pnpm --filter @workspace/true-ownership typecheck
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/true-ownership build
rg -l 'Preview all|to_dev_preview|Simulate free access|dev only' artifacts/true-ownership/dist/public
git diff --check
```
