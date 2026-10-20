# Sweep 1: staged frontend changes

**Staged file:** `replit-upload-sweep-1/artifacts/true-ownership/src/App.tsx`. It is a full copy of the live file, changed only through targeted anchor edits. The live artifact is untouched and nothing was uploaded.

**Type check (re-run after these corrections):** I ran `tsc --noEmit` against the staged file in a temporary mirror of the project, then removed the mirror. The App.tsx error set (ignoring line numbers) is identical to the live file's, which already has many pre-existing implicit-`any` errors. So the edits introduce no new type errors. Nothing was tested in a browser.

## 1. Reusable building blocks

These are placed next to the existing `useVisionWide` helper.

### `DesktopSectionFlow` and `FlowSection`

- **Children are real React elements.** Each section is written as `<FlowSection label canContinue? hint?>…</FlowSection>`.
- **Below 768px** (checked with `matchMedia`, via the existing `useVisionWide`): every section renders stacked, exactly as before.
- **Desktop:**
  - Shows the existing `na2-sec-pips` stepper. The pips are clickable and labelled "Label · n of N".
  - Shows one active panel at a time. Inactive panels stay mounted but `hidden`, so local state, open pickers and input values survive paging.
  - Adds a Back / "Continue to {next label} →" footer.
- **Reload restores the section, scoped to the account.**
  - The pointer is saved per `flowKey` in `localStorage["to_section_flow_v1:<userId|anon>"]`. The user comes from `useAuth()`.
  - There was no existing logout cleanup for UI pointers. The account-menu logout button now calls `clearSectionPointers()` before `logout()`. It removes every `to_section_flow_v1*` and `to_twofutures_screen_v1*` key.
  - This is local only and not synced, the same as the existing `to_vision_step_v1`. Note: `to_vision_step_v1` itself is an existing key, is not account-scoped, and was left as is.
- **The veil stays entry-only.** Moving between sections never plays a veil.
- **The room's own nav still owns completion.**
  - CSS uses `data-dsf-pos` (first, mid, last, or only):
    - **First section:** the room nav's Continue is hidden, so only one Continue shows. Its Back stays and still goes to the previous step.
    - **Middle sections:** the room nav is hidden.
    - **Last section:** the room nav shows normally, plus a small "← {previous section}" link.
  - Every original completion handler and validation gate runs unchanged: `canContinue`, `onDone`, `handleDone`, `onContinueToClaim`, the Own It claim, and the Your Gifts ≤5-per-theme gate.
  - Section-to-section Continue does not add any new gating. It is navigation only, so you can never get stuck.
- **No scroll-inside-section workaround.** The earlier `max-height` / `overflow:auto` panel rule has been removed. Fitting the screen now relies only on sections and page sizes. Nothing is clipped, and there is no hidden `overflow`.

### `FlowPagedList`

- On desktop it pages long lists with ‹ / › controls and a "1–3 of 7 activities" label. Phones get the full list.
- Index callbacks receive the global index, so seat and priority numbering is preserved.
- When a list grows (an "Add" click), it jumps to the last page so the new row is visible.

### `.dsf-tabs`

Tab styling used by the Two Futures climb.

## 2. Rooms wired

| Room | Component | Desktop sections / paging |
|---|---|---|
| A2 Where time goes | `NewA2M2Step2Body` | Your activities (1 per page) → Your week |
| A2 The gap | `NewA2M3Step1Body` | What you logged → Intentional or invisible (2 priorities per page, plus Unaccounted) |
| A2 Rethink your time | `NewA2M3Step2Body` | Before you start (note and freed-hours hero) → Decide each activity (group accordions; the open group pages its activities 1 at a time) → Where the hours go (missing items 3 per page, priority commitments 2 per page) → Your move → What your Map of Me says |
| A3 Shape | `NewA3M3Step2Body` | Coach or critic (1 line per page) → The voice today → The voice on your side |
| A3 Fill the seats | `NewA3M5FillBody` | How the board works → Fill the seats (progress card plus 1 seat per page, plus Add a seat) |
| A1 Values · Name the Standards | `NewA1M4NameStandardsBody` | Group your behaviors (example and pool) → Name the standards (1 card per page plus New standard). The `na1-m4-disc-foot` Continue is hidden until the last section. |
| A1 Values · Rank | `NewA1M4RankBody` | Rank your values (4 rows per page, see the exception below) → Pressure-test. "Continue to Claim" shows only on the last section, still gated on `ptComplete`. |
| A1 Identity · Your Gifts | `NewA1M3View` | One section per theme (`M3_THEME_ORDER`). The counter bar stays visible; its "Continue to Superpowers" shows only on the last theme, with the same gate. |
| A1 Vision · Two Futures | `NewA2TwoFuturesBody` | Already one screen per step. Added: the climb screen (8) shows one lens at a time behind Time / Wealth / Self tabs on desktop, and the screen is restored exactly on refresh (see below). |

The flow keys are: `a2m2-where-time-goes`, `a2m3-the-gap`, `a2m3-rethink-your-time`, `a3m3-shape`, `a3m5-fill-the-seats`, `m4-name-the-standards`, `m4-values-rank`, `m3-your-gifts`, `m3-own-it`.

## 3. Identity · Continue to Under Pressure

- **Where:** `NewA1M3Container`, the `animals` room's `onSuperpowers` callback.
- **Before:** it called `closeRoom()`, which dropped the user on the Identity hub.
- **Now:** it bumps `refreshTick` and calls `launchRoom(underPressure)`. The shared NA1 entry veil plays with Under Pressure's threshold text, and the room content switches behind the rising veil.
- If Under Pressure is ever marked not shipped, it falls back to `closeRoom()`.
- The button's disabled-while-invalid gate is unchanged.

## 4. Own It (`NewA1M3OwnItView`)

- **New at the top:**
  - One card per animal, showing the animal label, the descriptor and animal name (`m3CreatureWithDescriptors`), and the optional cluster name.
  - The dynamic declaration line, for example "I am the Gracefully Wise Eagle, the … Dolphin, and the … Bear." It uses an Oxford comma and handles 1, 2, or N animals.
- **Kept as they were:** the per-animal power card, the shadow-to-gift pairing grid, the shadow card and the Big Claim. They are not replaced.
- **Desktop has three sections:**
  1. Your animals (the cards and the declaration).
  2. Powers & shadows (one animal triptych per page).
  3. The Big Claim (Big Claim, then Own it / Re-claim and the footnotes).
- **Phones** keep the single stacked page.
- **Cards now open by default.** The per-animal triptych is expanded unless the user collapsed it, so the original power/shadow cards are visible again. Previously the default was collapsed.
  - The header toggle still works and still persists `ownItUi.collapsed`.
  - Users who explicitly collapsed a card keep that choice.
- No new tokens and no emoji.

## Saved data

None of the persisted answer shapes changed: A2, A3, Mirror 3, Mirror 4 and vision are untouched. The only new storage is the UI-only `to_section_flow_v1` pointer map.

## Two Futures: exact refresh restore

- **Before:** `computeStartScreen()` derived the screen from completion flags. On reload, a user who had stepped back to an earlier screen landed somewhere else.
- **Now:** the current screen is written to `localStorage["to_twofutures_screen_v1:<userId>"]` on every change.
- **On mount** the saved screen is restored when it is an integer from 1 to 8 and no further than `computeStartScreen()`. This keeps the existing gating, so a stale value can never skip unfinished picks. Otherwise it falls back to the old completion-derived screen.

## Values Rank: exception

The user felt that splitting Rank across sections was wrong. I kept the two sections (Rank, then Pressure-test) but did not merge them, because the pressure-test card plus the ranked list do not fit one screen. Within the rank list, desktop shows 4 rows per page.

- **Moving across pages:** reorder with the ▲ / ▼ buttons. These act on the global index, so a value can move across a page boundary. After the move it lands on the neighbouring page, and the user has to page to follow it.
- **Drag-and-drop** still works, but only within the visible page.
- **With 4 or fewer values** there is no paging, and drag works across the whole list.
- **If the harness shows 5 or 6 compact rows fit,** raising `pageSize` (or removing paging) is a one-line change. That would restore full drag across the list.

## Round 3: fixes for the harness measurements

The harness measured the initial screen of each room at 1280x800, before → after:

| Room | Before | After | Fix in this round |
|---|---|---|---|
| Where time goes | 1608 | 88 | Activities now 1 per page. |
| The gap | 207 | 0 | No change. |
| Rethink your time | 1977 | 170 | The note and freed-hours hero moved to their own first section, "Before you start". "Decide each activity" now holds only the group headers and one activity. |
| Shape | 662 | 0 | No change. |
| Fill the seats | 282 | 0 | No change. |
| Name the Standards (empty) | 0 | 0 | No change. |
| Rank (empty) | 79 | 0 | No change. |
| Your Gifts | 776 | 34 | Desktop-only margin tightening when the flow is active. See below. |
| Two Futures | 231 | 231 | Chip screens now page their life areas 2 per page on desktop. See below. |

**Your Gifts spacing.** These rules apply only at 768px and up, and only while the section flow is on screen (`.m3-pick:has(.dsf.is-wide)`):
- subtitle bottom margin 22 → 10px
- legend bottom margin 36 → 12px
- helper card bottom margin 28 → 12px, with slightly less padding
- theme section bottom margin 32 → 6px
- counter bar top margin 40 → 10px, top padding 18 → 10px

Nothing is hidden and nothing is clipped. Font sizes are unchanged.

**Two Futures chip screens.**
- Each lens's areas are paged 2 per page on desktop (Time has 5 areas, so 3 pages; Wealth and Self have 3, so 2 pages).
- The pager is keyed per screen, so each screen starts on its first page.
- If Continue's "pick a chip for each area" nudge fires, the pager jumps to the page holding the first unpicked area. This uses the new `jumpToIndex` prop on `FlowPagedList`.
- Continue's gate (every area picked) is unchanged.
- Phones still show every area stacked.

**After-numbers for this round have not been measured.** I have not re-measured these four rooms after these fixes.

## Open issues

- **No browser verification, and no overflow measurements.** I have not measured 0px overflow at 1280x800 and do not claim it.
  - Page sizes were chosen conservatively (1 per page for seats, Shape lines, standards, Rethink activities and Own It animals).
  - The room header (eyebrow, title, lede) and room chrome still sit above every section. Sections whose fixed content is long may still overflow; candidates are the Rethink trade panel, the Two Futures chip screens, and the Your Gifts themes with many chips.
  - The harness should measure these.
- **Section Continue is ungated.** Validation stays at each room's original completion point by design. Example: The gap still requires its intents at the room-level Continue.
- **Your Gifts' "Continue to Superpowers"** still returns to the Identity hub (`onBack`). This was not in scope, so it is unchanged.
- **The section pointer is not cleared on room completion,** so reopening a finished room lands on the last-viewed section.
- **Rethink:** only one accordion group is open at a time. Its activities are paged 1 at a time. The group headers themselves are not paged; there are at most 4.

## Round 4: final audit fixes (not yet re-measured)

**Context.** The audit stepped through every section of every flow. All were 0px over except two last sections: Where time goes "Your week" (20px over) and Values Rank "Pressure-test" (87px over).

**Spacing fix.** The new CSS rules apply only at 768px and up. They are scoped to the last section of those two flows only (`.dsf[data-testid="flow-…"][data-dsf-pos="last"]`, plus `:has(~ …)` for the room header elements that sit before the flow). Nothing is hidden or clipped, and font sizes are unchanged.

- **Your week.** Estimated saving is about 60px.
  - lede bottom margin 24 → 12px
  - benchmark top margin 24 → 6px, padding 14/16 → 10/14px
  - totals top margin 24 → 12px, padding 18/20 → 14/18px
  - totals header bottom margin 14 → 8px
- **Pressure-test.** Estimated saving is about 120px.
  - eyebrow, title, subtitle and helper bottom margins: 14/10/22/default → 6/4/8/8px; helper padding 9/14 → 6/12px
  - pips bottom margin 14 → 6px
  - phase eyebrow margins 18/10 → 4/6px
  - pressure-test card padding 24/26 → 12/20px, bottom margin 18 → 6px
  - card title, subtitle and status margins tightened
  - last-section back-link top margin 10 → 2px

**Restoring the viewed page on reload.**
- `FlowPagedList` has a new optional `pageKey` prop. It defaults to `testId`.
- The page currently being viewed is saved as `page:<key>` in the same account-scoped map as the section pointer (`to_section_flow_v1:<userId|anon>`). Logout's `clearSectionPointers()` already clears it.
- On reload the saved page is restored. It is clamped to the list's current page count.
- These page keys are all unique and stable:
  - `a2m2-activities`, `a2m3-gap`, `a2m3-acts-<group>`, `a2m3-missing`, `a2m3-commitments`
  - `a3m3-thoughts`, `a3m5-seats`
  - `ownit-clusters`, `m4-standards`, `m4-rank`
  - `tf-domains-<screen>`: one per Two Futures chip screen
- Saved answers are not touched.
- **Combined effect:** a reload now returns to the same room step, the same section, and the same list page (current animal, area, seat and so on). For Two Futures, the screen is restored by `to_twofutures_screen_v1:<userId>` and the area page by `tf-domains-<screen>`.

**Not yet re-measured.** I have not re-measured overflow after this round.

## Round 5: populated-fixture overflows (not yet re-measured)

The audit ran on a populated fixture: 6 values, 9 behaviors, and 3 animals with their sentences filled in. It found three overflows, all on 1280x800 desktop:

| Section | Overflow |
|---|---|
| Rank, first section | 214px |
| Own It, Powers & shadows | 263px |
| Own It, Big Claim | 128px |

### Values Rank

- **Fewer rows per page.** The rank list now shows 2 values per page instead of 4. The ▲/▼ buttons still reorder across pages because they act on the whole list. Drag still only works within the visible page.
- **Header spacing.** The header compaction from round 4 (eyebrow, title, subtitle, helper, pips) now applies to both Rank sections, not just Pressure-test.
- **More spacing.** On the first section, the phase label margin and the rank list's bottom margin are also tightened.

### Own It: Powers & shadows

**Desktop.** The single "Powers & shadows" section is replaced by separate sections for each animal:
1. "{creature} · Superpower": the creature header and the original power card.
2. "{creature} · Shadow and power": the creature header and the original shadow-to-gift pairing grid. This section only appears when the animal has gifts, the same condition as before.
3. "{creature} · Under pressure": the creature header and the original shadow card.

- **How it's built.** All three come from one renderer, `renderSealCluster(c, part)`. It contains the original card JSX unchanged; each part simply shows its piece. The full Own It flow on desktop is Your animals → 3 sections per animal (9 for the fixture) → The Big Claim, so the fixture shows 11 pips.
- **Collapsing.** Desktop part sections are always shown expanded. The header toggle still saves `ownItUi.collapsed`, but it only takes effect in the phone layout.

**Phones.** They render `renderSealCluster(c, "all")` for every animal, in one section. That is the original card with header, power, pairing and shadow, so the phone layout is identical to before. The "no clusters yet" empty state is kept.

**Text.** No wording changed. Every sentence, label and chip is still shown.

### Own It: Big Claim and header

These rules apply on desktop only, when the flow is active (`.m3-seal:has(.dsf.is-wide)` or `.m3-seal .dsf.is-wide`). They change spacing only:

- **Header:**
  - eyebrow margins 6/14 → 2/6px
  - star margins 14/10 → 4/4px
  - title bottom margin 10 → 4px
  - subhead margins 6/32 → 2/10px
  - revisit banner tightened
- **Cards:**
  - pips bottom margin → 8px
  - each animal card padding 32 → 20/24px, bottom margin 22 → 6px
- **Big Claim:**
  - divider margins 36/28 → 6/10px
  - Big Claim padding 32 → 18/24px
  - label bottom margin 20 → 10px
  - shadow line bottom margin 22 → 10px
  - closing line top padding 14 → 8px
- **Actions and footer:**
  - claim actions top margin 28 → 12px (this overrides an inline style, so it uses `!important`)
  - footnote top margin 14 → 6px
  - back link top margin → 4px

By my estimate the Big Claim screen recovers about 180px, against the 128px measured.

### Checks

- **Not re-measured.** I have not measured overflow after this round.
- **Type check.** The App.tsx error set is identical to the live baseline, apart from line numbers.
