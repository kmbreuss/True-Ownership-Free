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

export type A3State = {
  m1: A3PeopleState; // People
  m2: A3EnvState; // Environment
  m3: A3MirrorStub; // Thoughts
  m4: A3MirrorStub; // Energy Map
  m5: A3MirrorStub; // The Board
  m6: A3MirrorStub; // The Move
};

export const EMPTY_A3: A3State = {
  m1: { ...EMPTY_A3_PEOPLE },
  m2: { ...EMPTY_A3_ENV },
  m3: {},
  m4: {},
  m5: {},
  m6: {},
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
