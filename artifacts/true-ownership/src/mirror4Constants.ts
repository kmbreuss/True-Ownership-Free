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
  // Ship 5.6d · Section 3a · Discover sub-steps
  | "read"
  | "v1"
  | "v2"
  | "v3"
  | "v4"
  | "v5"
  | "finish"
  // Section 1+ legacy + future
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

// Ship 5.6d · provenance chip label. When undefined, the chip is
// derived from `tier`. "flipped"/"new" are explicit overrides set
// by Section 3a flow when the user accepts a flip or types a new
// behavior — those keep tier:"warms" but render with their own chip.
export type M4BehaviorSource =
  | "lights"
  | "warms"
  | "bothers"
  | "turns"
  | "flipped"
  | "new";

export type M4Behavior = {
  id: string;
  text: string;
  person?: string;
  tier: M4BehaviorTier;
  source?: M4BehaviorSource;
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

// Ship 5.6d · Section 3a · Cluster schema
export type M4Flip = {
  irkId: string;
  toText: string;
  // null = unanswered, true = accepted (a flipped behavior was added),
  // false = skipped (row hidden until refresh; no behavior added).
  accepted: boolean | null;
};

export type M4ClusterStatus = "proposed" | "named" | "complete";

export type M4Cluster = {
  id: string;
  proposal: string;
  proposedNames: string[];
  behaviorIds: string[];
  flips: M4Flip[];
  userName: string;
  userDefinition: string;
  status: M4ClusterStatus;
  colorIndex: 1 | 2 | 3;
};

export type Mirror4State = {
  status: M4Status;
  currentStep: M4Step;
  admire: M4Behavior[];
  irks: M4Behavior[];
  portrait: M4Portrait;
  clusters: M4Cluster[];
  // Ship 5.6d · Katherine's one-paragraph intro for Step 4. Empty
  // until clustering runs. The 2-cluster soft prompt is prepended
  // here at cluster-creation time so it survives refresh.
  clustersNarrative: string;
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
  clustersNarrative: "",
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

// ─── Ship 5.6d · Section 3a · Cluster helpers ───
// Cluster IDs are stable: walk existing clusters for highest cl-N
// suffix and return `cl-${max+1}`. Tolerates malformed legacy IDs.
export function nextClusterId(state: Mirror4State): string {
  let max = 0;
  for (const c of state.clusters) {
    if (!c.id.startsWith("cl-")) continue;
    const n = parseInt(c.id.slice(3), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `cl-${max + 1}`;
}

// Color is locked at creation order — 1→c1, 2→c2, 3→c3, 4→c1, 5→c2.
// Rank reorders later in M4 do NOT change color (spec).
export function clusterColorForIndex(creationIndex: number): 1 | 2 | 3 {
  const mod = ((creationIndex - 1) % 3) + 1;
  return mod as 1 | 2 | 3;
}

// Map a behavior to the provenance chip label shown on per-value
// screens. Explicit `source` overrides (flipped/new) win; otherwise
// the chip mirrors the behavior's tier.
export function behaviorChipLabel(b: M4Behavior): string {
  const s = b.source ?? b.tier;
  return s.toUpperCase();
}

// Rule-based default flip text for an irk behavior — pure-syntactic,
// good enough as a starting point. The textarea is fully editable
// so Katherine (or 3b's Anthropic suggestion) will refine it.
export function defaultFlipText(irkText: string): string {
  const t = irkText.trim();
  if (!t) return "";
  // Heuristic: if it starts with a gerund ("Blaming…"), invert as
  // "Own my own… before…"; otherwise prepend "Instead, …".
  const first = t.split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first.endsWith("ing")) {
    return `Don't ${first.slice(0, -3)} — own it first.`;
  }
  return `Instead, do the opposite of: ${t}`;
}

// Rule-based fallback used when the Anthropic clustering call
// fails or returns malformed JSON. Per spec: group all lights+warms
// into cl-1 "From what lights you up" + all bothers+turns into cl-2
// "What you refuse to tolerate".
export function ruleBasedClusters(state: Mirror4State): {
  narrative: string;
  clusters: Array<{
    proposal: string;
    proposedNames: string[];
    behaviorIds: string[];
  }>;
} {
  const lightsWarmsIds = [
    ...state.portrait.lights,
    ...state.portrait.warms,
  ];
  const bothersTurnsIds = [
    ...state.portrait.bothers,
    ...state.portrait.turns,
  ];
  const out: ReturnType<typeof ruleBasedClusters>["clusters"] = [];
  if (lightsWarmsIds.length > 0) {
    out.push({
      proposal: "From what lights you up",
      proposedNames: ["Integrity", "Honor", "Self-Trust"],
      behaviorIds: lightsWarmsIds,
    });
  }
  if (bothersTurnsIds.length > 0) {
    out.push({
      proposal: "What you refuse to tolerate",
      proposedNames: ["Respect", "Honesty", "Standards"],
      behaviorIds: bothersTurnsIds,
    });
  }
  return {
    narrative:
      "Here's how I'd group your portrait — work each one and see what value sits underneath.",
    clusters: out,
  };
}

// Create a cluster from a raw proposal (Anthropic or rule-based),
// assigning a stable ID + locked color index. Initializes flips
// from the irk behaviors in the cluster's behaviorIds list using
// defaultFlipText. Returns the new state and the created cluster.
export function createCluster(
  state: Mirror4State,
  raw: {
    proposal: string;
    proposedNames: string[];
    behaviorIds: string[];
  },
): { state: Mirror4State; cluster: M4Cluster } {
  const id = nextClusterId(state);
  const creationIndex = state.clusters.length + 1;
  const colorIndex = clusterColorForIndex(creationIndex);
  const allBehaviors = [...state.admire, ...state.irks];
  // Ownership integrity: silently drop ids already claimed by an
  // earlier cluster. Prevents stale cross-references when Anthropic
  // returns the same behavior in two clusters.
  const ownedIds = new Set(
    allBehaviors
      .filter((b) => b.inUseByCluster != null)
      .map((b) => b.id),
  );
  const filteredIds = raw.behaviorIds.filter((id) => !ownedIds.has(id));
  const flips: M4Flip[] = filteredIds
    .map((bid) => allBehaviors.find((b) => b.id === bid))
    .filter((b): b is M4Behavior => !!b && (b.tier === "bothers" || b.tier === "turns"))
    .map((b) => ({
      irkId: b.id,
      toText: defaultFlipText(b.text),
      accepted: null,
    }));
  const cluster: M4Cluster = {
    id,
    proposal: raw.proposal,
    proposedNames: raw.proposedNames,
    behaviorIds: [...filteredIds],
    flips,
    userName: "",
    userDefinition: "",
    status: "proposed",
    colorIndex,
  };
  // Mark all referenced behaviors as in-use by this cluster.
  const setIds = new Set(filteredIds);
  const mark = (arr: M4Behavior[]): M4Behavior[] =>
    arr.map((b) =>
      setIds.has(b.id) && b.inUseByCluster == null
        ? { ...b, inUseByCluster: id }
        : b,
    );
  const next: Mirror4State = {
    ...state,
    admire: mark(state.admire),
    irks: mark(state.irks),
    clusters: [...state.clusters, cluster],
  };
  return { state: next, cluster };
}

export function updateCluster(
  state: Mirror4State,
  id: string,
  fn: (c: M4Cluster) => M4Cluster,
): Mirror4State {
  return {
    ...state,
    clusters: state.clusters.map((c) => (c.id === id ? fn(c) : c)),
  };
}

// Wipe all clusters + the narrative + clear inUseByCluster on every
// behavior. Used by the dev "Re-cluster from portrait" link.
export function clearAllClusters(state: Mirror4State): Mirror4State {
  const clearMark = (arr: M4Behavior[]): M4Behavior[] =>
    arr.map((b) =>
      b.inUseByCluster == null ? b : { ...b, inUseByCluster: null },
    );
  return {
    ...state,
    clusters: [],
    clustersNarrative: "",
    admire: clearMark(state.admire),
    irks: clearMark(state.irks),
  };
}

// Add a behavior to a cluster's behaviorIds (no-op if already present)
// and mark the behavior's inUseByCluster. Both must update together.
export function addBehaviorToCluster(
  state: Mirror4State,
  clusterId: string,
  behaviorId: string,
): Mirror4State {
  // Ownership integrity: reject (no-op) when the behavior is already
  // claimed by a DIFFERENT cluster. UI guards (mini-quadrant greys
  // out used chips) should make this unreachable, but the helper
  // stays defensive so a stale UI click can't corrupt state.
  const all = [...state.admire, ...state.irks];
  const found = all.find((b) => b.id === behaviorId);
  if (
    found &&
    found.inUseByCluster != null &&
    found.inUseByCluster !== clusterId
  ) {
    return state;
  }
  const mark = (arr: M4Behavior[]): M4Behavior[] =>
    arr.map((b) =>
      b.id === behaviorId && b.inUseByCluster == null
        ? { ...b, inUseByCluster: clusterId }
        : b,
    );
  return updateCluster(
    { ...state, admire: mark(state.admire), irks: mark(state.irks) },
    clusterId,
    (c) =>
      c.behaviorIds.includes(behaviorId)
        ? c
        : { ...c, behaviorIds: [...c.behaviorIds, behaviorId] },
  );
}

// Remove a behavior from a cluster's behaviorIds. If the behavior
// is no longer used by ANY cluster after removal, clear its
// inUseByCluster so it re-becomes pickable in the mini-quadrant.
export function removeBehaviorFromCluster(
  state: Mirror4State,
  clusterId: string,
  behaviorId: string,
): Mirror4State {
  const stripped = updateCluster(state, clusterId, (c) => ({
    ...c,
    behaviorIds: c.behaviorIds.filter((id) => id !== behaviorId),
    flips: c.flips.filter((f) => f.irkId !== behaviorId),
  }));
  const stillUsed = stripped.clusters.some((c) =>
    c.behaviorIds.includes(behaviorId),
  );
  if (stillUsed) return stripped;
  const clear = (arr: M4Behavior[]): M4Behavior[] =>
    arr.map((b) =>
      b.id === behaviorId ? { ...b, inUseByCluster: null } : b,
    );
  return { ...stripped, admire: clear(stripped.admire), irks: clear(stripped.irks) };
}

// Spelled-out count words for Step 8 title grammar.
export const COUNT_WORD: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
};

// Cluster color CSS variable name for inline style usage.
export function clusterColorVar(c: M4Cluster | { colorIndex: number }): string {
  return `var(--c${c.colorIndex})`;
}
