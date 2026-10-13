// ─────────────────────────────────────────────────────────────────────────────
// A3 · Advocate For It · State module (A3 Ship 1 · Hub + People)
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors a2Constants.ts' structural pattern (dedicated localStorage key +
// EMPTY_* + load/save/has helpers) for the A3 program. Ship 1 fills in
// Mirror 1 (People); Mirrors 2–6 (Environment, Thoughts, Energy Map,
// The Board, The Move) are empty stubs until their ships land and will
// replace each A3MirrorStub with its real shape.
//
// Hub gating note: cards unlock via booleans chained off the PREVIOUS card's
// unlock at the render site (see Mirror-gating memory) — this module only
// persists per-mirror data + claimed flags; it never stores unlock state.
// ─────────────────────────────────────────────────────────────────────────────

export const A3_STORAGE_KEY = "to_a3_state_v1";

// Placeholder per-mirror state. Empty until each mirror's ship fills it in.
export type A3MirrorStub = Record<string, never>;

// Mirror 1 (People) rating. Advocate = pulls you toward the life you claimed
// (gold), Neutral = neither (muted grey), Anchor = pulls you back (burgundy).
export type A3PeopleRating = "advocate" | "neutral" | "anchor";

// A3 Ship 1 · Mirror 1 (People). Two working stages (1 Name them · 2 Rate
// them) plus a Claim stage. `names` preserves brain-dump order; `ratings` maps
// name → rating (a name ABSENT from the map is unrated — presence is what
// marks it rated). The Board (later ship) reads the advocates out of
// `ratings` as its head-start pool. `claimed` is the SOLE driver of the
// People card's Complete state on the A3 hub.
export type A3PeopleState = {
  names: string[];
  ratings: Record<string, A3PeopleRating>;
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_PEOPLE: A3PeopleState = {
  names: [],
  ratings: {},
  claimed: false,
  claimedAt: null,
};

// A3 Ship 2 · Mirror 2 (Environment). Same two-stage + Claim model as People,
// but each item carries a kind tag (Habit = behaviour you repeat, Place = an
// environment that shapes you) and the rating lives ON the item (not a side
// map) so Energy Map / The Move can read { name, kind, rating } later.
// `rating: null` = not yet rated. `takeaway` is the optional free-text
// "one to change, one to protect" note captured on the Claim stage — it
// never gates the claim.
export type A3EnvKind = "habit" | "place";
export type A3EnvItem = {
  name: string;
  kind: A3EnvKind;
  rating: A3PeopleRating | null;
};
export type A3EnvState = {
  items: A3EnvItem[];
  takeaway: string;
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_ENV: A3EnvState = {
  items: [],
  takeaway: "",
  claimed: false,
  claimedAt: null,
};

// A3 Ship 3 · Mirror 3 (Thoughts). "Listen" captures the inner voice one
// moment at a time; "Shape" marks each line Coach or Critic and (for critics)
// captures a friend's reframe, then names the voice as-it-is and the
// best-friend voice. Mirrors A3EnvState's shape: a working array whose items
// carry their own verdict (null = not yet marked, like A3EnvItem.rating), plus
// the two voice names and the claim flag. Energy Map reads coach→advocate /
// critic→anchor off `thoughts`; The Move reads the critics.
export type A3ThoughtVerdict = "coach" | "critic";
export type A3Thought = {
  text: string;
  verdict: A3ThoughtVerdict | null;
  reframe: string;
};
export type A3ThoughtsState = {
  thoughts: A3Thought[];
  voiceNow: string;
  voiceWant: string;
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_THOUGHTS: A3ThoughtsState = {
  thoughts: [],
  voiceNow: "",
  voiceWant: "",
  claimed: false,
  claimedAt: null,
};

// A3 Ship 4 · Mirror 4 (Energy Map). A "see-it" synthesis room: it reads and
// aggregates People (m1) + Environment (m2) + Thoughts (m3) into one bullseye
// and takes NO new input — so its only persisted state is the claim flag.
export type A3EnergyMapState = {
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_ENERGYMAP: A3EnergyMapState = {
  claimed: false,
  claimedAt: null,
};

// A3 Ship 5 · Mirror 5 (The Board). Each seat is a ROLE the user wants in their
// corner, with the FIRST person they go to for it. `role`/`desc` are editable;
// `name` "" = an empty seat (allowed and meaningful — names who they're still
// looking for). `inLife` marks whether that person is already in their life or
// aspirational (null until a name is seated). One person may fill more than one
// seat. Seats are deletable and addable, so the array length is the seat count.
// The Board reads the advocates out of m1 as its head-start pool; The Move
// (m6) will later read the seated names.
export type A3BoardInLife = "life" | "asp";
export type A3BoardSeat = {
  role: string;
  desc: string;
  name: string;
  inLife: A3BoardInLife | null;
};
export type A3BoardState = {
  seats: A3BoardSeat[];
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_BOARD: A3BoardState = {
  seats: [],
  claimed: false,
  claimedAt: null,
};

// A3 Ship 6 · Mirror 6 (The Move). Where the audit becomes a decision: from the
// draining People (neutral/anchor), the draining Environment (neutral/anchor),
// and the critic Thoughts, the user picks ONE of each, then stars the ONE
// `bottleneck` lane to move first (today's focus); the other two chosen items
// wait. Picks are stored as their LABEL (person name / env item name / thought
// text) — the natural stable key — with the LANE implied by which field holds
// it (person = a Person, env = a Habit/Place, thought = a Thought). This is the
// hand-off payload A4 will read: three labels, each lane-tagged by field, plus
// which lane is the starred focus. All three picks may be null (an empty audit
// is valid). `bottleneck` names the starred lane, or null when nothing is
// chosen.
export type A3MoveLane = "person" | "env" | "thought";
export type A3MoveState = {
  person: string | null; // chosen Person name (m1 neutral/anchor pool)
  env: string | null; // chosen Habit/Place name (m2 neutral/anchor pool)
  thought: string | null; // chosen Thought text (m3 critics)
  bottleneck: A3MoveLane | null; // starred lane = today's focus for A4
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A3_MOVE: A3MoveState = {
  person: null,
  env: null,
  thought: null,
  bottleneck: null,
  claimed: false,
  claimedAt: null,
};

export type A3State = {
  m1: A3PeopleState; // People
  m2: A3EnvState; // Environment
  m3: A3ThoughtsState; // Thoughts
  m4: A3EnergyMapState; // Energy Map
  m5: A3BoardState; // The Board
  m6: A3MoveState; // The Move
};

export const EMPTY_A3: A3State = {
  m1: { ...EMPTY_A3_PEOPLE },
  m2: { ...EMPTY_A3_ENV },
  m3: { ...EMPTY_A3_THOUGHTS },
  m4: { ...EMPTY_A3_ENERGYMAP },
  m5: { ...EMPTY_A3_BOARD },
  m6: { ...EMPTY_A3_MOVE },
};

const A3_PEOPLE_RATINGS: readonly A3PeopleRating[] = [
  "advocate",
  "neutral",
  "anchor",
];

// Coerce an unknown blob into a valid A3PeopleState, dropping garbage so a
// corrupt store can't poison the People mirror. Ratings whose key doesn't
// match a surviving name are dropped too, so the two structures never drift.
function normalizeA3People(raw: unknown): A3PeopleState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const rawNames = r.names;
  const seen = new Set<string>();
  const names: string[] = [];
  if (Array.isArray(rawNames)) {
    for (const n of rawNames) {
      if (typeof n !== "string") continue;
      const t = n.trim();
      if (t === "" || seen.has(t)) continue;
      seen.add(t);
      names.push(t);
    }
  }
  const ratings: Record<string, A3PeopleRating> = {};
  const rawRatings = r.ratings;
  if (rawRatings && typeof rawRatings === "object") {
    for (const [k, v] of Object.entries(
      rawRatings as Record<string, unknown>,
    )) {
      if (seen.has(k) && A3_PEOPLE_RATINGS.includes(v as A3PeopleRating)) {
        ratings[k] = v as A3PeopleRating;
      }
    }
  }
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { names, ratings, claimed, claimedAt };
}

// Coerce an unknown blob into a valid A3EnvState, mirroring
// normalizeA3People: drop non-string/blank/duplicate names, coerce unknown
// kinds to "habit" (the toggle default) and unknown ratings to null so a
// corrupt store can't poison the Environment mirror.
function normalizeA3Env(raw: unknown): A3EnvState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const seen = new Set<string>();
  const items: A3EnvItem[] = [];
  if (Array.isArray(r.items)) {
    for (const it of r.items) {
      if (!it || typeof it !== "object") continue;
      const o = it as Record<string, unknown>;
      if (typeof o.name !== "string") continue;
      const name = o.name.trim();
      if (name === "" || seen.has(name)) continue;
      seen.add(name);
      const kind: A3EnvKind = o.kind === "place" ? "place" : "habit";
      const rating = A3_PEOPLE_RATINGS.includes(o.rating as A3PeopleRating)
        ? (o.rating as A3PeopleRating)
        : null;
      items.push({ name, kind, rating });
    }
  }
  const takeaway = typeof r.takeaway === "string" ? r.takeaway : "";
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { items, takeaway, claimed, claimedAt };
}

// Coerce an unknown blob into a valid A3ThoughtsState, mirroring
// normalizeA3Env: drop non-string/blank thought texts, coerce unknown verdicts
// to null and non-string reframes to "", so a corrupt store can't poison the
// Thoughts mirror.
function normalizeA3Thoughts(raw: unknown): A3ThoughtsState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const thoughts: A3Thought[] = [];
  if (Array.isArray(r.thoughts)) {
    for (const it of r.thoughts) {
      if (!it || typeof it !== "object") continue;
      const o = it as Record<string, unknown>;
      if (typeof o.text !== "string") continue;
      const text = o.text.trim();
      if (text === "") continue;
      const verdict: A3ThoughtVerdict | null =
        o.verdict === "coach" || o.verdict === "critic"
          ? (o.verdict as A3ThoughtVerdict)
          : null;
      const reframe = typeof o.reframe === "string" ? o.reframe : "";
      thoughts.push({ text, verdict, reframe });
    }
  }
  const voiceNow = typeof r.voiceNow === "string" ? r.voiceNow : "";
  const voiceWant = typeof r.voiceWant === "string" ? r.voiceWant : "";
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { thoughts, voiceNow, voiceWant, claimed, claimedAt };
}

// Coerce an unknown blob into a valid A3EnergyMapState. Energy Map stores only
// the claim, so this is just the claimed/claimedAt shape.
function normalizeA3EnergyMap(raw: unknown): A3EnergyMapState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { claimed, claimedAt };
}

// Coerce an unknown blob into a valid A3BoardState, mirroring normalizeA3Env:
// drop non-object seats, coerce role/desc/name to strings and inLife to a valid
// value (null otherwise) so a corrupt store can't poison the Board mirror.
function normalizeA3Board(raw: unknown): A3BoardState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const seats: A3BoardSeat[] = [];
  if (Array.isArray(r.seats)) {
    for (const it of r.seats) {
      if (!it || typeof it !== "object") continue;
      const o = it as Record<string, unknown>;
      const role = typeof o.role === "string" ? o.role : "";
      const desc = typeof o.desc === "string" ? o.desc : "";
      const name = typeof o.name === "string" ? o.name : "";
      const inLife: A3BoardInLife | null =
        o.inLife === "life" || o.inLife === "asp"
          ? (o.inLife as A3BoardInLife)
          : null;
      seats.push({ role, desc, name, inLife });
    }
  }
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { seats, claimed, claimedAt };
}

// Coerce an unknown blob into a valid A3MoveState: each pick is a non-empty
// string label or null; bottleneck is a valid lane or null. A bottleneck whose
// lane has no pick is dropped to null so the starred lane and the picks can't
// drift apart.
function normalizeA3Move(raw: unknown): A3MoveState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const pick = (v: unknown): string | null =>
    typeof v === "string" && v.trim() !== "" ? v : null;
  const person = pick(r.person);
  const env = pick(r.env);
  const thought = pick(r.thought);
  const lanePicked: Record<A3MoveLane, string | null> = { person, env, thought };
  let bottleneck: A3MoveLane | null =
    r.bottleneck === "person" || r.bottleneck === "env" || r.bottleneck === "thought"
      ? (r.bottleneck as A3MoveLane)
      : null;
  if (bottleneck && !lanePicked[bottleneck]) bottleneck = null;
  const claimed = r.claimed === true;
  const claimedAt =
    typeof r.claimedAt === "string" && r.claimedAt.trim() !== ""
      ? r.claimedAt
      : null;
  return { person, env, thought, bottleneck, claimed, claimedAt };
}

export function loadA3State(): A3State {
  try {
    if (typeof window === "undefined") return EMPTY_A3;
    const raw = window.localStorage.getItem(A3_STORAGE_KEY);
    if (!raw) return EMPTY_A3;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Shallow-merge over EMPTY_A3 so future schema additions get sensible
      // defaults on older stored blobs, then normalize m1 so a legacy
      // empty-object stub upgrades to the real People shape.
      const merged = { ...EMPTY_A3, ...parsed } as A3State;
      merged.m1 = normalizeA3People((parsed as { m1?: unknown }).m1);
      merged.m2 = normalizeA3Env((parsed as { m2?: unknown }).m2);
      merged.m3 = normalizeA3Thoughts((parsed as { m3?: unknown }).m3);
      merged.m4 = normalizeA3EnergyMap((parsed as { m4?: unknown }).m4);
      merged.m5 = normalizeA3Board((parsed as { m5?: unknown }).m5);
      merged.m6 = normalizeA3Move((parsed as { m6?: unknown }).m6);
      return merged;
    }
  } catch {}
  return EMPTY_A3;
}

export function saveA3State(state: A3State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(A3_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// True when the A3 schema has ever been written. Used by the hub to seed
// EMPTY_A3 on first-ever mount.
export function hasA3State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(A3_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
