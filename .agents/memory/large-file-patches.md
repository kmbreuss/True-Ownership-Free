---
name: Ordered edits in the large app file
description: Patch ordering constraint that caused repeated unsuccessful edits.
---
All hunks updating the same file must be ordered by their actual source position,
not by feature or semantic group. Prefer small contiguous edits after reading the
exact current lines. A failed file update leaves that file unchanged; a separate
file action in the same patch may still succeed.

**Why:** The patch tool searches forward from the previous hunk. Grouping seal
copy before an earlier navigation handler caused otherwise matching edits to
fail. Similar mirror labels also make broad contexts unsafe.

**How to apply:** Sort same-file changes top to bottom, or separate them into
small calls. Use unique surrounding code and verify each part against the
existing diagnostic baseline. Honor the owner's per-part two-failure stop rule.
