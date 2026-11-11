# Changes for the full-app agent

## 2026-11-09 — separate free course

Scope: **this free project only**. Do not automatically apply these changes to the
full app. Katherine reviews and sends this document to that app's agent.
Baseline tag: `pre-free-1`. No Reality Check answer-format change was made.

### Shared surfaces — exact integration steps

| Files | Change | What the full-app agent should do |
|---|---|---|
| `artifacts/true-ownership/src/App.tsx` | Added exactly `export { CSS as inheritedCSS, NewA1Veil, NA1_VEIL_TIMING };` before the existing imports; all remaining bytes unchanged. | Optional reuse export only; the full app must keep its own entry/routing. This preserves inherited room styles and veil timings without mounting any full-course UI in the free app. |
| `artifacts/true-ownership/src/reality-check/RealityCheck.tsx` | Added optional `freeCourse` and `ending(state)` props. Name initializes from `memberName`; freeCourse always shows the existing welcome/name block, saves edits on Begin and suppresses Entry Hall breadcrumb. Internal step 13 renders supplied ending and omits the old Start my path button only when an ending is supplied. | Merge optional extension if useful. Do not pass `freeCourse`/`ending` in the full app unless explicitly authorized. Keep existing full-app defaults and protected scenes. The name initialization from `memberName` is the only shared default adjustment. |
| `artifacts/api-server/src/routes/authPassword.ts` | Password change now rejects UTF-8 passwords exceeding 72 bytes, as bcrypt otherwise truncates. Existing eight-character minimum is preserved. | Consider the same upper bound and aligned user-facing error/form guidance in the full app. No password/hash migration is performed. |
| `artifacts/api-server/src/app.ts` | Arbitrary credentialed cross-origin access disabled (`origin:false`). | Apply only after auditing the full app's intended callers. Free app is same-origin only. |
| `artifacts/true-ownership/vite.config.ts` | Removed only the development banner plugin; retained error overlay and cartographer. | Optional preview-only change. The banner obscured unchanged RC header navigation at phone size. |
| `artifacts/true-ownership/src/main.tsx` | Entry imports `free/FreeApp` instead of the old App; removed DevPreviewBanner. AuthProvider and PhoneReadability stay. | **Free-only: do not copy this entry replacement into the full app.** |
| `artifacts/api-server/src/routes/index.ts` | Mounts free router before auth; removes legacy admin/generated-password endpoints and Claude router from the reachable API. | **Free-only.** Retain full-app features in the original. |
| `artifacts/api-server/src/index.ts` | Removed automatic bootstrapOwner invocation and import. Server no longer creates owner accounts/passwords from inherited environment. | Free-only owner policy. Do not copy an inherited owner or credentials into this project. |
| `artifacts/api-server/src/routes/userdata.ts` | Writable key allowlist limited to `rcstate`, `setaside`; versioned-write conflict guard and X-Account-Id check unchanged. | **Free-only.** Full app needs its A-stage keys. |
| `lib/db/src/schema/auth.ts` | Added `email_consent` false by default and nullable `waitlisted_at` to users. Existing account/session structure retained. | Free-account metadata only. At launch, map intentionally; never alter the RC payload. |
| `lib/api-spec/openapi.yaml` | Added `/free/signup`, `/free/account` GET/PATCH, `/free/waitlist` POST, `/free/leads.csv` GET and FreeRegistration/FreeName/FreeAccount schemas. | Copy only for an explicitly approved matching feature; re-run codegen. Legacy spec entries were not an auth-provider migration. |
| `lib/api-client-react/src/generated/*`, `lib/api-zod/src/generated/*` | Regenerated from the spec. | Never manually merge generated files. Re-run `pnpm --filter @workspace/api-spec run codegen` after any accepted spec change. |

### New free-only files

- `artifacts/api-server/src/routes/free.ts`: registration with client-only role,
  email/name/password validation, in-memory conservative auth rate limits,
  same-origin mutation checks, bound account updates, idempotent waitlist and
  owner-only CSV with formula escaping.
- `artifacts/true-ownership/src/free/FreeApp.tsx`: isolated signed-in start,
  signup/sign-in, account controls, hydration/retry boundary, safe password change,
  ending return, route/query/Preview neutralization. Never mounts the legacy App.
- `artifacts/true-ownership/src/free/api.ts`: JSON API errors and account-generation
  guard for free metadata.
- `artifacts/true-ownership/src/free/FreeRoad.tsx`: phone segments, desktop road and
  locked-stage outcome detail; no stage unlocks or new completion fields.
- `artifacts/true-ownership/src/free/FreeEnding.tsx`: final scene, waitlist,
  persisted-save barrier and poster/later actions.
- `artifacts/true-ownership/src/free/poster.ts`: client-generated 1080×1920 PNG.
  Files are downloaded, not uploaded/persisted in a server database.
- `artifacts/true-ownership/src/free/free.css`: free-only chrome and final-ending
  styles. The final room override matches only a room containing `.free-ending`.
- `artifacts/true-ownership/scripts/free-path.mjs`: synthetic-only browser
  regression and byte-identical protected-source check against `pre-free-1`.
- `ANSWER_FORMAT.md`, `LAUNCH_IMPORT_PLAN.md`, `FREE_BUILD_REPORT.md`: contract,
  future import plan and delivery report.

### Protected shared files — intentionally no edits

Additional free-only integration: `artifacts/true-ownership/index.html` now uses
the free-course title/description and local preview images rather than the
full app's external image URL. `artifacts/true-ownership/package.json` exposes
`verify:free`; `artifacts/api-server/package.json` and the lockfile add `pg` as a
development-only test dependency. `artifacts/api-server/scripts/free-api-check.mjs`
checks the real API with a temporary synthetic fixture, and
`artifacts/api-server/scripts/free-fixture-cleanup.mjs` deletes only an exact
validated development regression fixture and its sessions. No real account is
promoted by those tests.

`rcConstants.ts`, `RealityCheckScreens.tsx`, `RealityCheckFutures.tsx`,
`RCFutureScenes.tsx`, `rcJourney.ts`, the four protected RC stylesheets,
appearance provider, account isolation, logout barriers and sync engine remain
unchanged. The existing 14A/14B button actions already advance to internal step
13; the free ending occupies that step, so no button-copy/scene edits are needed.
The inherited global CSS, room veil and timing values remain unchanged.

### Reproduce exact differences

For existing files, run `git diff pre-free-1 -- <path>` in this free project.
For new free files, use their complete contents as additions, not replacements
for full-app modules. This table gives per-file adoption instructions where the
full app should *not* copy free-specific restrictions. Check the protected-file
assertions before accepting any future change.

### Mandatory future verification

Start the existing free app/API workflows, then run
`pnpm --filter @workspace/true-ownership run verify:free`. This creates only
synthetic `@example.invalid` accounts in the development database, never real
members or production accounts. Screenshot/download output stays under ignored
`generated-artifacts/`. Run this before reporting any future free build complete.

No email delivery, publishing, owner promotion or launch import is performed by
this change. Email consent is a saved permission, not an active mailing system.

## 2026-11-11: free course v2 (the new Reality Check flow)

Scope: **this free project only.** Nothing here is applied to the full app; Katherine reviews and sends it on.
Branch `free-v2` of `kmbreuss/true-ownership-free`. The full list of shared surfaces is completed in the final part of this build.

### Copy changes to an existing scene (free course only)

| Scene | Original (full app, unchanged) | Free course |
|---|---|---|
| Close your eyes | "It's twelve months from now. Nothing has changed. Same {area}. Same Tuesdays. Breathe, and let yourself see it." | "Imagine nothing changes. Same {area}. Same Tuesdays. Breathe, and let yourself see it." |

The protected scene files (`RealityCheckFutures.tsx` and the rest) are byte-identical to `pre-free-1`. The free course renders its own copy of this scene in `artifacts/true-ownership/src/free/course/screens/Ask.tsx` (`Eyes`), keeping the same classes, heading and audio support.
