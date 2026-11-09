---
name: Account exit safety
description: Sign-out cache boundaries and unsynced-answer protection.
---
Sign out must preserve remote answers, finish unsynced changes before discarding browser answer caches, and prevent one member's cached answers from appearing in the next login. If saving fails, retain local answers and explain the failure rather than silently discarding them.

**Why:** The owner explicitly requested account-local cache clearing while keeping account answers safe; treating logout as cookie removal alone can lose pending answers or expose them to the next member.

**How to apply:** Reuse the existing session logout. Clear answer/draft/navigation caches and in-memory answers only after saves and logout succeed. Preserve browser appearance preferences and do not delete account data.

Unknown or differently owned browser caches must be quarantined without assigning them to any account, never automatically adopted by the next login. This applies to restored sessions as well as fresh sign-in.

**Why:** Legacy unowned browser answers were uploaded into a second member's account. The owner explicitly approved preserving uncertain local copies separately rather than guessing their owner or discarding unsynced answers.

**How to apply:** Verify the shared owner boundary before answer reads, uploads or sync. Recovery copies are browser-only and must not be restored automatically, even if a former owner signs in again. An account change must cancel pending work as well as clear active data and navigation.
