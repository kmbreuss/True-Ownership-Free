---
name: Dev preview safety
description: Preview-all data isolation, exit behavior, and verification constraints.
---
Preview all is a viewing tool, never a way to mark prerequisites complete or save real progress. On exit, reload persisted real progress and discard all walkthrough state.

**Why:** The owner explicitly requires no preview edits left on screen after switching it off; server data may be shared with real usage.

**How to apply:** Guard local writes, startup reconciliation, queued sync, imports and navigation/theme persistence, not just room saves. Block writes during the old page's exit transition too. Preserve the extra local-only restriction on existing reset/seed tools when exposing the preview switch in DEV.

Browser testing may not be available: the testing subagent callback rejected its documented configuration in this environment. Screenshot capture is signed out and cannot establish room behavior. Report storage-unit checks separately from signed-in walkthrough verification; never bypass authentication just to take screenshots.

Authenticated browser fixtures require fail-closed write interception and positive evidence that interception caught normal-mode writes. Mocking the userdata collection GET alone does not isolate account progress.

**Why:** A browser acceptance run's filter missed nested userdata PUT URLs and fixture writes reached development account storage. Successful Preview scratch isolation does not protect a normal-mode fixture run.

**How to apply:** Block unapproved mutating requests before authenticating a test context, cover nested userdata paths, and fail if expected writes were not intercepted. Never use a real account as an assumed disposable fixture or guess at restoring overwritten answers.

The owner clarified on 2026-10-31 that the affected RC and set-aside stores had no real data and explicitly prohibited restoration or rollback. Do not treat that incident as pending recovery.

Browser tests must never write any real account's userdata. Use an isolated test identity or block all userdata writes, and prove the protection before the app walkthrough.

**Why:** The owner made this a standing requirement following the test-isolation incident.

**How to apply:** First prove collection and nested mutation interception with a disposable target and positive interception counts, then run the protected fixture walkthrough. Do not probe write safety against a real account.

Measure zero Preview writes before switching Preview off; after the reload,
ordinary synchronization of restored real progress may legitimately resume.

**Why:** A whole-transition zero-write assertion confuses normal post-exit
reconciliation with a Preview leak, even when original answers were restored.

**How to apply:** Assert no writes while Preview is active (including scratch
edits), then separately assert restored storage, restored gates and absence of
Preview-only content after exit. Keep interception enabled across both phases.
