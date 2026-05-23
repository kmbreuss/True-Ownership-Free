# Replit Handoff · True Ownership™ · A1 · Mirror 1 (Purpose)

**Scope:** This handoff covers **only A1 · Mirror 1 · Purpose.** Do not touch other mirrors or other As in this round. BAG, Identity, Values, A2-A5 are explicitly out of scope.

**Important:** Keep the existing data model, Katherine integration, and auto-save engine. We are swapping the UX layer only.

---

## Before you begin

1. **Fork the True Ownership Replit project as a snapshot.** Use Replit's project menu → Fork. Name the fork "True-Ownership-Snapshot-Pre-A1-Redesign" so we can roll back if needed.
2. **Confirm the dev URL still works:** https://b8363272-ff9f-404c-9632-5af68f34d738-00-2kazqkj8gufie.spock.replit.dev/
3. **Read the visual reference file** `A1_M1_Purpose_v4.html` start-to-finish before writing any code. Run it locally and walk the full flow (Owned Symptoms → True Ownership → Peel → Declare). The flow you experience IS the spec.

---

## What's being replaced

The current A1 sidebar contains 8 items:
- True Ownership™ (intro)
- Introduction
- Purpose · Direction
- Direction · 3-YEAR
- Identity · Superpowers
- Values · Behaviors
- Direction · 1-YEAR
- My Map of Me™

**After this handoff, A1's structure becomes:**

A1 is a **grid of 4 Mirror cards** (not a sidebar) on a top-level "A1" tab:
1. **Purpose** — being redesigned now
2. **BAG · 10-Year Vision** — locked, will be designed in a future handoff
3. **Identity · Superpowers** — locked
4. **Values · Behaviors** — locked

The "Introduction" sidebar item becomes the **A1 intro video** displayed at the top of the A1 grid (collapsed by default).

"Direction · 3-YEAR" and "Direction · 1-YEAR" are **removed from A1 entirely.** They will move to A4 in a future handoff. **Do not delete the data yet** — just hide the sidebar items and don't render the pages. We may want to migrate user data into A4 later.

"My Map of Me™" moves to a **persistent header button** (gold, top right, next to the theme toggle).

---

## The new Purpose Mirror — what to build

When the user clicks the Purpose card on the A1 grid, they land on the **Explore with Katherine** page for Purpose. This page has:

- Breadcrumb at top: *Entry Hall › A1 · All In It › Purpose*
- Page title: **"Purpose"** (Georgia serif, 36px)
- Subtitle: *"Four exercises. Katherine guides each one with a short video. When she says 'come to your space' — tap the active exercise below."*
- A collapsed intro video block (Katherine introducing Purpose, ~6 min)
- A list of 4 exercise rows
- A bottom CTA that adapts to progress

### The 4 exercises

| # | Name | Tone | Type |
|---|---|---|---|
| 1 | Owned Symptoms | Burgundy (cost) | 2-step sub-flow |
| 2 | True Ownership | Gold (vision) | 6 questions, mixed cadence |
| 3 | The Peel | Cyan (working energy) | Multi-layer peel |
| 4 | Declare | Gold (claimed) | Single-line declaration |

Each exercise opens as a **View A room** — a centered card floating over a dimmed/blurred Explore page. See `A1_M1_Purpose_v4.html` for the exact visual treatment.

**Veil transition on entry** — see the spec in Program_Architecture_v2.md (Stage 1-5, ~2.7 second total). The text variants per exercise are:
- Owned Symptoms → *"Stepping into the room with Katherine…"*
- True Ownership → *"Imagining the owner…"*
- The Peel → *"Going deeper with Katherine…"*
- Declare → *"The moment of claiming…"*

### Exercise 1 — Owned Symptoms

**Sub-step 1 of 2 — Symptoms multi-select**
- Title: *"What are the signs you're living someone else's life right now?"*
- Context: *"Tap any that ring true. There's no judgment — these are just the data. Then add one in your own words."*
- 8 chip options (multi-select, burgundy-tone when selected):
  - "I'm tired but can't tell why"
  - "I say yes when I mean no"
  - "I shrink in certain rooms"
  - "My calendar runs me"
  - "I'm performing, not living"
  - "I keep waiting for permission"
  - "I scroll instead of feel"
  - "I'm successful and empty"
- Free-text textarea below chips: *"What else? Name one in your own words..."*
- Validation: at least 1 chip OR a non-empty note
- Button: *"Next: The single thing →"*

**Sub-step 2 of 2 — The single thing**
- Title: *"The single thing holding you back"*
- Context: *"If you could remove ONE thing right now and reclaim your life — what would it be? Don't list five. Find the one that, if it were gone, would change everything."*
- Single textarea: *"The one thing is..."*
- Buttons: *"← Back to symptoms"* and *"✓ Save & continue"*
- Validation: holdingBack must be non-empty

### Exercise 2 — True Ownership

**6 questions, one at a time** (M1-style sequential). Sub-progress pips at top show position 1 of 6 → 6 of 6.

**Critical: On Q1 ONLY**, display a burgundy callout above the question:
> "You named your one thing: '[their saved holdingBack value].' Now imagine life without it. These six questions paint the picture."

All 6 questions use the stem: ***"Describe what life would be like if you..."***

| # | Question | Input type | Feeling chips (if any) | Custom-allowed |
|---|---|---|---|---|
| 1 | ...owned your time. | Feeling chip only | Spacious, Unhurried, Energized, Free, Sovereign, At ease | Yes (`+ Other…`) |
| 2 | ...prioritized what mattered to you. | Heavy textarea | — | — |
| 3 | ...achieved the results you wanted. | Feeling chip only | Proud, Lit up, Calm, At peace, Whole, Lifted | No |
| 4 | ...enjoyed the journey. | Feeling chip only | Playful, Curious, Alive, In flow, Awake, Light | Yes |
| 5 | ...felt aligned on the inside. | Sentence completion | — | — |
| 6 | ...set and managed boundaries. | Heavy textarea | — | — |

**Q5 sentence completion structure:**
- *"When I'm aligned, I notice ____."* → single-line input
- *"And the thing I no longer do is ____."* → single-line input

**Custom feeling chip behavior (Q1, Q4):**
- Render a dashed-border chip labeled "+ Other…"
- On click: deselect all other chips, become selected, show a single-line text input below the chip grid
- As user types, the chip label updates to show what they typed
- When other chips are clicked, the custom input hides and clears

**Navigation:**
- Previous button (if not Q1): saves current, goes back one
- Next button: saves current, advances one. On Q6: closes room, marks exercise complete
- Validation per-question: must have a valid answer to advance

### Exercise 3 — The Peel

Multi-layer peel. Open-ended (2+ layers required before declaring).

**Prompts in order:**
1. *"When are you most alive?"*
2. *"So what does that give you?"*
3. *"And what does THAT give you?"*
4. *"Underneath that — what's the deepest version?"*
5. *"One more level — what's the essence?"*

If the user peels beyond 5, prompt 5 repeats.

**Each completed layer renders above the current prompt** as a gold-bordered milestone showing: `Layer N · "prompt" · their answer`.

**Buttons:**
- *"↓ Keep peeling — go deeper"* (cyan) — adds a layer, re-renders with the next prompt
- *"✓ This is my bottom — declare"* (gold) — appears only after 2+ layers, marks exercise complete

### Exercise 4 — Declare

Single-line italic-serif input, centered, large (28px). Pre-fill with the last peel layer's answer.

**Title:** *"In one phrase — your Purpose, claimed."*
**Context:** *"This is the bottom you reached in the peel. Or a version of it that feels more true. Two or three words. Italic. Yours."*

Button: *"✓ Declare"* (gold). On click, save and close. **The declaration becomes the Purpose value used everywhere else in the app and in Map of Me.**

---

## State / data model

```js
state.a1.purpose = {
  // Exercise 1
  symptoms: {
    picks: [],          // array of strings (chip labels selected)
    note: '',           // free-text addition
    holdingBack: ''     // the single thing — STRING, REQUIRED for completion
  },
  ex1Complete: false,   // true when symptoms valid AND holdingBack non-empty

  // Exercise 2
  trueOwnership: {
    answers: [
      { type: 'feeling-only', feeling: '' },           // Q1
      { type: 'heavy', text: '' },                     // Q2
      { type: 'feeling-only', feeling: '' },           // Q3
      { type: 'feeling-only', feeling: '' },           // Q4
      { type: 'completion', c1: '', c2: '' },          // Q5
      { type: 'heavy', text: '' }                      // Q6
    ],
    currentQ: 0  // 0-5, persists if user leaves mid-flow
  },
  ex2Complete: false,   // true when all 6 answers valid

  // Exercise 3
  peel: {
    layers: []  // array of { prompt: string, answer: string }
  },
  ex3Complete: false,   // true when 2+ layers AND user clicked declare

  // Exercise 4
  declaration: '',
  ex4Complete: false    // true when declaration non-empty
};

// A Mirror is complete when all its exercises are complete
state.a1.purpose.complete = (ex1 && ex2 && ex3 && ex4);
```

### Auto-save
Save state to the database on:
- Chip pick/unpick (Exercise 1, Exercise 2)
- Custom-feeling text input (Exercise 2 — debounced ~500ms)
- Textarea input (debounced ~500ms)
- Sub-step advance (Exercise 1)
- Question advance (Exercise 2)
- Peel layer add
- Declaration save

### Validation rules per save
- Ex1: at least 1 symptom pick OR non-empty note → step 1 complete; non-empty holdingBack → step 2 complete; both required for ex1Complete
- Ex2: each answer must satisfy its type:
  - `feeling-only`: feeling must be non-empty (chip selected OR custom text typed)
  - `heavy`: text trimmed must be non-empty
  - `completion`: BOTH c1 AND c2 trimmed must be non-empty
- Ex3: 2+ layers + clicked declare
- Ex4: declaration trimmed non-empty

---

## What to KEEP (do not touch)

- **Katherine voice integration** (the existing AI sidebar chat) — keep it, surface it via a "Ask Katherine to reflect what she's hearing" button at the bottom of each room. Tag context for Katherine: which Mirror, which exercise, the user's saved answers.
- **Auto-save engine** — already exists in the live app for textareas. Reuse.
- **User profile + display name** — keep as-is.
- **Theme toggle** (dark / light) — already exists. Make sure it works in all new screens.
- **The `/api/me/profile` endpoint and the existing data persistence layer.**

---

## What to REMOVE (or hide)

- The current "Direction · 3-YEAR" page (remove from A1 sidebar, hide page render). Preserve database data — we'll migrate later.
- The current "Direction · 1-YEAR" page (same).
- The current "Introduction" sidebar item (replace with collapsed video at top of A1 grid).
- The current "Purpose · Direction" page (this gets replaced wholesale with the new Purpose Mirror flow described above).
- The A1 left sidebar (the new structure is the 4-card grid).

---

## What about Routes / Internal IDs

The existing routing uses internal IDs like `foundation, swott, vision, ascent, quarterly, audit`. These come from the Boardroom app and don't apply to True Ownership.

**For True Ownership internal IDs, use:**
- `a1`, `a2`, `a3`, `a4`, `a5` for the top-level As
- `purpose`, `bag`, `identity`, `values` for A1's Mirrors
- `owned-symptoms`, `true-ownership`, `peel`, `declare` for Purpose's exercises

URLs:
- `/a1` → A1 grid
- `/a1/purpose` → Purpose Explore page
- `/a1/purpose/owned-symptoms` → Owned Symptoms room (deep-linkable)
- `/a1/purpose/true-ownership?q=3` → True Ownership Q3 (deep-linkable)
- `/map` → Map of Me page

---

## Don't over-engineer

Things that are tempting but **not in scope for this handoff**:

- ❌ A voice picker for Katherine — DEFERRED to v2
- ❌ A "share my Map of Me" feature — out of scope
- ❌ Editing the database schema for the Workbook — use existing JSONB column
- ❌ Building BAG, Identity, or Values mirrors — DEFERRED to next handoff
- ❌ Multi-language support — out of scope
- ❌ Adding new authentication or user-tier features

**If you find yourself proposing new database columns or new endpoints, stop and ask.** The plan should match the complexity of the actual request. If it doesn't, you're over-engineering.

---

## Done criteria

The handoff is complete when:

1. The A1 page shows a 4-card grid (Purpose, BAG locked, Identity locked, Values locked) instead of a sidebar
2. The Map of Me lives in the persistent top-right header as a gold button (works from any page)
3. Clicking the Purpose card opens the Explore page with 4 exercise rows
4. Each exercise opens as a centered card on a dimmed/blurred Explore page (View A room style)
5. The veil transition plays on entry (~2.7s with the hold)
6. All 4 exercises work end-to-end and save to the database
7. Returning to a completed exercise lets the user edit (no separate review mode)
8. The Mirror card on A1 updates state (progress pips, "Continue / Review" button label) based on saved data
9. Map of Me shows the user's declared Purpose statement once Exercise 4 is complete (and only then)
10. Mobile responsive — test at 380px

---

## Files in this handoff

- **`A1_M1_Purpose_v4.html`** — the visual reference. The flow shown in this file IS the spec. Where the doc and the file disagree, **the file wins.**
- **`Program_Architecture_v2.md`** — the broader program spine. Useful for understanding why these decisions were made.
- **`Replit_Handoff_A1_Purpose.md`** — this document. The scoped instructions.
- **`Next_Claude_Starter.md`** — instructions for the next session to continue with BAG/Identity/Values.

---

## When in doubt

**Ask Katherine before adding anything.** Subtractive revisions are usually correct. If the implementation feels like it's growing past the scope of this doc, stop and confirm.

The principle from her memory: *"Is the complexity in the plan matching the complexity in my actual request?"*

If not, push back.
