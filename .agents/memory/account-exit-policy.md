---
name: Account exit safety
description: Sign-out cache boundaries and unsynced-answer protection.
---
Sign out must preserve remote answers, finish unsynced changes before discarding browser answer caches, and prevent one member's cached answers from appearing in the next login. If saving fails, retain local answers and explain the failure rather than silently discarding them.

**Why:** The owner explicitly requested account-local cache clearing while keeping account answers safe; treating logout as cookie removal alone can lose pending answers or expose them to the next member.

**How to apply:** Reuse the existing session logout. Clear answer/draft/navigation caches and in-memory answers only after saves and logout succeed. Preserve browser appearance preferences and do not delete account data.
