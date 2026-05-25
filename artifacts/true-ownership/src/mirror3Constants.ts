// A1 · Mirror 3 (Identity) — single source of truth for gift library,
// animal library, cluster archetype library, shadow libraries (Mind + Heart
// LOCKED; Spine/Spark/Hands fall back to `+ add` only), color tokens, and
// the empty state shape for `state.mirror3`. Locked per spec S29.

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────

export type Theme = "mind" | "heart" | "spine" | "spark" | "hands";

export const THEME_LABEL: Record<Theme, string> = {
  mind: "Mind",
  heart: "Heart",
  spine: "Spine",
  spark: "Spark",
  hands: "Hands",
};

// Eyebrow phrase rendered under each theme heading on Step 1a.
export const THEME_TAGLINE: Record<Theme, string> = {
  mind: "what I think with",
  heart: "what I care with",
  spine: "what I hold with",
  spark: "what I create with",
  hands: "what I do with",
};

export const THEME_COLOR: Record<Theme, string> = {
  mind: "#85B7EB",
  heart: "#F09595",
  spine: "#E27B7B",
  spark: "#AFA9EC",
  hands: "#97C459",
};

// Ship 5 · all five themes now have locked owner-voice shadow libraries
// in SHADOW_LIBRARY below. Step 3 (Under Pressure) renders 4 suggested
// chips for every library gift across every theme; custom-added gifts
// still fall through to `+ add` only by design.
export const SHADOWS_AVAILABLE: Record<Theme, boolean> = {
  mind:  true,
  heart: true,
  spine: true,
  spark: true,
  hands: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Gift library · LOCKED · 75 gifts (15 per theme)
// ─────────────────────────────────────────────────────────────────────────────

export const GIFTS_BY_THEME: Record<Theme, readonly string[]> = {
  mind: [
    "Strategic", "Wise", "Analytical", "Visionary", "Perceptive",
    "Discerning", "Reflective", "Inquisitive", "Sharp", "Curious",
    "Intuitive", "Insightful", "Thoughtful", "Clear", "Big-picture",
  ],
  heart: [
    "Warm", "Loyal", "Empathetic", "Generous", "Attuned",
    "Tender", "Devoted", "Open", "Compassionate", "Present",
    "Nurturing", "Kind", "Affectionate", "Forgiving", "Sensitive",
  ],
  spine: [
    "Bold", "Direct", "Steady", "Decisive", "Courageous",
    "Unshakeable", "Fierce", "Honest", "Sovereign", "Resilient",
    "Protective", "Anchored", "Grounded", "Unwavering", "Self-trusting",
  ],
  spark: [
    "Playful", "Creative", "Original", "Magnetic", "Alive",
    "Imaginative", "Inventive", "Bold-hearted", "Inspired", "Spirited",
    "Joyful", "Expressive", "Mischievous", "Free", "Wild",
  ],
  hands: [
    "Reliable", "Patient", "Precise", "Industrious", "Capable",
    "Resourceful", "Skillful", "Methodical", "Effective", "Steady-handed",
    "Diligent", "Practical", "Tactile", "Tending", "Self-sustaining",
  ],
} as const;

// Reverse lookup: gift label → theme. Useful for shadow rendering and
// cluster scoring. Built once at module load.
export const THEME_OF_GIFT: Record<string, Theme> = (() => {
  const out: Record<string, Theme> = {};
  (Object.keys(GIFTS_BY_THEME) as Theme[]).forEach((t) => {
    for (const g of GIFTS_BY_THEME[t]) out[g] = t;
  });
  return out;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Animal library · LOCKED · 31 animals
// ─────────────────────────────────────────────────────────────────────────────

export type Animal = {
  name: string;
  archetype: string;
  emoji: string;       // default emoji
  themes: Theme[];     // for cluster scoring
};

export const ANIMALS: readonly Animal[] = [
  { name: "Eagle",         archetype: "clarity at altitude",  emoji: "🦅", themes: ["mind"] },
  { name: "Owl",           archetype: "patient observer",     emoji: "🦉", themes: ["mind"] },
  { name: "Hawk",          archetype: "sharp focus",          emoji: "🦅", themes: ["mind", "spine"] },
  { name: "Dolphin",       archetype: "relational intelligence", emoji: "🐬", themes: ["heart", "mind"] },
  { name: "Bear",          archetype: "grounded protector",   emoji: "🐻", themes: ["heart", "hands"] },
  { name: "Elephant",      archetype: "deep memory, devoted", emoji: "🐘", themes: ["heart", "spine"] },
  { name: "Horse",         archetype: "noble endurance",      emoji: "🐴", themes: ["spine", "hands"] },
  { name: "Lion",          archetype: "direct authority",     emoji: "🦁", themes: ["spine"] },
  { name: "Wolf",          archetype: "loyal pack-leader",    emoji: "🐺", themes: ["spine", "heart"] },
  { name: "Fox",           archetype: "strategic adaptability", emoji: "🦊", themes: ["mind", "spark"] },
  { name: "Tiger",         archetype: "fierce sovereignty",   emoji: "🐅", themes: ["spine", "spark"] },
  { name: "Stag",          archetype: "dignified presence",   emoji: "🦌", themes: ["spine", "heart"] },
  { name: "Hummingbird",   archetype: "bright energy",        emoji: "🐦", themes: ["spark"] },
  { name: "Otter",         archetype: "playful intelligence", emoji: "🦦", themes: ["spark", "heart"] },
  { name: "Tortoise",      archetype: "patient builder",      emoji: "🐢", themes: ["hands", "spine"] },
  { name: "Mountain Goat", archetype: "sure-footed climber",  emoji: "🐐", themes: ["hands", "spine"] },
  { name: "Lioness",       archetype: "fierce nurturer",      emoji: "🦁", themes: ["heart", "spine"] },
  { name: "Doe",           archetype: "gentle awareness",     emoji: "🦌", themes: ["heart", "mind"] },
  { name: "Raven",         archetype: "wise observer",        emoji: "🦅", themes: ["mind", "spark"] },
  { name: "Swan",          archetype: "graceful sovereignty", emoji: "🦢", themes: ["heart", "spine"] },
  { name: "Panther",       archetype: "quiet intensity",      emoji: "🐆", themes: ["spine", "spark"] },
  { name: "Whale",         archetype: "deep knowing",         emoji: "🐋", themes: ["mind", "heart"] },
  { name: "Crow",          archetype: "clever messenger",     emoji: "🐦‍⬛", themes: ["mind", "spark"] },
  { name: "Hare",          archetype: "swift instinct",       emoji: "🐇", themes: ["spark", "mind"] },
  { name: "Snake",         archetype: "transformation",       emoji: "🐍", themes: ["spark", "spine"] },
  { name: "Falcon",        archetype: "precision in motion",  emoji: "🦅", themes: ["mind", "hands"] },
  { name: "Bee",           archetype: "devoted builder",      emoji: "🐝", themes: ["hands", "heart"] },
  { name: "Cat",           archetype: "self-possessed",       emoji: "🐈", themes: ["spine", "spark"] },
  { name: "Wolfhound",     archetype: "loyal guardian",       emoji: "🐕", themes: ["heart", "spine"] },
  { name: "Heron",         archetype: "still patience",       emoji: "🦩", themes: ["hands", "mind"] },
  { name: "Beaver",        archetype: "industrious builder",  emoji: "🦫", themes: ["hands", "spine"] },
] as const;

export const ANIMAL_BY_NAME: Record<string, Animal> = (() => {
  const out: Record<string, Animal> = {};
  for (const a of ANIMALS) out[a.name] = a;
  return out;
})();

export const EMOJI_BY_ANIMAL: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const a of ANIMALS) out[a.name] = a.emoji;
  return out;
})();

// ─────────────────────────────────────────────────────────────────────────────
// Cluster archetype library · LOCKED · 24 archetypes
// ─────────────────────────────────────────────────────────────────────────────

export type ClusterArchetype = {
  id: number;
  name: string;                  // editable suggestion on Step 1b
  giftCriteria: readonly string[]; // gifts to score against
  defaultAnimal: string;         // from ANIMALS by name
};

export const CLUSTER_ARCHETYPES: readonly ClusterArchetype[] = [
  { id: 1,  name: "The strategist in me",   giftCriteria: ["Strategic", "Wise", "Discerning", "Analytical", "Big-picture"], defaultAnimal: "Eagle" },
  { id: 2,  name: "The seer in me",          giftCriteria: ["Visionary", "Perceptive", "Insightful", "Intuitive"],          defaultAnimal: "Owl" },
  { id: 3,  name: "The sage in me",          giftCriteria: ["Wise", "Reflective", "Discerning", "Thoughtful"],              defaultAnimal: "Whale" },
  { id: 4,  name: "The healer in me",        giftCriteria: ["Empathetic", "Warm", "Compassionate", "Tender", "Present"],     defaultAnimal: "Dolphin" },
  { id: 5,  name: "The anchor in me",        giftCriteria: ["Warm", "Loyal", "Reliable", "Steady", "Patient"],               defaultAnimal: "Bear" },
  { id: 6,  name: "The keeper in me",        giftCriteria: ["Loyal", "Devoted", "Patient", "Steady", "Protective"],          defaultAnimal: "Wolfhound" },
  { id: 7,  name: "The warrior in me",       giftCriteria: ["Bold", "Direct", "Fierce", "Sovereign", "Courageous"],          defaultAnimal: "Lion" },
  { id: 8,  name: "The advocate in me",      giftCriteria: ["Honest", "Direct", "Loyal", "Courageous", "Protective"],        defaultAnimal: "Wolf" },
  { id: 9,  name: "The fire in me",          giftCriteria: ["Bold", "Fierce", "Magnetic", "Alive", "Spirited"],              defaultAnimal: "Tiger" },
  { id: 10, name: "The creator in me",       giftCriteria: ["Creative", "Original", "Inventive", "Imaginative", "Expressive"], defaultAnimal: "Fox" },
  { id: 11, name: "The spark in me",         giftCriteria: ["Playful", "Magnetic", "Alive", "Inspired", "Joyful"],           defaultAnimal: "Hummingbird" },
  { id: 12, name: "The builder in me",       giftCriteria: ["Reliable", "Methodical", "Capable", "Skillful", "Industrious"], defaultAnimal: "Beaver" },
  { id: 13, name: "The steward in me",       giftCriteria: ["Patient", "Reliable", "Devoted", "Grounded", "Tending"],        defaultAnimal: "Bee" },
  { id: 14, name: "The protector in me",     giftCriteria: ["Loyal", "Steady", "Resilient", "Devoted", "Protective"],        defaultAnimal: "Bear" },
  { id: 15, name: "The truth-teller in me",  giftCriteria: ["Honest", "Direct", "Sharp", "Perceptive", "Clear"],             defaultAnimal: "Hawk" },
  { id: 16, name: "The visionary in me",     giftCriteria: ["Visionary", "Inspired", "Magnetic", "Bold-hearted"],            defaultAnimal: "Eagle" },
  { id: 17, name: "The nurturer in me",      giftCriteria: ["Nurturing", "Warm", "Protective", "Tender", "Affectionate"],    defaultAnimal: "Lioness" },
  { id: 18, name: "The wild one in me",      giftCriteria: ["Wild", "Free", "Spirited", "Bold", "Mischievous"],              defaultAnimal: "Panther" },
  { id: 19, name: "The witness in me",       giftCriteria: ["Reflective", "Present", "Attuned", "Thoughtful", "Sensitive"],  defaultAnimal: "Doe" },
  { id: 20, name: "The mystic in me",        giftCriteria: ["Intuitive", "Insightful", "Visionary", "Reflective"],           defaultAnimal: "Raven" },
  { id: 21, name: "The sovereign in me",     giftCriteria: ["Sovereign", "Anchored", "Self-trusting", "Unwavering", "Honest"], defaultAnimal: "Swan" },
  { id: 22, name: "The hunter in me",        giftCriteria: ["Sharp", "Decisive", "Bold", "Strategic", "Perceptive"],         defaultAnimal: "Falcon" },
  { id: 23, name: "The teacher in me",       giftCriteria: ["Wise", "Patient", "Generous", "Clear", "Present"],              defaultAnimal: "Elephant" },
  { id: 24, name: "The wanderer in me",      giftCriteria: ["Curious", "Free", "Spirited", "Open", "Imaginative"],           defaultAnimal: "Hare" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Shadow library · Mind + Heart LOCKED · Spine/Spark/Hands deferred
// Spec S29: for any gift in a deferred theme, Step 3 shows the SAME row
// skeleton (gift → arrow → input area) but the input area contains ONLY the
// `+ add` affordance — no suggested chips, no different container, no
// placeholder cell. User-typed custom shadows are first-class candidates
// for primary flagging (burgundy dot `#A03B3B`).
// ─────────────────────────────────────────────────────────────────────────────

export const SHADOW_LIBRARY: Record<string, readonly string[]> = {
  // ── MIND ──
  "Strategic":   ["Cold", "Manipulative", "Overthinks", "Detached"],
  "Wise":        ["Withholding", "Aloof", "Preachy", "Judging"],
  "Analytical":  ["Paralyzed", "Cold", "Over-thinking", "Nit-picky"],
  "Visionary":   ["Untethered", "Impractical", "Pie-in-the-sky", "Disconnected"],
  "Perceptive":  ["Hyper-vigilant", "Mistrustful", "Suspicious", "Reads-too-much-in"],
  "Discerning":  ["Judging", "Critical", "Withholding", "Elitist"],
  "Reflective":  ["Stuck-in-head", "Paralyzed", "Ruminating", "Avoidant"],
  "Inquisitive": ["Intrusive", "Restless", "Never-satisfied", "Interrogating"],
  "Sharp":       ["Cutting", "Cold", "Cruel", "Dismissive"],
  "Curious":     ["Restless", "Distracted", "Never-satisfied", "Scattered"],
  "Intuitive":   ["Mistrustful", "Paranoid", "Reads-too-much-in", "Override-reason"],
  "Insightful":  ["Know-it-all", "Over-explaining", "Patronizing", "Withholding"],
  "Thoughtful":  ["Paralyzed", "Indecisive", "Over-considering", "Frozen"],
  "Clear":       ["Cutting", "Brutal", "Cold", "Reductive"],
  "Big-picture": ["Disconnected", "Vague", "Out-of-touch", "Bypasses-detail"],

  // ── HEART ──
  "Warm":          ["People-pleasing", "Smothering", "Enmeshed", "Performative"],
  "Loyal":         ["Self-abandoning", "Codependent", "Stays-too-long", "Sacrificing"],
  "Empathetic":    ["Absorbs-others", "Lost-in-them", "Boundaryless", "Drained"],
  "Generous":      ["Over-giving", "Depleted", "Martyring", "Resentful"],
  "Attuned":       ["Hyper-vigilant", "Tracking", "Walking-on-eggshells", "Anxious"],
  "Tender":        ["Fragile", "Easily-wounded", "Avoidant", "Collapsing"],
  "Devoted":       ["Obsessive", "Self-erasing", "Idolizing", "Stays-too-long"],
  "Open":          ["Unboundaried", "Over-shares", "Naive", "Exposed"],
  "Compassionate": ["Rescuing", "Enabling", "Over-extending", "Burnt-out"],
  "Present":       ["Hyper-attentive", "Self-forgetting", "Available-to-everyone", "Drained"],
  "Nurturing":     ["Smothering", "Controlling-through-care", "Enmeshed", "Self-sacrificing"],
  "Kind":          ["People-pleasing", "Conflict-avoidant", "Performative", "Self-suppressing"],
  "Affectionate":  ["Clingy", "Smothering", "Insecure", "Possessive"],
  "Forgiving":     ["Doormat", "Self-erasing", "Tolerating-harm", "Over-explaining-others"],
  "Sensitive":     ["Over-reactive", "Easily-wounded", "Withdrawing", "Hyper-personal"],

  // ── SPINE ── (owner's voice · matches locked GIFTS_BY_THEME.spine)
  "Bold":           ["Aggressive", "Overbearing", "Forcing", "Steamrolling"],
  "Direct":         ["Blunt", "Cutting", "Brusque", "Steamrolling"],
  "Steady":         ["Stagnant", "Plodding", "Predictable", "Slow"],
  "Decisive":       ["Rigid", "Closed", "Premature", "Dismissive"],
  "Courageous":     ["Reckless", "Charging", "Defiant", "Bulldozing"],
  "Unshakeable":    ["Rigid", "Closed", "Impenetrable", "Unmoved"],
  "Fierce":         ["Aggressive", "Volatile", "Intimidating", "Burning"],
  "Honest":         ["Brutal", "Tactless", "Wounding", "Self-righteous"],
  "Sovereign":      ["Aloof", "Untouchable", "Disconnected", "Above-it-all"],
  "Resilient":      ["Numbing", "Bulldozing", "Pushing-through", "Disconnected"],
  "Protective":     ["Walled", "Controlling", "Suffocating", "Possessive"],
  "Anchored":       ["Stuck", "Inflexible", "Heavy", "Immovable"],
  "Grounded":       ["Stuck", "Earthbound", "Resistant", "Joyless"],
  "Unwavering":     ["Stubborn", "Rigid", "Inflexible", "Closed-off"],
  "Self-trusting":  ["Self-referential", "Closed to input", "Arrogant", "Echo chamber"],

  // ── SPARK ── (owner's voice · matches locked GIFTS_BY_THEME.spark)
  "Playful":      ["Avoidant", "Flippant", "Unserious", "Childish"],
  "Creative":     ["Scattered", "Half-finished", "Restless", "Self-indulgent"],
  "Original":     ["Contrarian", "Different-for-different's-sake", "Isolated", "Self-important"],
  "Magnetic":     ["Performative", "Demanding attention", "Manipulative", "Draining"],
  "Alive":        ["Manic", "Overwhelming", "Too-much", "Exhausting"],
  "Imaginative":  ["Escapist", "Unrealistic", "Distracted", "Disconnected"],
  "Inventive":    ["Restless", "Half-finished", "Tinkering", "Never-shipping"],
  "Bold-hearted": ["Impulsive", "Volatile", "Reckless", "Burning bridges"],
  "Inspired":     ["Manic", "Burning out", "Unfocused", "Unsustainable"],
  "Spirited":     ["Volatile", "Over-the-top", "Burning out", "Performative"],
  "Joyful":       ["Performative", "Avoiding the hard thing", "Saccharine", "Bypassing"],
  "Expressive":   ["Performative", "Overflowing", "Self-centered", "Exhausting"],
  "Mischievous":  ["Disruptive", "Boundary-crossing", "Provocative", "Childish"],
  "Free":         ["Untethered", "Unaccountable", "Running", "Commitment-phobic"],
  "Wild":         ["Chaotic", "Reckless", "Untamed", "Destructive"],

  // ── HANDS ── (owner's voice · matches locked GIFTS_BY_THEME.hands)
  "Reliable":         ["Over-burdened", "Everyone's rock", "Resentful", "Trapped"],
  "Patient":          ["Avoidant", "Passive", "Enabling", "Stagnant"],
  "Precise":          ["Perfectionistic", "Rigid", "Joyless", "Pedantic"],
  "Industrious":      ["Workaholic", "Identity-via-output", "Restless", "Hollow"],
  "Capable":          ["Over-relied-on", "Stretched-thin", "Exhausted", "Indispensable"],
  "Resourceful":      ["Scrappy", "Cutting corners", "MacGyvering", "Patchwork"],
  "Skillful":         ["Perfectionistic", "Cold", "Mechanical", "Joyless"],
  "Methodical":       ["Slow", "Plodding", "Over-structured", "Joyless"],
  "Effective":        ["Cold", "Transactional", "Outcome-only", "Hollow"],
  "Steady-handed":    ["Mechanical", "Detached", "Going-through-motions", "Unfeeling"],
  "Diligent":         ["Grinding", "Joyless", "Over-working", "Brittle"],
  "Practical":        ["Reductive", "Joyless", "Dismissive", "Flattening"],
  "Tactile":          ["Hands-on to a fault", "Can't delegate", "Micromanaging", "Over-physical"],
  "Tending":          ["Smothering", "Self-erasing", "Codependent", "Enabling"],
  "Self-sustaining":  ["Isolated", "Refusing help", "Lone-wolf", "Over-burdened"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Seal copy · LOCKED
// ─────────────────────────────────────────────────────────────────────────────

export const SEAL_CLOSING_LINE = "Both are mine. Owning both is how I come home.";

// ─────────────────────────────────────────────────────────────────────────────
// M3 hub room metadata · veil text + ordering
// Owner-named rooms (NOT spec labels): Your Gifts (=1a Pick),
// Superpowers (=1b Shape, renamed Ship 5.5a from "Animals as Anchors"),
// Under Pressure (=Step 3), Own It (=Seal). Internal M3RoomKey "animals"
// kept for state stability — only the user-visible name changed.
// ─────────────────────────────────────────────────────────────────────────────

export const M3_VEIL_TEXT = {
  yourGifts:     "Looking at what you carry…",
  animals:       "Giving them a shape…",
  underPressure: "Where the gifts go shadow…",
  ownIt:         "The moment of claiming…",
} as const;

export type M3RoomKey = "yourGifts" | "animals" | "underPressure" | "ownIt";

export const M3_ROOMS: ReadonlyArray<{
  n: number;
  key: M3RoomKey;
  name: string;
  tone: "burgundy" | "yellow" | "green" | "purple" | "silver" | "gold";
  threshold: string;
  bodyShipped: boolean;
}> = [
  { n: 1, key: "yourGifts",     name: "Your Gifts",          tone: "burgundy", threshold: M3_VEIL_TEXT.yourGifts,     bodyShipped: true },
  { n: 2, key: "animals",       name: "Superpowers",         tone: "gold",     threshold: M3_VEIL_TEXT.animals,       bodyShipped: true },
  { n: 3, key: "underPressure", name: "Under Pressure",      tone: "burgundy", threshold: M3_VEIL_TEXT.underPressure, bodyShipped: true },
  { n: 4, key: "ownIt",         name: "Own It",              tone: "silver",   threshold: M3_VEIL_TEXT.ownIt,         bodyShipped: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Katherine's M3 seal · LOCKED
// Mirrors mirror2Constants SEAL_PARAGRAPHS / SEAL_GOLD_PHRASES so the existing
// renderSealParagraph helper can render M3 with its own phrase list + the M2
// .na2-decl-cer-para class for visual parity.
// "Align, Advocate, Act, Account" are capitalized inline — not styled gold.
// ─────────────────────────────────────────────────────────────────────────────

export const M3_SEAL_PARAGRAPHS: ReadonlyArray<string> = [
  "This is who you are.\nNot the polished version. Not the side you've been editing for safety.",
  "The way you lead, the way you give, the way you create —\nand the way each of those falls into shadow when you're under pressure.",
  "You can't grow what you won't claim.\nSo claim it. The full thing.",
  "In the work that's left, you'll Align, Advocate, Act, Account.\nOne step at a time.\nThat's how this gets lived.",
];

export const M3_SEAL_GOLD_PHRASES: ReadonlyArray<string> = [
  "This is who you are.",
  "claim it. The full thing.",
  "That's how this gets lived.",
];

// ─────────────────────────────────────────────────────────────────────────────
// State shape · `state.mirror3`
// ─────────────────────────────────────────────────────────────────────────────

export type GiftState = "owned" | "emerging";

export type PickedGift = {
  id: string;                 // `g_${slug}` for library, `g_custom_${slug}` for custom
  label: string;
  theme: Theme;
  state: GiftState;
  custom: boolean;
  // Ship 5.5a: true when the gift was added via the Superpowers "+ add"
  // bar or moved via the "Which creature?" picker. m3SyncStateToPicks
  // never relocates flagged gifts via archetype matching — the user's
  // placement wins. Optional/absent on legacy state defaults to false.
  manuallyPlaced?: boolean;
};

// Ship 5.5a · per-cluster Superpower sentence on the Superpowers (formerly
// Animals as Anchors) room. Three inline blanks below the gift bin:
//   "In my power, the {animal} {blank1}, {blank2}, and {blank3}."
// Placeholders: what I do well · what it gives me · what it gives others.
// All three blanks must be filled across every cluster for the
// "Continue to Under Pressure →" button to enable. Read by the Own It
// seal to compose per-creature Power sentence cards in Gate 5.5c.
export type SuperpowerSentence = {
  blank1: string;
  blank2: string;
  blank3: string;
};

export type Cluster = {
  id: string;                  // `c_${n}`
  name: string;
  nameWasEdited: boolean;
  animal: string;              // animal name (editable)
  animalEmoji: string;         // auto-assigned, swappable
  descriptorWord1: string;
  descriptorWord2: string;
  giftIds: string[];
  // Ship 5.5a · optional/absent on legacy state, defaults to empty
  // strings via the read-site helper.
  superpower?: SuperpowerSentence;
};

// Step 2 (Superpowers) is deferred — keeping the slot empty-typed for now.
export type SuperpowersMap = Record<string, unknown>;

// Ship 5.5a · canonical empty Superpower sentence for new + migrated
// clusters. Use via `getSuperpower(cluster)` to read with defaults.
export const EMPTY_SUPERPOWER: SuperpowerSentence = {
  blank1: "",
  blank2: "",
  blank3: "",
};

export function getSuperpower(c: Cluster): SuperpowerSentence {
  return c.superpower ?? EMPTY_SUPERPOWER;
}

export function isSuperpowerFilled(s: SuperpowerSentence): boolean {
  return (
    s.blank1.trim().length > 0 &&
    s.blank2.trim().length > 0 &&
    s.blank3.trim().length > 0
  );
}

export type ShadowsForGift = {
  pickedShadows: string[];     // library + custom union
  primaryShadow: string | null;
  customShadows: string[];     // user-typed adds (subset of pickedShadows)
};

// Ship 4.5 · Under Pressure now uses a 3-blank sentence completion in place
// of the free-text shadow story. Stored per cluster.id. Legacy string values
// from earlier demos are normalized on read in NewA1M3UnderPressureView.
export type ShadowSentence = {
  blank1: string;  // what I do
  blank2: string;  // what it costs me
  blank3: string;  // what it costs others
};

// Ship 5 · Seal note: the power/shadow line templates must adapt to a
// variable animal count (1–5 clusters, not the old fixed 3). Pattern:
//   1 → "In my power, I am the {a}."
//   2 → "In my power, I am the {a1} and the {a2}."
//   3 → "In my power, I am the {a1}, the {a2}, and the {a3}."
//   4–5 → same Oxford-comma list. Shadow line mirrors the structure.

export type Mirror3State = {
  pickedGifts: PickedGift[];
  clusters: Cluster[];
  superpowers: SuperpowersMap;
  shadows: Record<string, ShadowsForGift>; // keyed by gift.id
  // Stored as ShadowSentence per cluster.id. Older demo state may contain
  // legacy plain strings; normalize at the read site.
  shadowStories: Record<string, ShadowSentence | string>;
  sealCompleted: boolean;
  sealCompletedAt: string | null;
  sealRevisedAt: string[];
};

export const EMPTY_MIRROR3: Mirror3State = {
  pickedGifts: [],
  clusters: [],
  superpowers: {},
  shadows: {},
  shadowStories: {},
  sealCompleted: false,
  sealCompletedAt: null,
  sealRevisedAt: [],
};
