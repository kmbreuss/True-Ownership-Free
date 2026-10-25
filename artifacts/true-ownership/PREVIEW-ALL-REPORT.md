# Preview all implementation report

No publishing or deployment was performed.

## Behavior

- DEV-only Preview all switch in the existing dev bar on A1–A5 hubs; query activation via `?preview=1` and tab session flag.
- Existing reset/seed buttons retain their extra local-tools restriction and are disabled during preview.
- Real status and completion calculations remain unchanged; preview widens entry gates separately.
- A1 Purpose/Vision/Identity/Values ladders, A2/A3 mirror steps, A4 Self/Time/Wealth/My Promises, and A5 claim/check-in/look-back entry gates accept preview.
- The spine already allowed hub navigation in the new flow; preview selects that flow without changing saved legacy preferences.
- Banner mounted above authentication and portal-mounted rooms. Preview-only inspection guard disables claim/reclaim/seal buttons, adds the note and labels mirror actions. Claim handlers also reject preview before starting ceremonies.
- All progress writers retain edits only in an ephemeral in-memory workspace during preview. No browser storage or server sync writes are made by those paths.
- **Exit reloads the whole app:** removes preview query/session flag, replaces the current page, discards the in-memory workspace and React state, and reconstructs real progress through the ordinary storage/account-loading path. Old-page callbacks remain write-blocked during the transition.

## Widened gates

Current references in `src/App.tsx`:

| Gate | Lines |
|---|---|
| New-flow selection during preview | 29600 |
| A1 mirror entry actions | 29909, 29985, 30070 |
| Purpose room ladder | 30328–30330 |
| Vision room ladder / restore eligibility | 32029–32031, 32950 |
| A2 mirror actions | 36319, 36370, 36412 |
| A2/shared mirror step hubs | 36563, 36787 |
| A3 People / Environment / Thoughts / Energy / Board / Move | 41466, 41526, 41583, 41640, 41693, 41750 |
| A4 Self / Time / Wealth / My Promises | 47569–47674 |
| A5 claim / check-in / look-back | 50170–50296 |
| Identity/Values saved-route eligibility | 51253–51254 |
| A2/A3 runtime guards | 51816, 51827 |
| A4/A5 runtime guards | 51847–51858 |
| Identity room ladder | 52723–52725 |
| Values room entry | 54124 |

## Verification

- Four automated tests pass: state-writer storage isolation; startup/sync/import write suppression; exit flag cleanup and full-reload request; production ignoring preview flags and retaining ordinary saves.
- Production Vite build passes. Existing large-bundle warning remains.
- Production output scan for `Preview all`, `to_dev_preview`, and `dev only`: zero hits.
- Typecheck: 6,055 existing diagnostics before and after; no new diagnostic kinds after normalizing shifted line numbers.
- Dev workflow restarted and serving; no runtime errors in captured browser logs.
- Screenshot verified the preview banner on the signed-out page at 375px.

**Not verified:** a signed-in walkthrough of every room, real-browser before/after storage snapshots during that walkthrough, actual browser reload after typing, complete light/dark room checks at both widths, empty-prerequisite room behavior, and production-browser navigation with the query flag. The documented browser-testing tool rejected its configuration; screenshot capture cannot sign in. Authentication was not bypassed or changed. These checks remain necessary for full acceptance; no claim is made that all empty-data rooms work.

## Decisions / deviations

- Both enabling and disabling reload, avoiding old room state/timers crossing the mode boundary.
- Preview inputs can survive room unmount/remount in memory, but not reload or exit.
- A DEV-only DOM inspection guard covers portal-mounted claim controls and action labels rather than duplicating preview presentation logic throughout the legacy room JSX. Normal production DOM is untouched.
- New tabs without a preview URL/flag start normally. Explicit `?preview=1` URLs activate preview; browser duplicate-tab session-copy behavior is not stronger isolation than sessionStorage provides.
- Already-sent network requests cannot be retroactively unsent. Guards suppress new writes and subsequent asynchronous writes while preview or its transition is active.

## Changed files

Application paths relative to `artifacts/true-ownership/`:

- `src/App.tsx`
- `src/main.tsx`
- `src/devPreview.ts` (new)
- `src/DevPreviewBanner.tsx` (new)
- `src/a2Constants.ts`
- `src/a3Constants.ts`
- `src/a4Constants.ts`
- `src/a5Constants.ts`
- `src/mirror4Constants.ts`
- `src/newFlowSync.ts`
- `src/syncHook.ts`
- `tests/dev-preview.cjs` (new)
- `PREVIEW-ALL-REPORT.md` (this file)

Project memory:
- `.agents/memory/MEMORY.md`
- `.agents/memory/dev-preview-safety.md` (new)

No backend, authentication, deployment configuration or dependencies changed.

## Repeatable checks

```sh
node --test artifacts/true-ownership/tests/dev-preview.cjs
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/true-ownership build
rg 'Preview all|to_dev_preview|dev only' artifacts/true-ownership/dist/public
pnpm --filter @workspace/true-ownership typecheck
```

The leak scan should return no matches. Typecheck is expected to return the pre-existing baseline, not a clean exit.
