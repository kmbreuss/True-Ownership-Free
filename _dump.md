===CLAUDE.md===
# True Ownership — Claude Code Master Context

## Read this first in every session

You are working on Katherine Breuss's True Ownership app for AG45 (Accelerate Growth 45). This file is the single source of truth for project state. Read it before doing anything else.

## Project at a glance

- **Owner**: Katherine Breuss, life and business coach at accelerategrowth45.com
- **Product**: True Ownership — a 45-45-45 coaching architecture based on the 5As framework (All In It, Align With It, Advocate For It, Act On It, Accountable To It)
- **Main app**: React/TypeScript single-file at `./artifacts/true-ownership/src/App.tsx` (~4823 lines)
- **Stack**: React + Vite + TailwindCSS + shadcn/ui + localStorage persistence
- **Runtime**: Replit (this repo is the live preview app)

## Architecture (45-45-45)

1. **45 seconds — The Mindset Shift**: Standalone Own It Scale quiz. Produces one of 4 named identities.
2. **45 minutes — The Self-Worth Sitting**: 7-section free experience. Ends with Snapshot + "The One Thing" commitment.
3. **45 days — True Ownership paid app**: A1 through A5 + Map of Me (top-level) + Tracker.

## Current state of the build

### A1 — in progress
- **Live pages**: Purpose, BAG (Direction), Identity/Superpowers, Values/Behaviors, Alignment Check, My Map of Me
- **Phase A complete (April 2026)**: Three new sidebar items added as scaffold pages:
  - Direction · 3-Year
  - Direction · 1-Year
  - Direction Alignment
- **Next up**: Wealth transformation on BAG page (Phase B sub-phase W.1)

### A2-A5 — not started
Will be built as prototypes in Claude first, then ported to Replit in one coordinated migration.

### Map of Me — deferred
Will be its own TOP-LEVEL section alongside A1-A5, not inside any A. Built LAST because synthesizes everything. Current `./artifacts/true-ownership/src/App.tsx` still has the old "My Map of Me" page in the sidebar — archived, will be rebuilt from scratch.

### Tracker, email reminders, 45-sec quiz, 45-min sitting
Not yet built.

## LOCKED design decisions (do NOT re-open unless Katherine explicitly asks)

### A1 BAG page

**Time segment**: chip picker for life priorities (EXISTING PATTERN — working, do not touch). Max 5 areas. Per-priority card with per-item See/Hear/Feel fields + Summarise-into-a-goal button.

**Wealth segment**: transform to match Time's chip-picker pattern. 
- Default chips: Retirement, Assets, Cashflow, Passive Income, Real Estate
- Plus "+ Add your own" (no Business Equity or Giving)
- No max limit specified (unlike Time's max 5)
- Per-item UI: single vision textarea + Summarise-into-a-goal button (NO See/Hear/Feel split — different from Time)

**Growth segment**: delete the 4 static categories (Skills & Learning / Relationships / Purpose & Contribution / Other). Replace with single free-text field + Summarise-into-a-goal button.

**All segments**: collapsible (ALREADY EXISTS — `timeOpen`, `wealthOpen`, `growthOpen` state).

**Tier ranking** (not yet built): at the bottom of each segment. Non-negotiable (hard cap 3), Should-have, Nice-to-have.

### A1 Alignment Check page

Currently scores only against BAG (via `align1_*` keys). Will extend to 3 horizons: BAG + 3-Year + 1-Year using `align1_*`, `align2_*`, `align3_*` prefix pattern. Schema already anticipates this.

Remove the "See My Key Misalignment" output at the bottom — that diagnosis moves to A2.

### Own It Check

Currently lives on BAG page (a `body/lights/meant` slider self-assessment). **Move to A4** (Act On It) — belongs there, not in vision-setting.

### A2 principles

- Future Self Letter pre-fills from BAG's three See/Hear/Feel blocks
- Alignment Review Panel at top: bidirectional sliders synced with A1
- Misalignment Surface reads from A1 Alignment Check lowest scores

### A3 principles

- 3 sub-steps only (NOT the old 7): Energy Audit / Energy Map / Board
- Energy Audit dimensions: People, Thoughts, Habits, Places (Tasks is OUT, it lives in A2 Time Audit)
- Best Friend Test is a question INSIDE Thoughts dimension, not standalone
- Energy Map: bullseye radial visualization mirroring old Module 3 style. Goal at center, items plotted by fuels/neutral/drains proximity.

### Free sitting principles

- 7 sections (not 9). Energy Audit and People Audit removed — those are paid A3 exclusives.
- "People in your corner" section is minimal: list names + "Are there gaps?" reflection.
- Gap-language is EMBEDDED in questions and Katherine's commentary throughout — not salesy, structural.
- Snapshot includes "The One Thing I will implement today" as a commitment field.

### Map of Me principles

- Its own TOP-LEVEL section in the main nav (alongside 5 As and Tracker)
- NOT a page inside A1 or sub-step of A5
- Populates progressively as user completes each A
- Fully synthesized at end of A5
- Lifetime living document — user returns quarterly

## Reference files in this repo

- `./artifacts/true-ownership/src/App.tsx` — the live app code
- `./artifacts/true-ownership/src/App.tsx.bak_pre_v3_port` — backup from before Phase A
- `./artifacts/true-ownership/src/App.tsx.bak_pre_growth_cleanup` — backup from before Phase B work
- `./artifacts/Prototypes/` — design reference files (see below, Katherine uploads manually)

## Planned files to upload (Katherine to do once)

Katherine will upload these into `./artifacts/Prototypes/` in the Replit file tree:
- `a1_direction_prototype_v2.jsx` — Full A1 prototype with Wealth, 3-Year, 1-Year, Direction Alignment UI. Source of truth for A1 design.
- `true_ownership_plan_v3.docx` — Full strategy spec
- `TRUE_OWNERSHIP_HANDOFF_BRIEFING.docx` — Session handoff briefing

Once uploaded, always read the prototype before making design decisions.

## Technical rules

1. **NEVER use Replit Agent.** It has historically broken IIFE syntax. All edits must be via Python string-replacement scripts in the shell, or via Claude Code direct edits.
2. **Always backup before phases**: `cp ./artifacts/true-ownership/src/App.tsx ./artifacts/true-ownership/src/App.tsx.bak_pre_<descriptor>`
3. **IIFE fragile zone** at approximately line 1094. Before editing near it, verify: `sed -n '1090,1098p' ./artifacts/true-ownership/src/App.tsx`. If broken JSX, fix with: `sed -i '1094s/<\/>.*$/<\/>/' ./artifacts/true-ownership/src/App.tsx`
4. **Data persistence**: localStorage. Key prefixes: `KEYS.map`, `KEYS.done`, `KEYS.step`, `KEYS.voice`.
5. **State routing**: single-file app uses `const [step, setStep] = useState("to_intro")` string-based routing. No react-router.

## Key file landmarks in App.tsx (approximate, shift by ~25 after Phase A)

- Line ~210: `function LifeAreaSelector` — chip picker component (reusable pattern)
- Line ~302: `function LifeAreaCard` — per-priority card component
- Line ~427: `const [timeOpen, setTimeOpen] = useState(true)` — collapsible state
- Line ~431: `const SectionHeader` — reusable collapsible header
- Line ~1094: IIFE fragile zone (verify before editing near)
- Line ~1167: STEPS array (sidebar nav source — now 10 items after Phase A)
- Line ~1177: EMPTY_MAP (data schema)
- Line ~1199: MIRROR_CARDS (mirror pairings)
- Line ~1696: `function A1({ intake, onDone })` — the A1 container
- Line ~4500+: MapDownloadSection (PDF — archived, will be rebuilt)
- Line ~4767: `export default function App()`

## Next session — execute Phase B W.1 (Wealth transformation)

Goal: Replace the 4 static Wealth cards on the BAG page with a chip-picker pattern matching Time.

Steps:
1. Read `./artifacts/Prototypes/a1_direction_prototype_v2.jsx` — find the Wealth section reference design
2. Take backup: `cp ./artifacts/true-ownership/src/App.tsx ./artifacts/true-ownership/src/App.tsx.bak_pre_w1`
3. Add to EMPTY_MAP: `wealth_chips: []`, `bag_wealth_items: []`
4. Add `WEALTH_AREA_PRESETS` constant near `LIFE_AREA_PRESETS` (Retirement, Assets, Cashflow, Passive Income, Real Estate, + custom support)
5. Build `WealthChipSelector` component (mirror LifeAreaSelector, remove max-5 constraint, use wealth presets)
6. Build `WealthItemCard` component (mirror LifeAreaCard but ONE vision textarea + Summarise button — no S/H/F split)
7. Find the Wealth section rendering in A1 BAG view and replace 4 static cards with `<WealthChipSelector ...>` + items map
8. Leave `bag_retirement/bag_assets/bag_cashflow/bag_other` fields in EMPTY_MAP intact (downstream Alignment Check / Map of Me still read them — they just won't be populated from BAG anymore)
9. Verify in preview: Wealth section now shows chips, selected chips create item cards, each card has single vision + Summarise button
10. Commit: "W.1: Wealth transformed to chip-picker pattern"

## How to work with Katherine

- She's the decision-maker, not the implementer
- She has strong design instincts and locks decisions once made
- She prefers seeing small steps shipped over big planning docs
- "Clean swap" means don't preserve old state dual-write; just cut over
- She trusts good work; she'll flag when something doesn't feel right
- When she says "agreed" or "yes" it means proceed, not keep asking

===SESSION_LOG.md===
# True Ownership — Session Log

**Purpose**: Rolling summary of decisions and progress so new chats pick up where we left off. Updated at the end of every session. Read this AFTER CLAUDE.md.

---

## Current status as of April 2026

**Last session**: Phase A shipped (3 new sidebar pages), Phase B W.1 planned but NOT executed.

**Where the app is right now**:
- A1 sidebar has 10 items (7 original + 3 new scaffold pages for 3-Year, 1-Year, Direction Alignment)
- BAG page (Purpose · Direction) still has the OLD Wealth section with 4 static cards (Retirement, Assets, Cashflow, Other)
- BAG page still has the OLD Growth section with 4 static cards (Skills & Learning, Relationships, Purpose & Contribution, Other)
- Time segment on BAG works correctly with chip picker — do NOT touch
- Everything else unchanged from the previous stable state

**Backups in place**:
- `App.tsx.bak_pre_v3_port` — before Phase A (4798 lines)
- `App.tsx.bak_pre_growth_cleanup` — before any Phase B work
- `App.tsx.bak3`, `App.tsx.bak_pre_phase3` — older backups from prior sessions

---

## Immediate next action

**Phase B W.1 — Wealth transformation** (smallest truly-additive first step)

This is where we stopped. Not executed yet. When resumed, do this:

1. Take backup: `cp App.tsx App.tsx.bak_pre_w1`
2. Add to EMPTY_MAP: `wealth_chips: []` and `bag_wealth_items: []`
3. Add `WEALTH_AREA_PRESETS` constant near `LIFE_AREA_PRESETS` with:
   - Retirement, Assets, Cashflow, Passive Income, Real Estate + custom support
4. Build `WealthChipSelector` component (mirror LifeAreaSelector, no max-5)
5. Build `WealthItemCard` component (one vision textarea + Summarise button, NO S/H/F split)
6. Find and replace the Wealth section rendering on the BAG page
7. Leave `bag_retirement/bag_assets/bag_cashflow/bag_other` in EMPTY_MAP intact (downstream reads them)

**After W.1 completes**, next sub-phases queued:
- W.2: Alignment Check migration (iterate over bag_wealth_items instead of hardcoded 4)
- W.3: Growth cleanup (delete 4 static categories, replace with free-text + Summarise)
- W.4: Tier ranking across all three segments (Non-negotiable cap 3 / Should-have / Nice-to-have)

---

## Decisions locked (do NOT re-litigate)

### Architecture

- **45-45-45**: 45-sec quiz + 45-min sitting + 45-day paid app (A1-A5 + Map of Me + Tracker)
- **Map of Me**: top-level section, NOT inside any A, built LAST
- **Current Map of Me page and PDF download**: ARCHIVED. Do not sync with new schema. Will be rebuilt from scratch.

### A1 BAG page — Time segment

- Chip picker with 10 preset life areas, max 5, + Add custom
- Per-priority: See/Hear/Feel fields + Summarise button
- EXISTING PATTERN — do NOT modify

### A1 BAG page — Wealth segment (target state after W.1)

- Chip picker — defaults: Retirement, Assets, Cashflow, Passive Income, Real Estate
- NO Business Equity or Giving in defaults
- + Add your own (custom)
- NO max limit (unlike Time)
- Per-item: single vision textarea + Summarise button
- NO S/H/F split (different from Time)

### A1 BAG page — Growth segment (target state after W.3)

- Delete 4 static categories entirely
- Single free-text field + Summarise button
- Same pattern as current per-priority Summarise

### A1 BAG page — All segments

- Already collapsible via `timeOpen/wealthOpen/growthOpen` state — do NOT re-build
- Tier ranking at bottom: Non-negotiable (hard cap 3), Should-have, Nice-to-have

### Own It Check

- Currently on BAG page (body/lights/meant sliders)
- MOVE to A4 (Act On It) — leave code alone for now, wire into A4 when A4 is built

### A1 Alignment Check

- Current: scores against BAG only via `align1_*` keys
- Target: 3 horizons (BAG + 3-Year + 1-Year) via `align1_*`, `align2_*`, `align3_*` keys
- Remove "See My Key Misalignment" output (moves to A2)
- Rename to "Direction Alignment", becomes A1 page 8

### A2 (not built yet)

- Future Self Letter pre-fills from BAG's S/H/F blocks
- Alignment Review Panel at top: bidirectional sliders synced with A1
- Misalignment Surface reads lowest scores from A1 Alignment Check
- Time Audit lives here (NOT in A3)

### A3 (not built yet)

- 3 sub-steps: Energy Audit / Energy Map / Board
- Energy Audit dimensions: People, Thoughts, Habits, Places (Tasks is OUT)
- Best Friend Test is inside Thoughts dimension, not standalone
- Energy Map: bullseye radial visualization

### Free 45-min sitting

- 7 sections (not 9)
- Energy Audit and People Audit REMOVED from free (paid A3 exclusives)
- "People in your corner" section: minimal list + "Are there gaps?" reflection
- Gap-language embedded in questions, NOT salesy
- Snapshot includes "The One Thing I will implement today"

---

## Working method for Katherine

1. Katherine decides, Claude executes
2. When she says "yes" or "agreed", proceed — don't re-check
3. Small shipped steps over big planning docs
4. "Clean swap" = don't dual-write, just cut over
5. Show the work before/after, not just describe
6. Use Python string-replacement scripts in Replit Shell (NEVER the Replit Agent)
7. Back up before every edit
8. Rollback takes 1 second — use it freely if anything feels off

---

## Tool setup

**Current tools**:
- Claude.ai chat + Claude-in-Chrome extension (driving Replit via browser)
- Replit Shell (Python scripts for code edits)
- CLAUDE.md + SESSION_LOG.md + NEXT_STEPS.md in workspace root (permanent context)

**Claude Code** was explored but deferred — current setup works. Revisit if re-inspection overhead becomes a blocker again.

---

## Session history

### Session X (April 18, 2026) — Phase A ship + Phase B planning

- Built v3 strategy doc update with Map of Me as top-level
- Created handoff briefing doc (319 paragraphs)
- Built 45-45-45 user journey HTML visualization
- Wrote A1 Replit Port Plan (374 paragraphs)
- Executed Phase A: 3 new sidebar pages added successfully
- Decided on Wealth chip list (Retirement, Assets, Cashflow, Passive Income, Real Estate)
- Decided Own It Check moves to A4
- Decided Map of Me and PDF archived
- Created CLAUDE.md, NEXT_STEPS.md, SESSION_LOG.md in workspace
- Did NOT execute Phase B W.1 (ran out of time re-inspecting)
- Key learning: re-inspecting each session wastes time; trust CLAUDE.md and execute

### (Next session to add entry here after it runs)

---

## Open questions / parking lot

- Wealth per-item hint text: "Describe your vision for [category] in 10-15 years" or something more specific?
- When to tackle the BAG "In one sentence" top-of-segment fields? Keep as-is, replace with Summary Generator, or leave decision for after W.1-W.4 are done?
- Tier ranking UI: drag-and-drop, click-to-add, or dropdown? (Decide when building W.4)


===PROTOTYPES FOLDER===
./artifacts/Prototypes
./artifacts/Prototypes/a1_direction_prototype_v2.jsx
./node_modules/.pnpm/setprototypeof@1.2.0
---
no prototypes/ at root
no prototypes in artifacts/true-ownership
no prototypes in artifacts/
