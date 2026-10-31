---
name: Reality Check scope
description: Owner-approved rollout boundaries and future use of named defaults.
---
Reality Check's initial ship must not introduce account/schema/signup changes. Treat real accounts as members; free access is only a DEV, nonpersistent simulation. Real free signup and authoritative account access are deferred.

**Why:** The owner explicitly removed the account/database portion from the initial build authorization to keep it isolated.

**How to apply:** Do not infer permission to add users.access, registration, migrations or paid-discipline write restrictions from the original attached brief or draft plan. Obtain authorization for that later work. The current Reality Check is approved as the default journey without an opt-in URL; do not reinstate a query gate. Publishing still requires separate authorization.

Existing A1–A5 answers exempt an account from mandatory Reality Check; pristine seeds and navigation/bookkeeping alone do not. New accounts complete the journey before entering A1 rooms. Earlier completed RC rounds retain access during a redo.

**Why:** The owner explicitly requires the default rollout never to re-lock returning users, including accounts whose progress is loaded from the cloud rather than already present in this browser.

**How to apply:** Preserve the hydration-before-screen-mount barrier when evaluating the returning-user exemption. Check partial answers, local and delayed cloud data, plain URLs, restored room routes and completed-round redo. Keep the old saved-payload compatibility separate from presentation: only the current journey may render.

The Reality Check journey brief supersedes RC-1's per-area named defaults with a flat four-default object in internal payload version 2, retaining the existing storage key. The one-time authorization to reset older RC payloads does not authorize resetting version-2 journey answers; all other progress must survive.

**Why:** The owner explicitly replaces the questionnaire with a one-area journey and supplies a new stable store contract.

**How to apply:** Preserve version-2 J1 answers when extending the journey, never reset other stores, and keep optional named words out of completion prerequisites. The approved futures/choice ship includes completion, the Map reflection and the set-aside handoff. Consuming the one-thing answer in A4 and adding the A1 thread/bridge remain separate work.

A voluntary 90-day redo must keep prior completed words and the Map reflection available, without re-locking access earned through an earlier completed round.

**Why:** A redo is a fresh reflection, not permission to erase or invalidate an owner's earlier progress.

**How to apply:** Keep completed-round snapshots separate from the new draft. Completion side effects must be idempotent per round and preserve unrelated set-aside items.

RC one-screen acceptance includes phone and intermediate widths in both themes. Body scrolling with fixed progress/footer is accepted for long answers and for windows below 650px high. Other normal-length overflow remains a fit exception; never conceal it by clipping.

**Why:** The owner explicitly accepts short-window scrolling below 650px, while requiring scenes 4 and 6 to fit the standard fixture at 1366×680 through spacing alone. Typography, copy and the taller-window appearance must stay unchanged.

**How to apply:** Retain shared frame width, radius and close-button rules, but allow the brief's RC-only inner padding and header arrangement. Do not shrink type, clip answers or silently allow scrolling to force a pass. Keep five chapters when splitting Opening from Person A/B. Do not count a signed-out screenshot or a successful build as proof of signed-in fit.

Additional introductory panels must not shift the meaning of existing saved step numbers.

**Why:** The owner approved splitting Opening and Person A/B while explicitly prohibiting changes to stored answers, schemas or resume behaviour.

**How to apply:** Keep the extra introductory panel as view-only state, restore it on refresh without adding userdata fields, and prevent Preview's panel state from being restored into the real-account view. Future A beats and timeline reveals are likewise presentation-only: animate first forward arrival, never review/refresh, and show immediately for reduced motion without delaying Continue.

The RC start page uses the same centred shell as the A1 hub, with copy and Begin before the full-width video card, then the journey and quote. It may scroll; Begin should be above the fold.

**Why:** The owner explicitly requested the app's narrower stacked hub frame rather than an RC-specific wide composition.

**How to apply:** Preserve the full journey and quote below the fold; use a horizontal path only when it fits comfortably.

RC review must preserve the owner's choice and completion when earlier answers are edited. Reached chapters remain available, and completed review begins at scene 1 rather than the last scene.

**Why:** The owner explicitly wants to walk back through and edit all saved answers without losing the commitment already made.

**How to apply:** Track reached progress independently from the current screen and derive later reflections from current answers, not cached prose. Test first-arrival reveals with a genuinely fresh draft advanced forward, not a fully populated review fixture with a lowered step: later saved answers correctly imply reached progress. Do not weaken review detection to make that fixture animate.

The summary's “in you” words are lower-case prose joined as a list; this is not permission to change the saved answer or its presentation elsewhere.

**Why:** The owner requested grammatical mid-sentence wording while keeping their original words and data intact.

**How to apply:** Format only the generated summary fragment. Preserve the original capitalization, punctuation and complete answer in storage and the editing field.

RC typography must match the surrounding app's hierarchy, not flatten hub, room and card headings to one size. Keep the app's phone heading override. Clickable mirror sentences remain reflective words (Cormorant italic), not Questrial interface labels.

**Why:** The owner rejected the uniform small-type sweep and explicitly wants calm, simple screens that still look like the rest of the app.

**How to apply:** Use spacing, thin dividers and phone tabs rather than dense boxes or smaller type. Any type-size change must be shared by the whole role and listed in the delivery report.

An answer naming several tied defaults must not be assigned to one individual default. Keep earlier individual answers intact, and respect an explicitly blank combined answer rather than reviving older words.

**Why:** One combined prompt can describe several patterns; redistributing it would misrepresent the owner's words or erase earlier answers.

**How to apply:** Keep the combined answer distinct through saved-state normalization, later reflections and the set-aside handoff.

RC review changes must use a single agent and isolated browser tests; stop and report after a second verification failure. Do not publish without separate authorization.

**Why:** The owner has repeatedly required these limits for RC review work.

**How to apply:** Do not start helper/reviewer loops or keep adjusting after the second failure; report the remaining issues and wait.

The mirror statement order is intentional: each six-card set must expose two statements per area. Do not reorder by selection or area just to simplify a compact layout.

**Why:** The owner requires balanced exposure to all three areas before continuing, not merely three picks from the first visible subset.

**How to apply:** Measure available body space rather than using a phone breakpoint to choose six versus twelve cards. Whenever the six-card layout is active, Continue requires viewing both sets plus three total selections, including in Preview. Preserve selections across paging and live resizing.

Typography checks must follow the currently approved visual brief; older minimum-based mirror assertions are not authoritative for the rebuilt quote cards.

**Why:** Earlier minimum-based mirror styling was deliberately superseded by the owner's true-size brief, which specifies distinct sizes for quote cards, inputs and individual scenes.

**How to apply:** Verify explicit role sizes and per-scene exceptions from the current brief, and measure fit at their actual rendered sizes. Do not reinstate superseded assertions to force a match with an older design.

Editable-field fit must include its usable content height, not just its outer rectangle or whether it grows.

**Why:** A capped field can pass growth and room-overflow assertions while inherited textarea padding leaves less space than the promised number of complete text lines.

**How to apply:** Check computed line height, padding and borders against actual visible content, and visually inspect loaded and edited multiline answers. The price ledger wraps without a line cap or underline. All three ledger answers and both next-year letter answers have a soft 120-character guideline, with counters from 100 onward: never truncate loaded text or block Continue. Longer text may scroll inside the body while progress/footer remain fixed. Lower-case letter insertions are display-only, including during editing; never rewrite stored case merely to improve the sentence.

Browser verification must capture window error events and unhandled rejections as well as uncaught JavaScript exceptions.

**Why:** The development runtime plugin can turn an error event without an Error object into an “unknown runtime error” overlay. Playwright's exception listener alone missed the event while the overlay blocked real navigation.

**How to apply:** Record these events in the regression's error collection and leave the development overlay enabled. Do not dismiss or disable it merely to make navigation checks pass.
