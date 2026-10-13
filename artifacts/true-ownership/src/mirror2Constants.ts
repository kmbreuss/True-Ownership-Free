// A1 · Mirror 2 (Vision · 10-Year Horizon) — single source of truth
// for chip catalog, tier names, domain labels, sentence templates,
// blank placeholders, lens colors, veil strings, and Katherine's seal copy.

export const TIER_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: "Completely Owned",
  2: "Complacent",
  3: "Aspiring",
  4: "True Owner",
};

export type Lens = "time" | "wealth" | "self";
export type SilverLens = Lens | "silver";

export const LENS_COLORS: Record<SilverLens, { primary: string; soft: string; border: string }> = {
  time:   { primary: "var(--lens-time)",   soft: "var(--lens-time-soft)",   border: "var(--lens-time-line)" },
  wealth: { primary: "var(--lens-wealth)", soft: "var(--lens-wealth-soft)", border: "var(--lens-wealth-line)" },
  self:   { primary: "var(--lens-self)",   soft: "var(--lens-self-soft)",   border: "var(--lens-self-line)" },
  silver: { primary: "var(--lens-silver)", soft: "var(--lens-silver-soft)", border: "var(--lens-silver-line)" },
};

// 11 domains, 4 tiers each = 44 chips.
export const VISION_CHIPS: Record<Lens, Record<string, Record<1 | 2 | 3 | 4, string>>> = {
  time: {
    work:    { 1: "My calendar runs and drains me",       2: "I'm coasting at work",         3: "Mostly fulfilling, some leaks", 4: "I own my work time and it fulfills me" },
    family:  { 1: "Little engagement",                    2: "There, but distracted",        3: "Half-present",                  4: "Full and present" },
    friends: { 1: "I've lost touch",                      2: "Surface-level only",           3: "Tended but thin",               4: "Rich and current" },
    hobbies: { 1: "I've forgotten what I love",           2: "I make excuses",               3: "Squeezed in when I can",        4: "Lit up by what I make time for" },
    health:  { 1: "Running on fumes",                     2: "Surviving, not thriving",      3: "Inconsistent but trying",       4: "Strong and rested" },
  },
  wealth: {
    cashflow:  { 1: "Money is tight, I'm scrambling",     2: "Stable, but stuck",            3: "Generating, with margin",       4: "Abundant and flowing" },
    building:  { 1: "Surviving, nothing saved",           2: "Saving when I can",            3: "Building, no real plan",        4: "Compounding on purpose" },
    stability: { 1: "One bad month from disaster",        2: "Treading water",               3: "Solid, but precarious",         4: "Rooted and resilient" },
  },
  self: {
    selfTreatment:  { 1: "I'm cruel to myself",           2: "I tolerate myself",            3: "Mostly kind to myself",         4: "I treat myself like someone I love" },
    selfPerception: { 1: "I don't recognize who I am",    2: "I know the role, not the person", 3: "Becoming someone I recognize", 4: "I am who I am, fully" },
    becoming:       { 1: "I'm the version of me from years ago", 2: "I change reluctantly",  3: "Shifting, with friction",       4: "Becoming, with grace" },
  },
};

// Ordered domain keys per lens (also drives screen ordering and randomization seed).
export const LENS_DOMAINS: Record<Lens, ReadonlyArray<string>> = {
  time:   ["work", "family", "friends", "hobbies", "health"],
  wealth: ["cashflow", "building", "stability"],
  self:   ["selfTreatment", "selfPerception", "becoming"],
};

export const DOMAIN_LABELS: Record<Lens, Record<string, string>> = {
  time:   { work: "Work", family: "Family", friends: "Friends", hobbies: "Hobbies", health: "Health" },
  wealth: { cashflow: "Cashflow", building: "Building", stability: "Stability" },
  self:   { selfTreatment: "Self-treatment", selfPerception: "Self-perception", becoming: "Becoming" },
};

export const SELF_TAGS: Record<string, "Body" | "Mind" | "Trajectory"> = {
  selfTreatment: "Body",
  selfPerception: "Mind",
  becoming: "Trajectory",
};

// Sentence templates — render as: "In 10 years, {chip}. {stem1} ___, {stem2} ___."
export const SENTENCE_TEMPLATES: Record<Lens, Record<string, { stem1: string; stem2: string }>> = {
  time: {
    work:    { stem1: "I do this by",          stem2: "and the work itself feels like" },
    family:  { stem1: "I make this real by",   stem2: "and what I notice in our time together is" },
    friends: { stem1: "I do this by",          stem2: "and what we have together looks like" },
    hobbies: { stem1: "I make space by",       stem2: "and it gives me" },
    health:  { stem1: "I tend it daily by",    stem2: "and my body tells me" },
  },
  wealth: {
    cashflow:  { stem1: "I keep it healthy by",      stem2: "and what it lets me say yes to is" },
    building:  { stem1: "The way I build wealth is", stem2: "and what I'll have at the end of the decade is" },
    stability: { stem1: "What protects me is",       stem2: "and how I sleep at night is" },
  },
  self: {
    selfTreatment:  { stem1: "I do this by",                       stem2: "and in my body it feels like" },
    selfPerception: { stem1: "The story I tell about myself is",   stem2: "and the inner voice I hear is" },
    becoming:       { stem1: "The growth practice I keep is",      stem2: "and what's still expanding in me is" },
  },
};

// Per-blank placeholders, indexed as [domain][1 | 2].
export const PLACEHOLDERS: Record<Lens, Record<string, { 1: string; 2: string }>> = {
  time: {
    work:    { 1: "The structure that makes it happen",          2: "What you'd want every Monday to feel like" },
    family:  { 1: "The behavior that proves you're here",        2: "What you'd see if you were watching the room" },
    friends: { 1: "The ritual or rhythm that holds them",        2: "The shape of a year in those friendships" },
    hobbies: { 1: "How the hobby actually gets into your week",  2: "What comes back to you when you do it" },
    health:  { 1: "The daily move that's non-negotiable",        2: "The somatic signal that you're well" },
  },
  wealth: {
    cashflow:  { 1: "The structure that keeps it healthy",   2: "The yeses you'll be able to give" },
    building:  { 1: "Your wealth-building mechanism",        2: "The number, the asset, the inheritance" },
    stability: { 1: "The structures that hold you up",       2: "The body-sense of resting easy" },
  },
  self: {
    selfTreatment:  { 1: "What you do that proves you matter to you", 2: "How your body knows it's being cared for" },
    selfPerception: { 1: "Who you say you are — in your own words",   2: "The tone of your inner voice" },
    becoming:       { 1: "Your growth practice — books, mentors, deliberate practice", 2: "What's still alive and expanding in you" },
  },
};

// Veil text per Mirror 2 exercise — italic Georgia gold, ~2.7s veil.
export const M2_VEIL_TEXT = {
  twoFutures: "Looking out ten years…",
  time:       "Stepping into the life you'll own…",
  wealth:     "Stepping into what you'll build…",
  self:       "Stepping into who you'll be…",
  declaration:"The moment of claiming…",
} as const;

// Mirror 2 Explore page row metadata.
export type M2ExerciseKey = "twoFutures" | "time" | "wealth" | "self" | "declaration";
export const M2_EXERCISES: ReadonlyArray<{
  n: number;
  key: M2ExerciseKey;
  name: string;
  subtitle: string;
  tone: "burgundy" | "yellow" | "green" | "purple" | "silver";
  threshold: string;
}> = [
  { n: 1, key: "twoFutures",  name: "Two Futures",         subtitle: "The two paths in front of you, side by side.", tone: "burgundy", threshold: M2_VEIL_TEXT.twoFutures },
  { n: 2, key: "time",        name: "Time · 10-Year",      subtitle: "The life that holds your hours.",              tone: "yellow",   threshold: M2_VEIL_TEXT.time },
  { n: 3, key: "wealth",      name: "Wealth · 10-Year",    subtitle: "What you'll build, what'll hold.",             tone: "green",    threshold: M2_VEIL_TEXT.wealth },
  { n: 4, key: "self",        name: "Self · 10-Year",      subtitle: "The person you'll have become.",               tone: "purple",   threshold: M2_VEIL_TEXT.self },
  { n: 5, key: "declaration", name: "Vision Declaration",  subtitle: "One claimed Vision.",                          tone: "silver",   threshold: M2_VEIL_TEXT.declaration },
];

// Katherine's seal (Vision Declaration ceremony). Phrases listed in GOLD_PHRASES
// render in gold (#C9A24B, non-italic, weight 500) inside the otherwise italic body.
// "Align, Advocate, Act, Account" are capitalized in normal flow — not separately styled.
export const SEAL_PARAGRAPHS: ReadonlyArray<string> = [
  "This may feel exciting. Big. Maybe a little far-fetched.\nThat's how a Big Ass Goal — your Vision — is supposed to feel.",
  "You're here to live this. Not someone else's.\nNot the version you thought was \"realistic.\"\nThis one.",
  "First you had to see it. Now you do.",
  "In the work that's left, you'll Align, Advocate, Act, Account.\nOne step at a time.\nThat's how this gets lived.",
];
export const SEAL_GOLD_PHRASES: ReadonlyArray<string> = [
  "your Vision",
  "This one.",
  "That's how this gets lived.",
];

// Vision shape stored at `map.vision`. Use this when extending `EMPTY_MAP`.
export type VisionState = {
  twoFutures: {
    futureA: {
      time:   { work: number | null; family: number | null; friends: number | null; hobbies: number | null; health: number | null };
      wealth: { cashflow: number | null; building: number | null; stability: number | null };
      self:   { selfTreatment: number | null; selfPerception: number | null; becoming: number | null };
    };
    futureB: {
      time:   { work: number | null; family: number | null; friends: number | null; hobbies: number | null; health: number | null };
      wealth: { cashflow: number | null; building: number | null; stability: number | null };
      self:   { selfTreatment: number | null; selfPerception: number | null; becoming: number | null };
    };
    futureA_complete: boolean;
    wakeUp_seen: boolean;
    futureB_complete: boolean;
    climb_seen: boolean;
    complete: boolean;
  };
  time:   { work: { blank1: string; blank2: string }; family: { blank1: string; blank2: string }; friends: { blank1: string; blank2: string }; hobbies: { blank1: string; blank2: string }; health: { blank1: string; blank2: string } };
  time_complete: boolean;
  wealth: { cashflow: { blank1: string; blank2: string }; building: { blank1: string; blank2: string }; stability: { blank1: string; blank2: string } };
  wealth_complete: boolean;
  self:   { selfTreatment: { blank1: string; blank2: string }; selfPerception: { blank1: string; blank2: string }; becoming: { blank1: string; blank2: string } };
  self_complete: boolean;
  declaration: {
    claimedAt: string | null;
    sealSeen: boolean;
    revisedAt: string[];
  };
  complete: boolean;
};

export const EMPTY_VISION: VisionState = {
  twoFutures: {
    futureA: {
      time:   { work: null, family: null, friends: null, hobbies: null, health: null },
      wealth: { cashflow: null, building: null, stability: null },
      self:   { selfTreatment: null, selfPerception: null, becoming: null },
    },
    futureB: {
      time:   { work: null, family: null, friends: null, hobbies: null, health: null },
      wealth: { cashflow: null, building: null, stability: null },
      self:   { selfTreatment: null, selfPerception: null, becoming: null },
    },
    futureA_complete: false,
    wakeUp_seen: false,
    futureB_complete: false,
    climb_seen: false,
    complete: false,
  },
  time:   { work: { blank1: "", blank2: "" }, family: { blank1: "", blank2: "" }, friends: { blank1: "", blank2: "" }, hobbies: { blank1: "", blank2: "" }, health: { blank1: "", blank2: "" } },
  time_complete: false,
  wealth: { cashflow: { blank1: "", blank2: "" }, building: { blank1: "", blank2: "" }, stability: { blank1: "", blank2: "" } },
  wealth_complete: false,
  self:   { selfTreatment: { blank1: "", blank2: "" }, selfPerception: { blank1: "", blank2: "" }, becoming: { blank1: "", blank2: "" } },
  self_complete: false,
  declaration: { claimedAt: null, sealSeen: false, revisedAt: [] },
  complete: false,
};

// Deterministic shuffle seeded by `${domainId}-${lens}-${pass}-${userId}` —
// chip display order is stable within a session but anti-anchored across users.
// Uses a small xorshift32 PRNG so it's pure and dependency-free.
export function shuffleSeeded<T>(arr: ReadonlyArray<T>, seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  if (h === 0) h = 0x9e3779b9;
  const next = () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17; h >>>= 0;
    h ^= h << 5;  h >>>= 0;
    return h / 0x100000000;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
