---
name: True Ownership App.tsx — giant single-file app
description: Working conventions for the ~50k+ line single-file React app and its ?newA1=1 surface gating.
---

# artifacts/true-ownership/src/App.tsx is one enormous file

The entire True Ownership app (auth gate, A1 grid, all four Mirrors, Entry Hall,
Framework, Spine) lives in a single `App.tsx` of tens of thousands of lines.

**Gotcha — the `read` tool reports a stale/wrong line count and "file length"
for this file** (e.g. claims ~27k when the file is ~55k). Trust `wc -l` + `sed`/
`rg` for line numbers, not `read`. Edit with `edit` using copied context, and
verify with fresh `rg`/`sed`, not `read` offsets.

**Why:** the file is large enough that the read tool's snapshot lags behind
edits, so its line numbers drift and lead you to edit the wrong place.

**How to apply:** when working in this file, locate anchors with `rg -n`,
read ranges with `sed -n 'A,Bp'`, and after edits re-`rg` to confirm.

## Pre-existing typecheck noise

`pnpm --filter @workspace/true-ownership run typecheck` emits ~1000+ pre-existing
TS7006/TS7031/TS7053 "implicitly any" errors plus junk from `App (copy)*.tsx`
files. These are unrelated to new work. To verify your change, filter errors to
your edited line ranges (`rg -o 'App.tsx\((\d+),' -r '$1' | awk` a range), don't
expect a clean run. Verify with `typecheck`, never `build` (build needs the
workflow-provided PORT/BASE_PATH and fails from bash).

## New experimental surfaces are gated behind `?newA1=1`

The Entry Hall / Framework / Spine / new A1 grid render only when the URL has
`?newA1=1`. The app is auth-gated (email+password, invite-only login screen), so
these surfaces cannot be screenshotted without credentials — the user walks them
with their own account.

## Video surfaces: data in videoConstants.ts, but UI is per-surface

`videoConstants.ts` (`VIDEOS` record, `isVideoReady`, `getVimeoEmbedUrl`) is the
single source of truth for all seven video surfaces' metadata. Only surfaces
with a `vimeoId` are "ready" and playable; the rest render a placeholder.

**Gotcha:** adding a `vimeoId`/`vimeoHash` to a surface in `videoConstants.ts`
does NOT auto-make it playable. Each surface needs its own player-capable card
component wired to its `VIDEOS[...]` entry. Only the Entry Hall (`EntryHallVideoCard`
in App.tsx) has that treatment so far. Future video ships must add the card UI to
the target surface (Framework / A1 hub / M1–M4), not just the data row.

**Vimeo embed:** private videos need the `?h=<hash>` unlock param or the embed
fails with "video unavailable". Never autoplay (browsers block it without a user
gesture anyway). Mobile (<600px) opens a full-screen portal overlay that pushes a
history entry so the Back button dismisses it; desktop expands inline.

## Breadcrumb "Entry Hall" link threading

The `onEntryHall` handler must be threaded through *both* a hub view component
(e.g. `NewA1M3HubView`) *and* its container (`NewA1M3Container`) — the container
declares the prop but you must also forward it into the hub, or the hub's
breadcrumb `<a onClick={onEntryHall}>` throws "onEntryHall is not defined".
