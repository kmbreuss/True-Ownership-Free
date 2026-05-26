# Mirror 4 · Values · Build Plan for Replit

**Last updated:** May 26, 2026
**For:** Fresh Claude → Replit Agent
**App:** True Ownership (https://b8363272-ff9f-404c-9632-5af68f34d738-00-2kazqkj8gufie.spock.replit.dev/)
**Project:** https://replit.com/@katherine62/True-Ownership
**Flag:** `?newM4=1` (mirrors `?newM3=1` pattern)
**Total sections:** 6
**Estimated ships:** 6 separate dev deploys, each independently testable
**Reference mockup:** `Values_Mirror4_LiveTokens.html` (locked structure + tokens — this is the visual source of truth)

---

## 0 · How this works

Katherine pays per Replit Agent change, so we ship in sections to verify each one before moving on. **Never bundle two sections into one Replit prompt.** Each section is a self-contained brief with an explicit "definition of done" and a "do not" list.

After Replit ships a section, Katherine tests on `spock.replit.dev`. If acceptable, the next section ships. If not, Replit Agent fixes within section scope (no scope creep).

**Critical anti-pattern to avoid (S23 lesson):** when Replit Agent proposes new DB columns, new resolver functions, new endpoints — sanity-check against the actual ask before approving. Subtractive revisions are often the right answer.

**File of interest:** all changes go into `public/workspace.html` (single-file architecture). Reuse M3 patterns wherever they exist; do not invent parallel patterns.

---

## 1 · Mirror 4 Final Architecture (locked)

### Hub structure (matches M3 hub)
- Breadcrumb · eyebrow `A1 · MIRROR 4 · EXPLORE WITH KATHERINE` · big serif title `Values · The Order You Live By` · italic subtitle `Three rooms. At least three values. One decision filter.` · return-anytime helper line
- Katherine video brief intro card
- 4 room cards: Discover · Operationalize · Rank · Claim (gold-accented seal card)
- Locked rooms show "Unlocks after [previous room]"

### Room 1 · Discover (8 sub-screens in one overlay)
1. Admire — single big question, inline intensity tags (`★ Lights me up · Warms me`), optional `+ tag a person` chip
2. Irks — same shape, burgundy intensities (`Bothers me · ⚡ Turns my stomach`)
3. Portrait — quadrant reveal, drag/delete/add between tiers
4. Katherine's Read — overview only, cluster count + brief proposals
5. Value 1 — per-value screen (behaviors w/ flips nested → `Name this value ★` CTA opens naming modal → define modal auto-opens after name confirmed → compact completed card on return)
6. Value 2 — same shape, cluster-color accent (green `#5C9A6B`)
7. Value 3 — same shape, cluster-color accent (purple `#9B7CC2`)
8. Confirm — summary cards + soft-min-3 prompt + `+ Add another value` option

### Naming modal (lifts over per-value screen with blur)
- **State A · Peel:** behaviors anchor at top, peel breadcrumb growing as user peels, current peel question with gold-tinted user word ("What does X give you?"), peel input, `Keep peeling →` button, `Ask Katherine for a name suggestion` chip (on-demand). After first peel, small underlined `I'm ready to name this →` link appears.
- **State B · Name:** name input big gold serif, helper line, `← Keep peeling` link + `Confirm name ★` button. State B triggered by clicking ready-to-name link OR by clicking a Katherine suggestion pill.
- Katherine's suggestion: walks the chain and proposes 1-3 candidate value words as serif gold pill buttons.

### Define modal (auto-opens 280ms after naming modal closes)
- Header: `★ Define your value · what does this mean to you?`
- Named value at top in gradient anchor card with ★
- Behaviors list as compact chips below name (so user sees both name AND behaviors anchor)
- Katherine-voice prompt: `*Katherine,* what does **[NAME]** mean to you? This is what shows when you're using it as your decision filter — *make it real.*`
- Textarea (pre-fills with existing definition on re-edit so user edits not restarts)
- `+ Ask Katherine for feedback` chip — on-demand only
- `← Edit name` (reopens naming State B) + `Confirm definition ★`

### V1/V2/V3 completed card (replaces name/define cards after both modals close)
- 3px gold left border, gradient gold-warm to transparent background
- ★ star icon centered
- Big gold serif name
- Italic serif definition
- Tiny underlined edit links: `edit name` · `edit definition`

### Room 2 · Operationalize
- Value-switcher chips at top
- Per-value behavior cards (pre-filled candidates from Room 1 with provenance chips: FROM "LIGHTS ME UP" / FLIPPED FROM "TURNS MY STOMACH" / etc)
- Max 5 behaviors per value, edit/add/remove freely
- Keystone star (top-right of each card) — mark ONE behavior per value as keystone (with skip option)

### Room 3 · Rank
- Numbered ranked list 1-N (no metaphor, clean numbers — cairn/staircase/etc all explicitly rejected)
- Drag to reorder
- `Begin pressure-test →` CTA opens pressure-test modal

### Pressure-test modal (lifts over Rank room with blur)
- **Intro screen:** mini example using Loyalty vs Honesty to teach "collision" concept ("When two values collide, one wins... A friend asks you to keep a secret that goes against what you stand for...")
- **Pair screens:** counter `Pair X of Y`, prompt `When [Value A] and [Value B] *collide* — which wins?`, two pair-cards side-by-side showing name + definition + keystone behavior
- **Inline conflict prompt** appears when user's pick contradicts their stated rank: "Your gut said something different. You picked X — but you ranked Y higher. Re-order or stand by rank?"
- **Done screen:** ★ star, "Order tested." title, gold `Continue to Claim →` CTA
- Skip option per pair: "Skip — they don't actually compete for me"

### Claim · Seal
- ★ anchor centered
- Italic serif beats with named vocative + gold-tinted phrases (see mockup for exact copy)
- Gold rule
- Gold pill CTA `Claim it · go to Map of Me →`
- "You've claimed your Values. The seal stays." foot
- `← Revise my Values readback` escape hatch

---

## 2 · Design tokens (already shipped in app — DO NOT redefine)

These are already in `:root` of `workspace.html`. Mirror 4 reuses them. Do not add Mirror-4-specific variants except for `--c1`, `--c2`, `--c3` if not already defined.

```css
/* Background tiers */
--bg: #0d1b2e
--bg2: #112240
--bg3: #1a2f4a   /* overlay card background */
--bg4: #1e3554

/* Text */
--text: #f4f1eb
--text2: #d4cfc5
--text3: #7d8a98 (faint)

/* Gold (primary brand) */
--gold: #c9a84b
--gold-warm: rgba(201,168,75,.06)
--gold-soft: rgba(201,168,75,.14)
--gold-line: rgba(201,168,75,.32)
--gold-glow: rgba(201,168,75,.45)

/* Burgundy (cost / friction / negative) */
--burgundy: #b34d52
--burgundy-soft: rgba(179,77,82,.15)
--burgundy-line: rgba(179,77,82,.45)

/* Cyan / teal (Katherine voice) */
--cyan: #6aa9b8
--cyan-soft: rgba(106,169,184,.12)
--cyan-line: rgba(106,169,184,.40)

/* Cluster colors (Mirror 4 specific — ADD if not present) */
--c1: #c9a84b   /* cluster 1 = gold */
--c2: #5C9A6B   /* cluster 2 = M2 green */
--c3: #9B7CC2   /* cluster 3 = M2 purple */

/* Gold-on-gold dark text (for filled pill CTAs) */
--gold-text-dark: rgb(26,20,7)

/* Borders */
--border: #1e3554
--border2: #254060
```

### Fonts
- **Body / UI / buttons / chips:** `'DM Sans', system-ui, sans-serif`
- **Editorial / headings / italics / serif moments:** `Georgia, 'Times New Roman', serif`
- Already loaded via existing `<link>` to Google Fonts (DM Sans). Georgia is system, no load needed.
- **DO NOT introduce Cormorant Garamond, Inter, Geist, or any other font** — Mirror 3 ships with DM Sans + Georgia and Mirror 4 must match.

### Continue pill (the primary CTA style across Mirror 4)
- Filled gold (`--gold` bg, `--gold-text-dark` text), 100px radius
- DM Sans 14px weight 600, letter-spacing 0.28px
- Padding 10px 22px
- Hover: bg → `#d4b558`

### Step eyebrow pattern
- DM Sans 11px weight 700, color `--gold`, letter-spacing 2.4px, uppercase
- Sentence Case (e.g. `Mirror 4 · Step 1 of 8 · Admire`), NOT all-caps

### Step title pattern
- Georgia 36px weight 600, color `--text`, line-height 1.2

### Step subtitle pattern
- Georgia italic 17px, color `--text2`, line-height 1.6, max-width 560px

### Overlay card
- Background `--bg3`, 1px solid `--gold` border, 18px radius
- Max-width 720px (640px for modals like Naming/Define)

### Helper ribbon (the bordered italic ribbon used for tips)
- Background `--bg2`, 1px `--gold-line` border, 12px radius, padding 14px 18px
- Georgia italic 14.5px, color `--text2`

### Warning ribbon
- Background `rgba(160,59,59,0.08)`, `--burgundy-line` border, 10px radius
- Georgia italic 14px, color `--burgundy`

---

## 3 · State schema

Mirror 4 adds one top-level key: `state.mirror4`. Schema:

```javascript
state.mirror4 = {
  status: "not_started" | "in_progress" | "complete",
  currentStep: "admire" | "irks" | "portrait" | "read" | "v1" | "v2" | "v3" | "finish" | "operationalize" | "rank" | "claim",

  // Room 1 raw inputs
  admire: [
    { id: "ad-1", text: "Owning a mistake before being called on it", intensity: "lights", person: null }
  ],
  irks: [
    { id: "ir-1", text: "Blaming the team for your own miss", intensity: "turns", person: null }
  ],

  // Room 1 portrait (after user edits in Step 3 — may differ from raw admire/irks)
  portrait: {
    lights: ["ad-1", "ad-2"],
    warms: ["ad-3", "ad-4", "ad-5"],
    bothers: ["ir-1", "ir-2", "ir-3"],
    turns: ["ir-4", "ir-5", "ir-6", "ir-7"]
  },

  // Room 1 clusters → become user's values
  clusters: [
    {
      id: "cl-1",
      color: "c1",                                    // c1 | c2 | c3 (UI color)
      katherineProposal: "accountability — owning mistakes…", // Katherine's read text
      proposedNames: ["Own It", "Integrity", "Honor"], // suggestions
      behaviorIds: ["ad-1", "ad-3", "ir-1"],          // which portrait behaviors belong (refs by id)
      userName: "Own It",                              // final name (empty until user confirms)
      userDefinition: "Taking full responsibility…",   // final definition (empty until confirmed)
      peelChain: ["accountability", "honor", "integrity"], // user's peel words (for replay/edit)
      flips: [
        { fromBehaviorId: "ir-1", to: "Take the blame before deflecting", accepted: true }
      ],
      status: "not_started" | "named" | "defined" | "complete"
    }
  ],

  // Room 2 behaviors per value (final operationalized set)
  operationalize: {
    "cl-1": {
      behaviors: [
        { id: "b-1", name: "Acknowledge mistakes immediately", practice: ["Say 'I made a mistake' within 24 hours"], source: "lights", sourceBehaviorId: "ad-1" }
      ],
      keystoneId: "b-1"  // or null if skipped
    }
  },

  // Room 3 rank (array of cluster ids, top = highest)
  rank: ["cl-1", "cl-3", "cl-2"],

  // Pressure-test results
  pressureTest: {
    complete: true,
    pairs: [
      { aId: "cl-1", bId: "cl-3", pickedId: "cl-1", matchedRank: true }
    ],
    conflicts: 0,
    rankChanges: 0   // how many times user accepted re-order during conflicts
  },

  // Claim
  claimed: false,
  claimedAt: null      // ISO timestamp
}
```

### Notes for Replit Agent
- IDs use stable string prefixes (`ad-`, `ir-`, `cl-`, `b-`) so we can trace where a behavior came from
- Behaviors are stored once in `admire`/`irks` and referenced by id elsewhere (no duplicates)
- All edits are immediately persistent via existing `saveState()` debounced save
- **DO NOT** add separate database tables. Mirror 4 lives entirely in `state.mirror4` like every other mirror.
- **DO NOT** add new auth/permission models. Existing user session covers Mirror 4.

---

## 4 · Reusable patterns from M3 (use these — do not reinvent)

Mirror 4 inherits these from Mirror 3's shipped code. The Replit Agent should locate and reuse these patterns, not write new ones:

| Pattern | Where in M3 | What it does |
|---|---|---|
| Hub-card layout | M3 Identity hub | Breadcrumb + eyebrow + title + subtitle + Katherine intro brief + room cards |
| Overlay open/close | M3 room overlays | Full-screen modal with backdrop blur, breadcrumb + close × at top, gold-bordered card |
| Step eyebrow + title + subtitle composition | Every M3 room interior | Centered eyebrow above big serif title above italic serif subtitle |
| Helper ribbon | M3 Step 1 "The gifts that are most you…" | Bordered italic centered ribbon for tips |
| Warning ribbon | M3 Step 1 "Your gifts have been refined…" | Burgundy bordered ribbon for cap violations |
| Filled gold Continue pill | All M3 room footers | Primary CTA pattern (NOT outlined — must be filled solid gold) |
| Modal-lifts-over-overlay with blur | None in M3 (NEW for Mirror 4) | Naming and Define modals open OVER the room overlay, room blurs behind |
| Sentence Case for all labels | M3 throughout | Section labels are "Behaviors" not "BEHAVIORS" |
| Compact chip with provenance | M3 Superpowers room gift chips | Small font, 100px radius pill, colored by source category |
| Seal screen pattern | M3 Own It room | ★ anchor, italic Georgia beats, gold-tinted vocative + key phrases, filled gold CTA, "the seal stays" foot, revise-readback escape |

If Replit Agent cannot find an M3 pattern in `workspace.html`, ask Katherine before inventing a new one.

---

## 5 · Section breakdown

Each section is one Replit ship. Test on dev before approving next.

---

### Section 1 · Hub + plumbing

**What to build:**
1. Wire `?newM4=1` flag exactly like `?newM3=1` (look for existing flag-check code in `workspace.html`)
2. Add Mirror 4 hub card to A1 view, immediately after Mirror 3 (Identity) card
3. Hub card opens a full-screen Values hub view (same M3 hub pattern):
   - Breadcrumb: `Entry Hall › A1 · All In It › Values`
   - Eyebrow: `A1 · MIRROR 4 · EXPLORE WITH KATHERINE` (gold uppercase, letter-spaced)
   - Title: `Values · The Order You Live By`
   - Subtitle: `Three rooms. At least three values. One decision filter.`
   - Return-anytime line: `You can return any time to edit anything you've written.`
   - Katherine intro brief card (▶ icon, `START HERE · KATHERINE INTRODUCES VALUES`, `Values · What you actually stand for`) — opens existing video modal pattern from M3
   - 4 room cards:
     - **Discover** — badge `1`, status `UP NEXT` if no Mirror 4 progress, `IN PROGRESS` / `COMPLETE` otherwise
     - **Operationalize** — locked until Discover complete
     - **Rank** — locked until Operationalize complete
     - **Claim** — gold-accented (3px gold left border), locked until Rank complete
   - `← Back to A1` quiet pill at bottom
4. Initialize empty `state.mirror4` schema on first load (see Section 3)
5. Clicking any unlocked room shows placeholder content: a centered `Coming in section N` message — the room overlay opens but contains only this placeholder
6. Add navigation: clicking "Values" anywhere in app routes to this hub

**Definition of done:**
- Visit `/?newM4=1` — Mirror 4 card visible on A1
- Click Mirror 4 card — Values hub loads with all 4 rooms visible
- Discover room is unlocked, others show `Unlocks after [X]` status
- Clicking Discover opens overlay with placeholder "Coming in Section 2" message
- Clicking close × on the overlay returns to hub
- State persists: refresh page, hub state unchanged
- DM Sans + Georgia render correctly throughout
- Matches M3 hub visually (open M3 in another tab, compare side by side)

**DO NOT:**
- Build any room interiors (Sections 2-6 cover those)
- Add new database tables — `state.mirror4` lives in existing state object
- Modify Map of Me yet (Section 6)
- Touch Mirror 1, 2, or 3 code
- Add new design tokens beyond what's listed in Section 2 (only `--c1`, `--c2`, `--c3` are new)
- Change DM Sans / Georgia font stack

**Reference:** mockup file `Values_Mirror4_LiveTokens.html`, demo nav button `Hub`

---

### Section 2 · Room 1 Steps 1-3 (Admire / Irks / Portrait)

**What to build:**
1. Discover room overlay (replaces placeholder from Section 1)
2. Overlay shell: breadcrumb top-left (`Values › Discover`), close × top-right, gold-bordered card, max-width 720px
3. Three sequential sub-screens, navigated via `Continue` / `Back` buttons in the foot:

**Step 1 · Admire:**
- Eyebrow `Mirror 4 · Step 1 of 8 · Admire`
- Title `What behaviors do you admire?`
- Subtitle `In yourself or in others. Don't overthink — the first thing that comes up is usually the truest.`
- Live legend showing two intensity pips (★ Lights me up — strong / Warms me — softer)
- Input row with placeholder `A behavior comes to mind…` + optional `+ tag a person` chip
- After typing, intensity buttons appear: `★ Lights me up` (deep gold) and `Warms me` (soft gold)
- Click intensity → behavior added to list below with proper pip + tag chip + × delete
- Counter line: `N behaviors so far`
- Continue → Step 2

**Step 2 · Irks:**
- Eyebrow `Mirror 4 · Step 2 of 8 · Irks`
- Title `What behaviors don't you admire?`
- Subtitle `The blood-boil. In yourself or in others. What irritates you most often points to what you refuse to compromise on yourself.`
- Live legend with burgundy pips (Bothers me — daily friction / ⚡ Turns my stomach — gut reaction)
- Same input mechanics as Step 1, burgundy intensity buttons
- Back → Step 1 (preserves admire data)
- Continue → Step 3

**Step 3 · Portrait:**
- Eyebrow `Mirror 4 · Step 3 of 8 · Portrait`
- Title `Your behavior portrait`
- Subtitle `Here's what you put down — sorted as you tagged it. Drag between tiers, delete, or add more before we look for values underneath.`
- 2x2 quadrant grid showing all behaviors organized by tier
- Each quadrant has its label + `+ add` link + list of behaviors
- Drag between tiers reassigns intensity
- × delete removes behavior
- Reveal hint at bottom: `↕ drag between tiers · × delete · + add more`
- Continue → Step 4 (placeholder until Section 3)

4. All state persists to `state.mirror4.admire`, `.irks`, `.portrait` via existing `saveState()`
5. Step transitions animate (`fadeIn 250ms ease-out` for `.screen.active`)

**Definition of done:**
- User completes Step 1 with at least 1 admire behavior, sees it persist when navigating away and back
- User completes Step 2 with at least 1 irks behavior
- Step 3 portrait shows all entered behaviors in correct quadrants
- Drag works between tiers (touch on mobile, drag on desktop)
- × delete works on any behavior
- `+ add` per quadrant lets user add a behavior without going back to Step 1/2
- Refresh page — all behaviors persist
- Step 4 click shows "Coming in Section 3" placeholder

**DO NOT:**
- Build Step 4 cluster overview (Section 3)
- Build per-value screens or modals (Section 3)
- Allow Continue to advance past Step 4 placeholder
- Auto-cluster on Step 3 — that's Katherine's read in Step 4 (Section 3)
- Add a hard minimum behavior count — Katherine doesn't gatekeep here, only soft-prompts if too few

**Reference:** mockup file `Values_Mirror4_LiveTokens.html`, demo nav buttons `1·Admire`, `2·Irks`, `3·Portrait`

---

### Section 3 · Room 1 Steps 4-8 + Naming + Define modals

This is the largest section. It handles all per-value work + both modals.

**What to build:**

**Step 4 · Katherine's Read (overview only):**
- Eyebrow `Mirror 4 · Step 4 of 8 · Katherine's read`
- Title `Katherine's read`
- Subtitle `I see [N] clusters in your portrait. We'll work them one at a time, each in its own space.`
- Katherine intro block (teal-bordered card): `KATHERINE SEES [N] PATTERNS` + italic Georgia narrative
- For each cluster (auto-generated from portrait analysis):
  - Compact card with color dot (`--c1`/`--c2`/`--c3`) + cluster label + Katherine's proposal text + behavior count
- Continue → `Work cluster 1 →`

**Clustering logic (Katherine's read):**
- Backend or LLM-assisted clustering of `state.mirror4.portrait` behaviors into 2-4 thematic groups
- Each cluster gets `katherineProposal` text + `proposedNames` array
- If only 2 clusters surface, Katherine's intro should flag this: *"I see two — values usually run deeper than that. After we work these, look at what's left in your portrait."* (soft prompt for add-another later in Step 8)
- Store cluster results in `state.mirror4.clusters[]`

**Steps 5, 6, 7 · Value 1, 2, 3 screens:**
Each per-value screen identical in structure, only cluster color and content vary.

- Eyebrow `Mirror 4 · Step [5/6/7] of 8 · Value [1/2/3]` with colored cluster marker dot
- Title `Name the [first/second/third] value`
- Subtitle `Review the behaviors. When you're ready, name what they point to.`
- Slim cluster banner (left border in cluster color): `Cluster N · Katherine sees [proposal]`
- **Behaviors section:**
  - Section title `Behaviors`
  - Helper: `These are the behaviors Katherine grouped into this value. Edit, add from your portrait, or type new ones.`
  - List of pre-filled behaviors (each with provenance chip: `LIGHTS`/`WARMS`/`BOTHERS`/`TURNS`/`FLIPPED`/`NEW`)
  - × delete on each
  - Two add buttons: `+ Add from your portrait` and `+ Add new behavior`
  - **Add from portrait** opens mini-quadrant panel (see below)
  - **Add new** opens an inline text input
- **Flip nested section** (burgundy left border, nested under behaviors):
  - Title `Irks → commitments`
  - Helper: `Your "bothers" bullets in this cluster — flipped into what you commit to doing instead. Edit, accept, or skip.`
  - Per flip: from-text in burgundy italic, → arrow, editable to-text, `Accept` + `Skip` buttons
  - Accepting adds the flip as a behavior to the value
- **Name CTA wrap** (gold dashed border, centered):
  - Helper: `When the behaviors feel right, we'll peel them together to find the value underneath.`
  - Big filled gold `Name this value ★` button → opens Naming modal
- **After both modals complete:** Name CTA wrap hidden, **Completed card** shown instead (see Completed Card below)
- Continue → next value (or to Step 8 from Value 3)

**Mini-quadrant pick-from-portrait panel:**
- Inline expand below the add-row buttons
- 2x2 grid mirroring Step 3 portrait
- Each quadrant shows tier label + chips for each behavior
- Lights/Warms quadrants: chips are pickable (gold border, click to add)
- Bothers/Turns quadrants: chips disabled with small "flip below" note in tier header, hover shows tooltip
- Behaviors already used in any value appear faded with strikethrough (`.mq-chip.used`)
- Close link at bottom

**Naming modal (state-aware):**
- Lifts over per-value screen with blur (`.naming-open` class on overlay)
- Max-width 580px, gold-bordered card

**State A · Peel:**
- Header label: `★ Name your value · peel to the root`
- Behaviors anchor at top (the 3 behaviors being named, as chips)
- Peel breadcrumb (chip row, current question highlighted gold): `these behaviors → what do they give you?`
- Current peel question in italic serif with gold-tinted user word
- Peel input (big serif gold, centered, dotted underline)
- One button: `Keep peeling →` (filled gold pill)
- `Ask Katherine for a name suggestion` chip (teal border, on-demand)
- Katherine's suggestion panel (hidden until invoked): teal-bordered card with her read + 1-3 candidate name pills as serif gold pill buttons
- After first peel, small underlined `I'm ready to name this →` link appears

**State B · Name:**
- Header label changes to: `★ Name your value · lock it in`
- Behaviors anchor stays visible
- `THIS IS THE VALUE YOU'RE NAMING` eyebrow (gold uppercase)
- Big serif gold input (pre-filled with last peel word or Katherine's pick)
- Helper line: `One or two words. Make it yours. You can come back and rename anytime.`
- `← Keep peeling` (text link) + `Confirm name ★` (filled gold pill)

**Transitions:**
- `I'm ready to name this →` click → State B
- Katherine suggestion pill click → State B with name pre-filled
- `← Keep peeling` click → State A (peel chain preserved)
- `Confirm name ★` click → naming modal closes, **Define modal auto-opens after 280ms**

**Define modal:**
- Same lift-over pattern as Naming modal, separate overlay class `.define-open`
- Header label: `★ Define your value · what does this mean to you?`
- Named value anchor at top: gradient gold-warm card with small ★ + big serif gold name (smaller than naming input, ~34px)
- Behaviors anchor below: `THE BEHAVIORS BEHIND IT` eyebrow + chip list of the value's behaviors
- Katherine-voice prompt (italic serif, exact copy): `*Katherine,* what does **[NAME]** mean to you? This is what shows when you're using it as your decision filter — *make it real.*`
- Textarea (pre-fills with existing definition on re-edit)
- `+ Ask Katherine for feedback` chip — clicking reveals teal-bordered card with feedback
- Two actions: `← Edit name` (closes Define modal, reopens Naming modal in State B with current name) + `Confirm definition ★` (closes Define modal, returns to per-value screen)

**Completed card** (replaces Name CTA wrap on per-value screen):
- Gradient gold-warm to transparent background
- 3px gold left border
- Centered ★ star icon (small, gold)
- Big serif gold name (42px)
- Italic serif definition (centered, 16px, max-width 480px)
- Tiny edit links footer: `edit name` · `edit definition`

**Step 8 · Confirm:**
- Eyebrow `Mirror 4 · Step 8 of 8 · Confirm`
- Title `Your three values` (or two/four/five depending on count)
- Subtitle `Stop here, or add another one if there's a value you haven't named yet.`
- Numbered summary cards (1, 2, 3...) each showing serif name + italic definition
- Soft-min-3 prompt card (gold-warm bg) if user has fewer than 3 values: title `Want to add another?` + body text
- `+ Add another value` button (opens a blank per-value flow)
- Continue → closes Discover overlay, opens Operationalize room (placeholder until Section 4)

**Definition of done:**
- User walks Steps 4 → 5 → 6 → 7 → 8 completing 3 values
- Naming modal: peel mechanic works, breadcrumb grows, Ask Katherine on-demand surfaces suggestions, picking a suggestion flips to State B, `I'm ready to name` link appears after first peel, Confirm name closes naming modal
- 280ms beat then Define modal auto-opens with named value at top + behaviors visible
- Define modal: textarea works, Ask Katherine feedback chip works on-demand, Confirm definition closes modal
- Per-value screen now shows compact completed card with edit links
- `edit name` link reopens naming modal in State B with current name (skip peel)
- `edit definition` link reopens Define modal with current definition pre-filled in textarea
- Step 8 summary shows all values correctly
- `+ Add another value` opens a blank value flow (review behaviors + name + define)
- State persists on refresh — clusters with userName + userDefinition stay locked
- Cluster colors apply correctly: V1 gold, V2 green, V3 purple

**DO NOT:**
- Build Room 2 (Operationalize) yet
- Add a Continue button that bypasses naming/define modals — user must name and define before advancing to next value
- Make `Ask Katherine` automatic — must remain on-demand
- Force a strict hierarchy on peel (user can peel 0 times if they want — `I'm ready to name` link should still appear after a short delay or always for users who skip peeling)
- Allow naming modal Confirm without a name (must have non-empty input)
- Allow Define Confirm without a definition (must have non-empty textarea)
- Use Cormorant Garamond anywhere — Georgia is the only serif

**Reference:** mockup `Values_Mirror4_LiveTokens.html`, demo nav buttons `4·Read`, `5·V1`, `↳ Name modal`, `↳ Define modal`, `6·V2`, `7·V3`, `8·Done`

---

### Section 4 · Room 2 · Operationalize

**What to build:**
1. Operationalize room overlay (replaces "Coming soon" from Section 1)
2. Overlay shell: breadcrumb `Values › Operationalize`, close × top-right
3. Single screen:

**Operationalize screen:**
- Eyebrow `Mirror 4 · Step 1 of 1 · Behaviors`
- Title `Behaviors`
- Subtitle `For each value, the behaviors that bring it to life. We started you with what surfaced in Discover — refine, replace, or add up to 5.`
- Helper ribbon: `A value without behaviors is just a word. Up to 5 per value. Mark one as the keystone — the one you'd defend first.`
- **Value-switcher chips** at top: one chip per value (Own It / Presence / Honesty etc), active chip filled gold, completed values get teal accent
- **Active value display:**
  - Big serif gold value name (left-aligned)
  - Italic definition below (in quotes)
  - Behavior cards stacked:
    - Each card: title input (editable), source chip (`From "lights me up"` / `Flipped from "turns my stomach"` etc), keystone star (top-right, ☆ inactive, ★ gold active)
    - Body section: `What this looks like in practice` label + bullet list + bullet input
  - `+ Add behavior` dashed gold button
  - Cap counter: `[N] of 5`
- **Keystone prompt** (gold-warm card at bottom):
  - ★ icon, title `Mark the keystone`, body explaining what keystone means
  - `Skip — they're all equal to me` underlined link

**Behavior pre-fill logic:**
- For each value (cluster), pre-fill behaviors from:
  - Cluster's `behaviorIds` (the portrait behaviors in this cluster) with their original tier as source
  - Cluster's accepted `flips` (with source = "flipped")
- Behaviors displayed in order: Lights → Warms → Flipped, max 5 shown if more exist
- User can delete, edit name, edit practice bullets, add new
- All edits persist to `state.mirror4.operationalize[clusterId]`

**Keystone mechanic:**
- Clicking star on any card sets that as the keystone (state: `operationalize[clusterId].keystoneId`)
- Only one keystone per value
- Keystone card gets `--gold` border (vs `--gold-line` for non-keystone) and `--gold-warm` background tint
- Skip link sets `keystoneId = null`

**Continue logic:**
- Continue → closes Operationalize, opens Rank room (placeholder until Section 5)
- User can return any time and edit — `state.mirror4.operationalize` is the source of truth

**Definition of done:**
- User clicks Operationalize (now unlocked since Discover complete)
- Sees value-switcher with all completed values
- Switches between values — each shows pre-filled behavior cards with provenance chips
- Can edit any behavior name, add practice bullets, delete behaviors, add new
- Marks keystone on any value — star fills gold, card border turns gold
- Skip keystone works — no card highlighted
- All edits persist on refresh
- Continue advances to Rank placeholder

**DO NOT:**
- Build Room 3 (Rank/Pressure-test) yet
- Allow more than 5 behaviors per value
- Make keystone mandatory — skip must work
- Auto-mark keystone — only user choice
- Change M3 behavior card style — reuse the chip + provenance pattern from M3 Superpowers

**Reference:** mockup `Values_Mirror4_LiveTokens.html`, demo nav button `R2·Behaviors`

---

### Section 5 · Room 3 · Rank + Pressure-Test modal

**What to build:**
1. Rank room overlay (replaces "Coming soon")
2. Overlay shell: breadcrumb `Values › Rank`, close ×

**Rank screen:**
- Eyebrow `Mirror 4 · Step 1 of 1 · Rank + Pressure-test`
- Title `The order you live by`
- Subtitle `Drag your values into the order you'd defend them under pressure. Top = the one that wins when two collide. Then we'll pressure-test each pair.`
- Helper ribbon: `The rank is your decision filter. When two values collide in a real moment, the higher one wins. The pressure-test proves the order.`
- **Phase 1 · Rank eyebrow** (gold uppercase)
- **Rank stack** — numbered rows (1, 2, 3...), each showing:
  - Big serif gold number on left
  - Value name (serif weight 600) + italic definition below + `★ Keystone: [behavior name]` line (or "★ Keystone: not set" if skipped)
  - Drag handles on right (▲ ▼ buttons for keyboard accessibility too)
- Rows with completed pressure-test pairs get gold border + gold-warm background
- **Phase 2 · Begin Pressure-Test card** at bottom:
  - Gold-warm bg, dashed gold border
  - Eyebrow `Phase 2 · Pressure-test`
  - Title `Test the order under collision`
  - Subtitle: `Now we'll walk N pairs of your values and ask: when these two collide, which wins? Your gut answers — and we compare them to your stated rank.`
  - Filled gold `Begin pressure-test →` button
  - Status line: `N pairs · about 2 minutes`

**Pressure-Test modal:**
- Lifts over Rank room with blur (`.pressure-open` class on rank overlay)
- Max-width 680px, gold-bordered card
- Header: `★ Pressure-test · the collision walk`

**Intro screen (always first):**
- Centered, max ~380px min-height
- Eyebrow `What we're doing`
- Title `When two values collide, one wins.`
- Subtitle (italic serif): `Real life forces choices. Pressure-test means: imagine the two values pulling on each other at the same time — gut-pick which one you'd actually defend.`
- Example card (gold-bordered, left-aligned text):
  - `FOR EXAMPLE` label (gold uppercase)
  - Body: `A friend asks you to keep a secret that goes against what you stand for. *Loyalty* says **hold the confidence — the friendship comes first.** *Honesty* says **say something — even if it costs the friendship.** Both are true. Only one can win. That's a collision.`
  - Closing line: `You're about to walk N pairs of yours.`
- Footer: status `Read the example first` + filled gold `Got it — start →` button

**Pair screens (one per pair):**
- Counter eyebrow: `Pair X of Y` (uppercase, gold)
- Prompt (italic serif): `When [A] and [B] *collide* — which wins?` (A and B in gold)
- Helper: `Gut-pick. No overthinking.`
- Two pair-cards side-by-side:
  - Each card: padding 24px, gold-line border, hover/select states
  - Value name (serif 26px gold) + definition (italic serif) + keystone footer block (top-border separator, `KEYSTONE` label, behavior name)
- Skip link at bottom: `Skip — they don't actually compete for me`

**Conflict prompt (inline, appears after a conflicting pick):**
- Burgundy-bordered card below pair-cards
- `Your gut said something different` label (burgundy uppercase)
- Body (italic serif): `You picked **X** — but you ranked **Y** higher. Want to re-order, or stand by your stated rank?`
- Two buttons: `Re-order — gut wins →` (filled gold) + `Stand by my rank` (outlined)
- Re-order swaps the two values in `state.mirror4.rank`; stand-by leaves rank unchanged
- Either button click → advances to next pair after 300ms

**Auto-advance on non-conflicting pick:**
- 600ms beat after card click, then auto-advance to next pair
- Card animates `.selected` state during beat

**Done screen:**
- ★ star anchor (30px gold)
- Title `Order tested.`
- Subtitle (varies based on conflicts): if 0 conflicts: `All N pairs walked. Your rank held up — what you said is what you actually defend. Ready to claim it?`; if 1+ conflicts: `All N pairs walked. You re-ordered [N] times to match your gut. Your real rank is locked in. Ready to claim it?`
- Filled gold `Continue to Claim →` button — closes pressure modal, closes Rank room, opens Claim room

**Pair generation:**
- For N values, generate N×(N-1)/2 pairs (all combinations)
- Cap at 10 pairs for sanity if user has 5+ values
- Order pairs randomly or in pre-defined order (consistency preferred — sort by rank order, adjacent pairs first)

**State:**
- `state.mirror4.pressureTest.pairs[]` records each pair's pickedId + matchedRank flag
- `conflicts` count and `rankChanges` count update as user goes
- Continue from Done writes `pressureTest.complete = true`

**Definition of done:**
- User opens Rank room (unlocked after Operationalize complete)
- Sees rank stack with N values in current order
- Can drag to reorder or use ▲ ▼ buttons
- Clicks Begin pressure-test → modal opens with intro
- Intro: reads example, clicks Got it — start → first pair shows
- Each pair: clicks a card, either auto-advances (matching) or shows conflict prompt
- Conflict: re-order swaps rank in real-time; stand-by leaves rank
- After all pairs: Done screen
- Continue to Claim closes modal and Rank room, opens Claim placeholder
- Refresh: pressure-test state persists, completed pairs show as tested in rank stack

**DO NOT:**
- Build Claim seal yet (Section 6)
- Generate AI-tuned scenarios per pair — use static prompt format with mini example in intro
- Allow Continue to Claim until pressure-test is complete (all pairs walked OR explicitly skipped)
- Persist intermediate pressure-test state mid-pair (only save on pick complete)
- Re-order rank without explicit user confirmation in conflict prompt

**Reference:** mockup `Values_Mirror4_LiveTokens.html`, demo nav buttons `R3·Rank`, `R3·Pressure`

---

### Section 6 · Claim seal + Map of Me populate

**What to build:**
1. Claim room overlay (replaces "Coming soon")
2. Overlay shell: breadcrumb `Values › Claim`, close ×, gold-bordered card
3. Single screen — no `.overlay-foot`, the seal IS the screen

**Seal screen:**
- Centered, padding 64px 56px 36px
- ★ anchor (32px gold, opacity 0.85)
- 5 italic Georgia beats stacked, max-width 540px each, 22px margin between beats:

  > *[Katherine,]* *this is the order you live by.*
  > (vocative + period in plain italic; "this is the order you live by." in gold italic)

  > *Not what sounds good. Not what you wish were true. The order you actually defend when two of them pull on each other at the same time.*
  > (all plain italic, no gold)

  > *These values are* **what you stand for.** *These behaviors are* **how you live them.**
  > ("what you stand for" and "how you live them" in gold italic; rest plain)

  > *When you live by them, your self-worth holds.*
  > *When you don't, or when you're with people who don't —* **it chips.**
  > (last phrase "it chips." in gold italic)

  > *This is your* **decision filter.**
  > *Use it when something feels off. Use it when you're choosing who to be with. Use it when you're choosing who to become.*
  > ("decision filter." in gold italic; rest plain)

- Gold rule (60px wide, 1px tall, `--gold-line`, centered)
- Filled gold pill CTA: `Claim it · go to Map of Me →`
- Foot line (italic serif, faint): `You've claimed your Values. The seal stays.`
- Bottom escape: `← Revise my Values readback` (quiet text link) — closes Claim overlay, returns to Values hub

**Personalization:**
- Replace `Katherine,` with `${resolveDisplayName()},` (same pattern M1/M3 use)
- If display name is empty, omit the vocative entirely (no awkward `,` at start)

**Claim mechanic:**
- Click `Claim it · go to Map of Me →`:
  - Set `state.mirror4.claimed = true`, `state.mirror4.claimedAt = new Date().toISOString()`
  - `saveState()` writes immediately
  - Mark Values room card on hub as complete (teal check badge + COMPLETE status)
  - Navigate to Map of Me tab (use existing Map of Me navigation pattern)
- If Map of Me doesn't exist yet, navigate to hub with success state

**Map of Me populate:**
- If Map of Me tab exists, add Values row to it with:
  - Mirror 4 section header: "Values · The Order You Live By"
  - Numbered list of values (1, 2, 3...) each with name + italic definition + keystone behavior
  - Pressure-test results badge: `Tested under collision`
  - Edit link → opens Mirror 4 hub
- This is additive — do not modify existing Map of Me sections (M1/M2/M3 rows)

**Revise-readback escape:**
- `← Revise my Values readback` link at bottom of seal
- Click → closes Claim overlay, returns to Values hub
- User can re-enter any room and edit
- Re-claiming overwrites `state.mirror4.claimedAt` with new timestamp
- Seal stays accessible after first claim — user can re-read it from Claim room

**Definition of done:**
- User completes Rank + Pressure-test, lands on Claim card
- Claim card now unlocked (gold accent, not opacity-dimmed)
- Click Claim → seal renders with all 5 beats correctly formatted
- Gold-tinted phrases visually distinct from plain italic
- Display name vocative renders if user has one
- Click `Claim it · go to Map of Me →` → state.mirror4.claimed = true → navigates to Map of Me (or hub if no Map of Me)
- Map of Me (if exists) shows new Values row with all data
- Revise-readback link works — returns to hub without losing claim state
- Refresh page: claim state persists, Claim room shows seal in claimed state
- All 4 hub room cards show COMPLETE status

**DO NOT:**
- Block the user from claiming if they only have 2 values (soft-min-3 was the prompt, not a gate)
- Show a confirmation modal before claim — the click IS the claim
- Modify existing Map of Me rows for M1/M2/M3
- Hard-code "Katherine" — must use `resolveDisplayName()`
- Re-trigger Map of Me animations on every re-visit — first-claim-only

**Reference:** mockup `Values_Mirror4_LiveTokens.html`, demo nav button `★ Claim`

---

## 6 · Final QA checklist (run before merging to production)

After all 6 sections ship to dev:

- [ ] Full Mirror 4 walk works end-to-end: Hub → Discover (8 steps) → Operationalize → Rank → Pressure-test → Claim → Map of Me
- [ ] State persists at every step (refresh test on each screen)
- [ ] All modals lift correctly with blur on parent overlay
- [ ] All transitions match M3 (open/close animations 250ms ease-out)
- [ ] DM Sans + Georgia font rendering correct everywhere
- [ ] Continue pills are FILLED gold (`--gold` bg, dark text) — never outlined
- [ ] Step eyebrows are 11px DM Sans 700 weight, gold, letter-spacing 2.4px
- [ ] Step titles are 36px Georgia weight 600
- [ ] Step subtitles are 17px Georgia italic
- [ ] Cluster color accents apply consistently (V1=gold, V2=green, V3=purple)
- [ ] All text is in Sentence Case (not ALL CAPS) for section labels
- [ ] Map of Me shows new Values row after claim
- [ ] No console errors during full walk
- [ ] Mobile responsive (modal overlays scroll correctly, no fixed-position issues)
- [ ] Existing M1/M2/M3 functionality untouched and unchanged
- [ ] `?newM4=1` flag correctly gates Mirror 4 visibility
- [ ] Removing the flag hides Mirror 4 entirely (clean dev/prod separation)

---

## 7 · Known things to NOT do (cross-section)

Generally applicable rules across all 6 sections:

1. **Never auto-trigger Katherine voice.** Every Katherine-feedback chip / suggestion / read is on-demand. User invites Katherine; she doesn't volunteer.
2. **Never gate progress on Katherine.** User can always skip Katherine's suggestion and write their own.
3. **Never use Cormorant Garamond, Inter, or Geist.** DM Sans + Georgia only.
4. **Never outline the primary Continue pill.** Filled gold with dark text, period.
5. **Never use ALL CAPS for section labels.** Sentence Case.
6. **Never add a new font load.** DM Sans is already loaded; Georgia is system.
7. **Never hard-block soft minimums.** 3-value minimum is a prompt, not a gate. Users can claim with 2.
8. **Never modify M1/M2/M3 code unless explicitly asked.** Additive only.
9. **Never invent new state schemas.** Use `state.mirror4` as defined in Section 3.
10. **Never bypass `saveState()`.** All edits route through it for persistence.
11. **Never add new database tables.** `state.mirror4` is the contract.
12. **Never reuse Cormorant or Inter spec from old mockups.** This mockup (`Values_Mirror4_LiveTokens.html`) supersedes everything earlier.

---

## 8 · Handover bundle (what fresh Claude receives)

1. **This file:** `Mirror4_BuildPlan_Section_Handover.md` — the master plan
2. **`Values_Mirror4_LiveTokens.html`** — visual source of truth, runs in browser, demo nav for jumping to any screen/modal
3. **Architecture summary** (Section 1 of this doc) — the locked structure of all 4 rooms + naming + define + pressure-test mechanics
4. **State schema** (Section 3 of this doc) — the data contract
5. **Design tokens reference** (Section 2 of this doc) — extracted from live app, do not modify
6. **Recent memory context** — Claude's memory of all S24-S30 design decisions, color semantics, M2/M3 patterns, AG45 / True Ownership product split

The fresh Claude should brief Replit Agent **one section at a time, in order**. Wait for Katherine to test and approve each section before proceeding to the next.

---

## 9 · Communication pattern with Replit Agent

When briefing Replit Agent, the fresh Claude should:

1. **Lead with one section header.** Don't paste the whole plan.
2. **Quote the section's "What to build" verbatim** so the agent can't reinterpret.
3. **Always include the section's "DO NOT" list.**
4. **Always include the relevant design token references** (don't expect agent to find them in old code).
5. **Reference the mockup file** with a specific demo nav button to jump to.
6. **Set acceptance criteria explicitly** using the "Definition of done" list.
7. **After agent ships:** wait for Katherine to test on dev, get explicit "approved" or specific fixes, before moving to next section.
8. **If agent proposes scope changes** (new schema, new endpoints, new patterns): pause, sanity-check against the actual ask, push back with subtractive revision before agreeing.
9. **Never combine sections.** Section 3 is big but it's still ONE Replit prompt.

---

**End of plan.**
