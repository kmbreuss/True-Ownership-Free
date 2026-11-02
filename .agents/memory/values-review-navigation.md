---
name: Values review navigation
description: Product boundary for the continuous Values journey and non-destructive review.
---
Values has one continuous order: Opening → Admire → Irks → Portrait → Flip → Name (sort, check/star cards, display-only summary) → Rank → Pressure test → Claimed.

**Why:** The owner explicitly replaced return-to-hub exercise navigation with a continuous path, including when revisiting saved work.

**How to apply:** Back/Next stay within Values. The four progress parts and opening trail jump to the first screen of their part. Claimed review starts at Admire and ends with “Done reviewing →” returning to the Values Opening, never a new claim ceremony or Identity handoff. Navigation alone must not finalize optional flips or alter completion flags; explicit answer edits still save. Only × or the Opening's Back to A1 leaves Values.

Name's sorting queue, skipped-card order and card faces are temporary presentation, not answers.

**Why:** The owner requires the existing saved schema unchanged and explicitly says skipping and turning cards must never save.

**How to apply:** First-time Name entry derives sorting versus cards from saved assignments; claimed Name entry opens the cards. Do not add saved step, skip-order or card-face fields.

Name checking, renaming and starring happen on card backs; the repeated one-standard-per-screen editor is retained but excluded from the journey.

**Why:** The owner replaced the duplicate naming pass with card-back checking and starring. Existing saved meanings and evidence must not be discarded.

**How to apply:** Cards go directly to the named-standards summary, whose Back returns to cards. Keep old data and editor code without routing first visits, revisits or trail navigation through it.

Pressure-test completion requires an actual saved choice for every active comparison; skipped or missing answers do not count.

**Why:** The owner requires footer navigation not to bypass Claim's completion gate.

**How to apply:** Both Done and the Done-screen footer use the same guarded completion action. Incomplete footer navigation keeps its prior behavior without marking complete. Review navigation never writes completion.

Verify pressure-test completion with a genuinely fresh answer sequence, not only pre-answered Done-screen fixtures.

**Why:** Pre-answered fixtures passed while the live final-answer transition still failed, masking the first-time member's inability to claim.

**How to apply:** Keep a synthetic end-to-end check that starts without pressure answers, makes the choices through the UI, uses the footer, and successfully claims. Retain separate skipped/missing-answer and claimed-review checks.
