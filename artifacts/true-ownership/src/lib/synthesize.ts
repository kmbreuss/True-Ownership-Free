// Stage 4 — Summary Quality Pass
// Single source of truth for AI synthesis across all "Summarise" buttons.
// Replaces the pre-existing fake summarise handlers (setTimeout + first-sentence
// extraction) that were echoing user input. Every Summarise button in the app
// now calls synthesize() with one of four intents.

export const ANTI_ECHO_DISCIPLINE =
  "If your draft contains any phrase or clause from the user's original writing, " +
  "rewrite it. Echoing is failure. Synthesis means finding the deeper truth in " +
  "fewer, better words.";

export const OUTPUT_DISCIPLINE =
  "Return ONLY the synthesized sentence. No preamble. No quotes. No markdown. " +
  "No 'Here is...'. Just the sentence itself.";

// CRITICAL: Goals are written as ALREADY LIVED, not wished for.
// The user often writes their input in future tense ("I will see...", "I want...",
// "I'm going to...", "One day I'll..."). Translate that into present-tense
// lived-experience voice as if the future has arrived and this is now their life.
export const LIVED_TENSE_DISCIPLINE =
  "WRITE AS LIVED, NOT WISHED. The goal is stated as if it has already happened and is " +
  "now their reality. Use present tense or present perfect: \"I lead...\", \"My mornings " +
  "begin with...\", \"I have built...\", \"My family gathers...\". " +
  "FORBIDDEN: \"I want\", \"I will\", \"I hope to\", \"I'm going to\", \"One day\", " +
  "\"Someday\", \"My goal is\", \"I aim to\", \"I plan to\", \"I would like\". " +
  "If the user wrote \"I will see X\", render it as the lived scene (\"X is around me\" / " +
  "\"I see X every morning\"). If they wrote \"I want to be Y\", render it as \"I am Y\".";

const VOICE_PERSONAS: Record<string, string> = {
  own:         "You are reflecting the user's own truth back to them. Use clean, plain language. No advice. Their truth made visible.",
  coach:       "You are Katherine Breuss in coaching mode -- crisp, lucid, the kind of clarity that comes from asking the right question. Tone: precise and warm.",
  supportive:  "You are Katherine Breuss in supportive mode -- in the user's corner, sees their strength, keeps them moving. Tone: warm and encouraging.",
  challenging: "You are Katherine Breuss in challenging mode -- names the contradiction, doesn't let them off the hook. Tone: direct, kind, unflinching.",
  advice:      "You are Katherine Breuss with 25 years of experience -- direct recommendation, the wisdom of having been there. Tone: confident and grounded.",
  truth:       "You are Katherine Breuss speaking the uncomfortable truth -- what they need to hear, not what they want. Tone: honest, brave, unsoftened.",
};

const TOKEN_BUDGETS: Record<SynthesizeIntent, number> = {
  "item-goal":         200,
  "pillar-overall":    250,
  "horizon-growth":    350,
  "final-1yr-growth":  400,
};

export type SynthesizeIntent =
  | "item-goal"
  | "pillar-overall"
  | "horizon-growth"
  | "final-1yr-growth";

export type Pillar  = "time" | "wealth" | "growth";
export type Horizon = "bag" | "threeyr" | "oneyr";

export interface SynthesizeFocus {
  label: string;            // e.g. "1-Year Growth", "Family", "Wealth"
  sourceText: string;       // user's current free-write for this button
  pillar?: Pillar;
  horizon?: Horizon;
  horizonYearLabel?: string; // e.g. "2027"
}

export interface PriorContextItem {
  label: string;
  goal: string;
}

export interface PriorContext {
  purpose?: string;
  purposeVerbs?: string[];
  lifeAreas?: PriorContextItem[];
  // BAG horizon
  bagTime?: string;
  bagWealth?: string;
  bagGrowth?: string;
  bagTimeItems?: PriorContextItem[];
  bagWealthItems?: PriorContextItem[];
  // 3-Year horizon
  threeyrTime?: string;
  threeyrWealth?: string;
  threeyrGrowth?: string;
  threeyrTimeItems?: PriorContextItem[];
  threeyrWealthItems?: PriorContextItem[];
  // 1-Year horizon
  oneyrTime?: string;
  oneyrWealth?: string;
  oneyrTimeItems?: PriorContextItem[];
  oneyrWealthItems?: PriorContextItem[];
}

export interface SynthesizeArgs {
  intent: SynthesizeIntent;
  voiceId: string;
  name: string;
  focus: SynthesizeFocus;
  priorContext?: PriorContext;
}

function buildSystemMessage(voiceId: string): string {
  const persona = VOICE_PERSONAS[voiceId] || VOICE_PERSONAS.coach;
  return [
    persona,
    "",
    "You are synthesizing the user's writing into a single coherent sentence.",
    ANTI_ECHO_DISCIPLINE,
    LIVED_TENSE_DISCIPLINE,
    OUTPUT_DISCIPLINE,
  ].join("\n");
}

function bullets(items: PriorContextItem[] | undefined, fallback = ""): string {
  if (!items || items.length === 0) return fallback;
  return items
    .filter(i => i && (i.label || i.goal))
    .map(i => `- ${i.label}${i.goal ? `: ${i.goal}` : ""}`)
    .join("\n");
}

function buildUserMessage(args: SynthesizeArgs): string {
  const { intent, name, focus, priorContext = {} } = args;
  const pillar = focus.pillar || "growth";
  const horizon = focus.horizon || "bag";
  const horizonLabel = focus.horizonYearLabel || "";

  switch (intent) {
    case "item-goal": {
      return [
        `${name} is naming a single ${pillar} goal in the area of "${focus.label}".`,
        "",
        "They wrote:",
        `"${focus.sourceText}"`,
        "",
        `Distill this into ONE vivid, specific ${focus.label} goal sentence.`,
        "≤ 20 words. In their voice but tighter than they wrote it.",
        "Find the through-line — do not list elements.",
        "Write it AS ALREADY LIVED — present tense, as if this future is now their life. No 'I will', no 'I want', no 'someday'.",
      ].join("\n");
    }

    case "pillar-overall": {
      const itemsKey =
        horizon === "bag"     ? (pillar === "time" ? priorContext.bagTimeItems     : priorContext.bagWealthItems) :
        horizon === "threeyr" ? (pillar === "time" ? priorContext.threeyrTimeItems : priorContext.threeyrWealthItems) :
                                (pillar === "time" ? priorContext.oneyrTimeItems   : priorContext.oneyrWealthItems);
      const itemBullets = bullets(itemsKey, "(no individual items captured)");
      return [
        `${name} is consolidating their overall ${pillar} vision at the ${horizon === "bag" ? "BAG (12-year)" : horizon === "threeyr" ? "3-year" : "1-year"} horizon${horizonLabel ? ` (${horizonLabel})` : ""}.`,
        "",
        `Their individual ${pillar} goals at this horizon:`,
        itemBullets,
        "",
        "Their overall reflection (See/Hear/Feel + free-write):",
        `"${focus.sourceText}"`,
        "",
        `Synthesize ONE ${pillar} vision sentence that integrates these goals into a coherent direction.`,
        "Do not list them. Find the unifying truth that makes the individual goals feel like one life.",
        "≤ 25 words.",
        "Write it AS ALREADY LIVED — present tense, as if this is now their reality. No 'I will', no 'I want', no 'someday'.",
      ].join("\n");
    }

    case "horizon-growth": {
      const horizonText  = horizon === "bag" ? "BAG (12-year)" : horizon === "threeyr" ? "3-year" : "1-year";
      const timeKey      = horizon === "bag" ? priorContext.bagTime   : horizon === "threeyr" ? priorContext.threeyrTime   : priorContext.oneyrTime;
      const wealthKey    = horizon === "bag" ? priorContext.bagWealth : horizon === "threeyr" ? priorContext.threeyrWealth : priorContext.oneyrWealth;
      return [
        `${name} is naming who they are becoming at the ${horizonText} horizon${horizonLabel ? ` (${horizonLabel})` : ""}.`,
        "",
        priorContext.purpose ? `Their purpose:\n"${priorContext.purpose}"` : "",
        priorContext.lifeAreas && priorContext.lifeAreas.length
          ? `\nTheir top life areas: ${priorContext.lifeAreas.map(a => a.label).join(", ")}`
          : "",
        "",
        `At the ${horizonText} horizon, their confirmed visions are:`,
        timeKey   ? `· Time: "${timeKey}"`     : "· Time: (not yet confirmed)",
        wealthKey ? `· Wealth: "${wealthKey}"` : "· Wealth: (not yet confirmed)",
        "",
        "They wrote about Growth:",
        `"${focus.sourceText}"`,
        "",
        "Synthesize ONE Growth sentence that bridges who they are becoming with what they're building.",
        "Speak to identity, not activity.",
        "≤ 25 words.",
        "Write it AS ALREADY LIVED — \"I am...\", \"I move through the world as...\". Not \"I will become\", not \"I want to be\".",
      ].filter(Boolean).join("\n");
    }

    case "final-1yr-growth": {
      const lifeAreaBullets = bullets(priorContext.lifeAreas, "(no life areas captured)");
      return [
        `${name} has built a clear arc through Purpose, Life Areas, BAG, and 3-Year. They are now naming their 1-Year Growth — the near-term identity step${horizonLabel ? ` (${horizonLabel})` : ""}.`,
        "",
        priorContext.purpose ? `Their purpose:\n"${priorContext.purpose}"` : "",
        "",
        "Top life areas (with goals):",
        lifeAreaBullets,
        "",
        "Their long-arc Growth:",
        priorContext.bagGrowth      ? `· BAG (12-yr): "${priorContext.bagGrowth}"` : "· BAG (12-yr): (not yet confirmed)",
        priorContext.threeyrGrowth  ? `· 3-Year: "${priorContext.threeyrGrowth}"`  : "· 3-Year: (not yet confirmed)",
        "",
        "They wrote about 1-Year Growth:",
        `"${focus.sourceText}"`,
        "",
        "Synthesize ONE 1-Year Growth sentence that:",
        "1. Is the natural near-term step toward the BAG",
        "2. Expresses their purpose in their next 12 months",
        "3. Stays specific and falsifiable, not aspirational fog",
        "4. Is written AS ALREADY LIVED — present tense, as if 12 months have passed and this is who they now are. \"I lead...\", \"I have...\", \"My days...\". No 'I will', no 'I want', no 'someday'.",
        "",
        "≤ 28 words.",
      ].filter(Boolean).join("\n");
    }
  }
}

function stripWrappingQuotes(s: string): string {
  const t = s.trim();
  if (t.length >= 2) {
    const first = t[0], last = t[t.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'") ||
        (first === "\u201C" && last === "\u201D")) {
      return t.slice(1, -1).trim();
    }
  }
  return t;
}

export async function synthesize(args: SynthesizeArgs): Promise<string> {
  if (!args.focus.sourceText || !args.focus.sourceText.trim()) {
    throw new Error("Nothing to synthesize -- write something first.");
  }
  const system   = buildSystemMessage(args.voiceId);
  const user     = buildUserMessage(args);
  const maxToks  = TOKEN_BUDGETS[args.intent];

  let res: Response;
  try {
    res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxToks,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (e: any) {
    throw new Error(`Network error reaching the AI: ${e?.message || "unknown"}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`AI responded with invalid JSON (HTTP ${res.status}).`);
  }

  if (!res.ok || data?.error) {
    const msg = data?.error?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(`AI error: ${msg}`);
  }

  const text = (data?.content?.map((b: any) => b?.text || "").join("") || "").trim();
  if (!text) {
    throw new Error("AI returned an empty response. Try again.");
  }

  return stripWrappingQuotes(text);
}
