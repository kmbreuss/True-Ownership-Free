// Mirror 1 (Purpose · Declare) — locked ceremony content.
// Mirrors mirror2Constants.SEAL_PARAGRAPHS / SEAL_GOLD_PHRASES so the existing
// renderSealParagraph splitter in App.tsx can be reused without invention.
//
// Format rules (per M1.B refinement spec, owner-locked):
//   • Italic Georgia body throughout (handled by .na1-decl-cer-para CSS).
//   • The user's claimed Purpose, quoted at top, renders in gold non-italic.
//     The literal token below is substituted at render time with the live
//     trimmed value of purpose_final and added to the gold-phrase list.
//   • "Now you have." (closing line) renders in gold non-italic — listed in
//     M1_SEAL_GOLD_PHRASES.
//   • Each of the three test questions ("Does it light you up?" / "Get you
//     out of bed?" / "Cross every area of your life?") is its OWN paragraph
//     so paragraph-spacing creates the held beats — do NOT collapse.
//   • Journey verbs (Align, Advocate, Act, Accountable) are capitalized in
//     normal italic flow — no separate gold treatment.

export const M1_PURPOSE_TOKEN = "{{purpose}}";

export const M1_SEAL_PARAGRAPHS: ReadonlyArray<string> = [
  `Look at what you've named.\n"${M1_PURPOSE_TOKEN}"`,
  "Does it light you up?",
  "Get you out of bed?",
  "Cross every area of your life?",
  "If yes — you've named something real. If not — go back at any time and write it again.",
  "This is the foundation everything else gets built on.",
  "Now — Align it. Advocate for it. Act on it. Be Accountable to it.",
  "First you had to name it. Now you have.",
];

export const M1_SEAL_GOLD_PHRASES: ReadonlyArray<string> = [
  "Now you have.",
];
