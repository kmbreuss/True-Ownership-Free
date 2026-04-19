# Your first Claude Code session — copy/paste this

## Before you start

1. Install Claude Code: https://docs.claude.com/en/docs/claude-code/quickstart
2. Clone your Replit project locally to your computer (so Claude Code can edit files directly):
   - In Replit IDE: Tools > Git (or look for the Git panel on the left sidebar)
   - Get the repo URL
   - On your computer: `git clone <URL>` then `cd True-Ownership`
3. Upload the prototype files into `./artifacts/Prototypes/` in your Replit repo:
   - `a1_direction_prototype_v2.jsx` (drag-drop into Replit file tree under a new `prototypes/` folder)
   - `true_ownership_plan_v3.docx`
   - `TRUE_OWNERSHIP_HANDOFF_BRIEFING.docx`
4. Pull the latest: `git pull` (to get CLAUDE.md and NEXT_STEPS.md that were just written)

## First session kickoff message

Open Claude Code in your project directory. Paste this exactly:

---

Read CLAUDE.md first. That's the master context for this project.

Then read ./artifacts/Prototypes/a1_direction_prototype_v2.jsx — that's the design reference for A1.

Once you've read both, we're going to execute Phase B W.1: transform the BAG page's Wealth segment from 4 static cards to a chip-picker pattern matching Time.

Follow the steps listed in CLAUDE.md under "Next session — execute Phase B W.1". Before making any edits, show me your plan and wait for my OK.

---

## Expected flow of that first session

1. Claude Code reads CLAUDE.md and the prototype (~30 seconds)
2. Shows you its understanding and the edit plan
3. You confirm or adjust
4. It takes the backup, writes the components, does the swap
5. You verify in Replit preview
6. Commit and push

## If something goes wrong

- Rollback: `cp ./artifacts/true-ownership/src/App.tsx.bak_pre_w1 ./artifacts/true-ownership/src/App.tsx`
- Then: `git checkout App.tsx` if you'd also committed a broken change
- All backups are in `./artifacts/true-ownership/src/App.tsx.bak_*`

## Why this setup works better than Replit Agent

- Claude Code shows you every edit BEFORE applying it
- It reads the prototype as context, doesn't reinvent the design
- It works from CLAUDE.md's locked decisions rather than inferring
- No scope creep — it changes only what you ask for
- You stay in the driver's seat

## Where to continue strategy work

Keep using Claude.ai chat (this interface) for:
- Strategic decisions (e.g., "should we do X or Y")
- A2-A5 prototype design
- Free tier design (quiz, sitting)
- Doc updates to v3 plan
- Visualizations

Use Claude Code for:
- Replit code porting
- Component building
- Debugging
- Heavy code changes

## One-line summary

Strategy here, code there. Both have the same context via CLAUDE.md.
