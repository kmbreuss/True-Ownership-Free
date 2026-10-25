---
name: Dev preview safety
description: Preview-all data isolation, exit behavior, and verification constraints.
---
Preview all is a viewing tool, never a way to mark prerequisites complete or save real progress. On exit, reload persisted real progress and discard all walkthrough state.

**Why:** The owner explicitly requires no preview edits left on screen after switching it off; server data may be shared with real usage.

**How to apply:** Guard local writes, startup reconciliation, queued sync, imports and navigation/theme persistence, not just room saves. Block writes during the old page's exit transition too. Preserve the extra local-only restriction on existing reset/seed tools when exposing the preview switch in DEV.

Browser testing may not be available: the testing subagent callback rejected its documented configuration in this environment. Screenshot capture is signed out and cannot establish room behavior. Report storage-unit checks separately from signed-in walkthrough verification; never bypass authentication just to take screenshots.
