# True Ownership-Free — build report

## Phone screenshots first

All examples use synthetic accounts and answers.

1. `generated-artifacts/free-verification/01-phone-signup-light.png`
2. `generated-artifacts/free-verification/02-phone-start-light.png`
3. `generated-artifacts/free-verification/10-phone-ending-light.png`
4. `generated-artifacts/free-verification/10-phone-ending-light-actions.png`
5. `generated-artifacts/free-verification/11-phone-ending-dark.png`
6. `generated-artifacts/free-verification/11-phone-ending-dark-actions.png`
7. `generated-artifacts/free-verification/10-desktop-ending-light.png`
8. `generated-artifacts/free-verification/11-desktop-ending-dark.png`
9. `generated-artifacts/free-verification/My-Future-B.png` — actual 1080×1920 download.

375×812 was verified first, followed by 1280×800, in light and dark.
The ending scrolls inside the room to keep all content and actions reachable;
screenshots include both its beginning and its lower actions.

## Safety and database

- Created `pre-free-1` before implementation.
- Single agent, one edit per patch. No publishing or original-app access.
- Before schema initialization, a read-only database check returned **zero
  non-system tables**, so no accounts, sessions or answers existed.
- The app reads this project's managed database connection. Katherine's stated
  remix setting and Replit documentation establish a new separate empty
  database; the original database was not opened or compared.
- Initialized the inherited account/session/userdata schema only in this free
  project's development database. Added consent and waitlist timestamp columns
  to accounts, not to Reality Check answers.
- Automatic owner bootstrap is disabled. No real owner account or owner password
  has been created. Tests use synthetic `@example.invalid` identities only.
- Existing cache ownership, quarantine, server X-Account-Id checks, hydration and
  save-before-sign-out protections remain.
- After verification, all test fixtures were removed. Final read-only counts:
  **0 accounts, 0 owners**. The free database is ready for Katherine's normal signup.

## What is kept and what is unreachable

Kept: signup/sign-in, signed-in email, Change password, Sign out, theme control,
Reality Check, saved review/resume/redo behavior, road, waitlist and poster.

The free entry never mounts the legacy full-course App. A1–A5 rooms/hubs, Home,
Map of Me, Own the decision, Audio, Framework, bottom navigation and member
Preview All/developer tools have no reachable free-app UI or restored route.
Legacy direct paths and old query/hash routes normalize to the free start.
Locked road labels show the exact stage name, outcome and **Opens soon**.
The API also rejects full-course userdata keys. Legacy generated-password admin
and Claude endpoints are not mounted.

## Screen preservation and 14A/14B

The following source files are byte-identical to `pre-free-1`:
`rcConstants.ts`, `RealityCheckScreens.tsx`, `RealityCheckFutures.tsx`,
`RCFutureScenes.tsx`, and the four protected Reality Check stylesheets.
The inherited global App source differs only by one export line for its existing
CSS, veil and timing constants.

Opening; both Person A/B panels; the mirror; reveal; Tuesday; price; eyes closed;
Future A; compounding; Future B five years; next-year letter; choice; both Future
A/willingness responses; and both willing/not-yet reflections keep their
existing copy and layout. Existing saved step numbers and answer shapes remain.
Only start-page integration, final-ending rendering and free-only surrounding
chrome are changed.

14A **What will get me there →** and 14B **What would help me get there →**
keep their copy and their original step-13 advance. Step 13 is now the waitlist
ending, not A1, an old joining placeholder or any locked room.

## Signup safeguards

- First name, email and chosen password; separate optional unchecked consent.
- Server trims/normalizes email, validates its shape and enforces uniqueness.
- Password minimum stays eight characters; maximum is 72 UTF-8 bytes to avoid
  bcrypt truncation. Same maximum added to password change.
- Name/email/input lengths bounded. Request-supplied owner role is ignored;
  all signup accounts are clients.
- Rate limits: 20 signup and 60 login attempts per app-server connection IP per
  15 minutes, with Retry-After and bounded in-memory tracking.
- These are conservative, per-server memory limits, not a distributed limiter;
  shared proxies may share a limit, and restarting the server resets counters.
- Same-origin mutation checks and no arbitrary credentialed CORS.
- Existing secure httpOnly, sameSite-lax session cookie. No plaintext credential
  logging, mailing integration or account-password emailing added.
- New signup does not silently adopt old/unowned browser answers.

## Ending, poster and leads

Ending copy follows the brief, not the reference image's Continue my road CTA:
**YOU CHOSE FUTURE B**; the reader's existing Future B words;
**Willpower won't get you there. This will.**; the road outcomes;
**The full True Ownership path opens soon. Your road and your answers are saved
and waiting.**; **Join the waitlist →**.

Waitlist join flushes saved answers first, requires a completed saved RC on the
server, saves the first join date once and shows **On the waitlist ✓** on return.
New joins also show the approved confirmation sentence. Save failures do not
show success. **Save my Future B** creates the actual PNG; **Not yet. Keep my
Future B saved** returns to the saved course start with the ending available.

Poster uses original one-year words, Future B Tuesday, costs and one-thing
answer, omits missing content and includes the approved opens-soon pill.
Mapping is in `ANSWER_FORMAT.md`. No PDF was added; it was optional.
No You chose Future B recording exists/configured in this copy, so none is
invented or replaced by a placeholder.

Owner-only CSV is reachable from Account after authorized owner promotion and
contains first name, email, consent, signup date, RC finished, waitlist flag/date
and focus area. Server authorization and spreadsheet-formula escaping are tested.
It never exports password hashes. Any later launch credential export is a
separate, secure, approved process, not this leads CSV.

## Proposed owner setup — not executed

1. Katherine signs up through the same normal form and chooses her own password.
2. Katherine confirms the intended account email and approves a one-time
   promotion. No original-app credentials or automatic first-signup elevation.
3. Through the workspace's secure Secrets flow, Katherine supplies a fresh
   `FREE_OWNER_PROMOTION_SECRET`; the target email is a separate non-secret
   setting. Do not post the secret in chat, URLs or logs.
4. Implement a short-lived promotion operation requiring BOTH that signed-in
   target account and a constant-time secret match. In one transaction, lock the
   promotion, confirm no existing owner and no previous claim, record the
   one-time claim and change only that account's role to owner.
5. Leave the existing password hash untouched, revoke old sessions, sign in again
   with Katherine's same chosen password, verify CSV access, then remove the
   temporary operation and secret.

This is a proposal for separate approval, not an enabled public endpoint.
No fixed, generated or emailed owner password is involved.
The API regression temporarily simulates owner authorization on its own synthetic
fixture to test CSV; the fixture and sessions are removed in finally.

## Verification

**Passed:** `pnpm --filter @workspace/true-ownership run verify:free`

This combined check covers source preservation, real signup/sign-in, every RC
scene, Future A/Not yet/Yes branches, both 14 buttons, persisted waitlist and its
unchanged repeat-join date, reload, actual PNG dimensions, phone/desktop themes,
removed routes, stale-account save rejection, forbidden origins, logout cache
clearing and retained appearance. Browser errors/unhandled rejections are checked.
It also checks consent, password/email validation, duplicate safety, client-only
signup, owner-only CSV and formula escaping. Browser fixture writes were bound
to the synthetic account; production URLs are refused.

The command is registered as the named **free-path** validation. Future free
builds must run it before reporting done. New regression fixtures are cleaned
up automatically; screenshots/downloads are ignored generated output.

**Passed:** shared-library typecheck, API server typecheck, and `git diff --check`.

**Existing limitation:** the full frontend typecheck reports 6,055 inherited
diagnostics, largely in old giant/copied App files. No diagnostics were reported
for the added free components, modified RealityCheck wrapper or main entry.
This is not a claim that the entire inherited project has a clean typecheck.
No broad legacy cleanup or library migration was performed.

## Files and handoff

- `CHANGES_FOR_FULL_APP.md` — dated shared changes and exact per-file adoption
  steps; free-only restrictions are explicitly not to be copied blindly.
- `ANSWER_FORMAT.md` — original stores, fields, shapes and poster mappings.
- `LAUNCH_IMPORT_PLAN.md` — plan only, with secure transfer, existing-email
  conflict rules, tests on copies, idempotency and rollback.
- `FREE_BUILD_REPORT.md` — this report.
- UI: `src/free/FreeApp.tsx`, `FreeRoad.tsx`, `FreeEnding.tsx`, `poster.ts`,
  `api.ts`, `free.css`; minimal main/App/RealityCheck integration, free metadata
  in `index.html`, preview banner removal.
- API: new free router; restricted route index/userdata; disabled owner bootstrap;
  CORS/password-limit changes; account schema metadata.
- Contracts: OpenAPI free endpoints and regenerated API client/Zod types.
- Tests: free browser regression, API checks and synthetic fixture cleanup,
  verify:free package command, API dev-only pg dependency and updated lockfile.

No launch import, real owner promotion, email campaign or publishing was done.
