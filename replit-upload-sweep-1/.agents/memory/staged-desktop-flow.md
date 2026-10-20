---
name: Desktop room flow decisions
description: Product constraints and staging-only verification lessons for the desktop room sweep
---

Desktop room flow applies from 768px; phones keep stacked content. The animal declaration must be additive to Own It's existing power/shadow cards and Big Claim.

**Why:** The user explicitly required preserving those original sections rather than replacing them with the declaration.

**How to apply:** Preserve all answer content when adjusting fit. Split or paginate instead of moving overflow into inner scrolling or clipping. Test populated animals and values, not only empty states.

Staged component-fixture tests are not authenticated application tests.

**Why:** A fixture can fit while the full room container adds enough header/navigation chrome to overflow. Browser automation was not available through the testing callback in this environment.

**How to apply:** Label fixture overflow and remount checks accurately; do not call them full-router refresh or sign-in verification. Keep fixture persistence isolated from user storage.
