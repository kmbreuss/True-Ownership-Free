---
name: Appearance preference compatibility
description: Preserve old explicit-looking theme choices; missing preference follows the device.
---
Treat any existing saved Light/Dark value as the member's choice. Do not infer that an old Light value was accidental, clear it during an upgrade, or silently replace it with device matching.

**Why:** The previous toggle automatically persisted Light on first load, leaving no reliable way to distinguish that default from a deliberate choice. The owner explicitly required keeping all saved choices.

**How to apply:** Default to device matching only when no valid choice exists; let the member explicitly select “Match my phone” to reset it. This is browser appearance state, not new saved account data. Preview changes must remain non-persistent.
