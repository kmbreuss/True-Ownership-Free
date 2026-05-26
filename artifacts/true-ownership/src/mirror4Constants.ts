// ─────────────────────────────────────────────────────────────────────────────
// Mirror 4 · Values · State module (Ship 5.6a · Section 1 scaffold)
// ─────────────────────────────────────────────────────────────────────────────
// Owner-approved (Ship 5.6a) — Mirror M3's structural pattern (separate
// constants file + EMPTY_* + load/save helpers), with a DEDICATED
// localStorage key per owner spec, NOT the shared `KEYS.map` blob M3
// nests inside. This is the one intentional deviation from M3's actual
// storage location (called out in the Ship 5.6a deviations note).
//
// Section 1 (this scaffold) only initializes the schema and exposes the
// room list. Section 2+ will fill in admire/irks/portrait/clusters/etc.
// ─────────────────────────────────────────────────────────────────────────────

export const M4_STORAGE_KEY = "to_mirror4_state_v1";

export type M4Step =
  | "admire"
  | "irks"
  | "portrait"
  | "clusters"
  | "operationalize"
  | "rank"
  | "pressureTest"
  | "claim";

export type M4Status = "not_started" | "in_progress" | "complete";

// Ship 5.6b · Section 2 · Behavior schema
// Each admire / irks entry is a stable-ID record. IDs use prefix
// "ad-" / "ir-" to mark origin; once dragged across tier they keep
// their original ID even if they move from admire→irks (spec: IDs
// are stable). `inUseByCluster` is reserved for Section 3a — until
// then the field is always null. Section 3a guards against deleting
// an in-use behavior; portrait chips render with .used styling when
// non-null.
export type M4BehaviorTier = "lights" | "warms" | "bothers" | "turns";

export type M4Behavior = {
  id: string;
  text: string;
  person?: string;
  tier: M4BehaviorTier;
  inUseByCluster: string | null;
};

export type M4Portrait = {
  lights: string[];
  warms: string[];
  bothers: string[];
  turns: string[];
};

export type M4PressureTest = {
  complete: boolean;
  pairs: unknown[];
  conflicts: number;
  rankChanges: number;
};

export type Mirror4State = {
  status: M4Status;
  currentStep: M4Step;
  admire: M4Behavior[];
  irks: M4Behavior[];
  portrait: M4Portrait;
  clusters: unknown[];
  operationalize: Record<string, unknown>;
  rank: unknown[];
  pressureTest: M4PressureTest;
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_MIRROR4: Mirror4State = {
  status: "not_started",
  currentStep: "admire",
  admire: [],
  irks: [],
  portrait: { lights: [], warms: [], bothers: [], turns: [] },
  clusters: [],
  operationalize: {},
  rank: [],
  pressureTest: { complete: false, pairs: [], conflicts: 0, rankChanges: 0 },
  claimed: false,
  claimedAt: null,
};

// ─── M4 room registry ───
// Mirrors M3's M3_ROOMS shape so NewA1M4HubView can reuse the M3 hub
// render pattern verbatim. Section 1 ships with only Discover's body
// (a "Coming in Section 2" placeholder). Operationalize/Rank/Claim
// have bodyShipped:false → veil falls back to hub on click.
// Claim has tone:"gold" + is rendered with a 3px gold left accent.
export type M4RoomKey = "discover" | "operationalize" | "rank" | "claim";

export const M4_ROOMS: ReadonlyArray<{
  n: number;
  key: M4RoomKey;
  name: string;
  tone: "burgundy" | "yellow" | "green" | "purple" | "silver" | "gold";
  threshold: string;
  bodyShipped: boolean;
}> = [
  {
    n: 1,
    key: "discover",
    name: "Discover",
    tone: "burgundy",
    threshold: "Surfacing what you admire…",
    bodyShipped: true,
  },
  {
    // Ship 5.6b · Part A polish: user-facing label is "Behaviors".
    // Internal key stays "operationalize" so state.mirror4.operationalize
    // remains stable (schema in production, no migration).
    n: 2,
    key: "operationalize",
    name: "Behaviors",
    tone: "yellow",
    threshold: "Naming the behaviors…",
    bodyShipped: false,
  },
  {
    n: 3,
    key: "rank",
    name: "Rank",
    tone: "green",
    threshold: "Putting them in order…",
    bodyShipped: false,
  },
  {
    n: 4,
    key: "claim",
    name: "Claim",
    tone: "gold",
    threshold: "The moment of claiming…",
    bodyShipped: false,
  },
];

// ─── load / save helpers ───
// Dedicated localStorage key (owner spec). Safe in non-DOM contexts and
// against quota/parse errors — both fall back to EMPTY_MIRROR4.
export function loadMirror4State(): Mirror4State {
  try {
    if (typeof window === "undefined") return EMPTY_MIRROR4;
    const raw = window.localStorage.getItem(M4_STORAGE_KEY);
    if (!raw) return EMPTY_MIRROR4;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Shallow-merge over EMPTY_MIRROR4 so any future schema additions
      // get sensible defaults on older stored blobs.
      return { ...EMPTY_MIRROR4, ...parsed } as Mirror4State;
    }
  } catch {}
  return EMPTY_MIRROR4;
}

export function saveMirror4State(state: Mirror4State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(M4_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// True when the M4 schema has ever been written. Used by the hub
// container to seed EMPTY_MIRROR4 on first-ever mount.
export function hasMirror4State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(M4_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ─── Ship 5.6b · Section 2 · Behavior helpers ───
// Tier → which array (admire vs irks) it lives in. Light/warm tiers
// live in `admire`; bothers/turns in `irks`. Used by addBehavior and
// changeBehaviorTier to keep arrays consistent when the user drags a
// chip between quadrants.
export function tierKind(tier: M4BehaviorTier): "admire" | "irks" {
  return tier === "lights" || tier === "warms" ? "admire" : "irks";
}

// Stable next ID. Walks ALL existing behaviors (both arrays) to find
// the highest numeric suffix for the requested prefix and returns
// `${prefix}${max+1}`. Tolerates malformed legacy IDs (skips them).
export function nextBehaviorId(
  state: Mirror4State,
  kind: "admire" | "irks",
): string {
  const prefix = kind === "admire" ? "ad-" : "ir-";
  const all = [...state.admire, ...state.irks];
  let max = 0;
  for (const b of all) {
    if (!b.id.startsWith(prefix)) continue;
    const n = parseInt(b.id.slice(prefix.length), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `${prefix}${max + 1}`;
}

// Rebuild the portrait index from the canonical behavior arrays.
// Source of truth is `behavior.tier` on each entry in admire/irks;
// portrait is a derived index of IDs grouped by tier (spec: portrait
// stores arrays of behavior IDs per tier, behaviors live once and
// are referenced by ID). Called after every mutation.
export function rebuildPortrait(state: Mirror4State): M4Portrait {
  const portrait: M4Portrait = {
    lights: [],
    warms: [],
    bothers: [],
    turns: [],
  };
  for (const b of [...state.admire, ...state.irks]) {
    portrait[b.tier].push(b.id);
  }
  return portrait;
}

export function addBehavior(
  state: Mirror4State,
  kind: "admire" | "irks",
  text: string,
  tier: M4BehaviorTier,
  person?: string,
): Mirror4State {
  const id = nextBehaviorId(state, kind);
  const b: M4Behavior = {
    id,
    text: text.trim(),
    tier,
    inUseByCluster: null,
  };
  const p = person?.trim();
  if (p) b.person = p;
  const next: Mirror4State = {
    ...state,
    admire: kind === "admire" ? [...state.admire, b] : state.admire,
    irks: kind === "irks" ? [...state.irks, b] : state.irks,
  };
  next.portrait = rebuildPortrait(next);
  return next;
}

export function deleteBehavior(
  state: Mirror4State,
  id: string,
): Mirror4State {
  const next: Mirror4State = {
    ...state,
    admire: state.admire.filter((b) => b.id !== id),
    irks: state.irks.filter((b) => b.id !== id),
  };
  next.portrait = rebuildPortrait(next);
  return next;
}

// Move a behavior to a new tier. If the tier change crosses the
// admire/irks boundary (e.g. lights → bothers), the behavior moves
// to the other array while keeping its original ID (spec: IDs are
// stable). Same-tier calls are no-ops.
export function changeBehaviorTier(
  state: Mirror4State,
  id: string,
  newTier: M4BehaviorTier,
): Mirror4State {
  const existing =
    state.admire.find((b) => b.id === id) ??
    state.irks.find((b) => b.id === id);
  if (!existing || existing.tier === newTier) return state;
  const updated: M4Behavior = { ...existing, tier: newTier };
  const stripped: Mirror4State = {
    ...state,
    admire: state.admire.filter((b) => b.id !== id),
    irks: state.irks.filter((b) => b.id !== id),
  };
  const newKind = tierKind(newTier);
  const next: Mirror4State = {
    ...stripped,
    admire: newKind === "admire" ? [...stripped.admire, updated] : stripped.admire,
    irks: newKind === "irks" ? [...stripped.irks, updated] : stripped.irks,
  };
  next.portrait = rebuildPortrait(next);
  return next;
}

export function findBehavior(
  state: Mirror4State,
  id: string,
): M4Behavior | undefined {
  return (
    state.admire.find((b) => b.id === id) ??
    state.irks.find((b) => b.id === id)
  );
}

export const M4_TIER_LABEL: Record<M4BehaviorTier, string> = {
  lights: "Lights me up",
  warms: "Warms me",
  bothers: "Bothers me",
  turns: "Turns my stomach",
};

export const M4_TIER_ICON: Record<M4BehaviorTier, string> = {
  lights: "★ ",
  warms: "",
  bothers: "",
  turns: "⚡ ",
};
