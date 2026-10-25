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

import { notifyLocalChange } from "./syncHook";
import { previewRead, previewWrite } from "./devPreview";

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

// Ship 5.6i · Section 5 — typed pressure-test schema.
// Pair entries are written once per user pick (or skip). `pickedId`
// is null when the user took the "they don't actually compete for me"
// skip; otherwise it's the cluster id the user chose. `matchedRank`
// is true if the pick was the value positioned HIGHER in rank[] at
// the moment of the pick (so re-orders flip it true post-swap).
// `activePairIdx` is where the modal resumes when reopened.
export type M4PressureTestPair = {
  aId: string;
  bId: string;
  pickedId: string | null;
  matchedRank: boolean;
};
export type M4PressureTest = {
  complete: boolean;
  pairs: M4PressureTestPair[];
  conflicts: number;
  rankChanges: number;
  activePairIdx: number;
  // Ship 5.6k · Part B · AI-generated scenarios per pair.
  // Key format: `${minClusterId}__${maxClusterId}` so either pair
  // order resolves to the same key. Empty until the user clicks
  // Got it — start → on the Intro screen (Anthropic call fires
  // there and writes the full batch in one go). Walk-again wipes
  // this back to {}; Re-order regenerates only the un-walked tail.
  scenarios: Record<string, string>;
};

// Ship 5.6k · stable key for scenarios lookup. Pair order in
// pressureTest.pairs is whatever m4PressureTestPairs produced; the
// scenario response could come back in either order; sort by id
// so both producer and consumer compute the same key.
export function m4ScenarioKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}__${bId}` : `${bId}__${aId}`;
}

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
  // The one evidence behavior the user marks as this standard's truest
  // signal — an id within behaviorIds. null = no keystone (optional).
  keystoneBehaviorId: string | null;
  status: M4ClusterStatus;
  colorIndex: 1 | 2 | 3;
  // Ship 5.6f · Section 3b — ordered list of peel words/phrases the
  // user produced inside the Naming modal's State A. Persisted so the
  // modal can resume the breadcrumb after refresh and so the Ask-
  // Katherine prompts can include it as context.
  peelChain: string[];
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
  operationalize: Record<string, M4OperationalizeValue>;
  // Ship 5.6i · Section 5 — array of cluster IDs, top = highest
  // priority. Empty until first entry to Rank room; defaulted to
  // cluster creation order on that first entry.
  rank: string[];
  pressureTest: M4PressureTest;
  claimed: boolean;
  claimedAt: string | null;
  // Ship 5.6g · Section 4 — active value chip in the Behaviors room.
  // Persisted so refresh restores the same value the user was editing.
  // null = "no value selected yet" (default to first complete cluster).
  behaviorsActiveClusterId: string | null;
  // Ship 5.6g · per-cluster pre-fill happens once on first entry to
  // the Behaviors room with that value active. After that the
  // operationalize[clusterId] entry is the source of truth.
  behaviorsPrefilledFor: string[];
  // Phase 2 · per-rung completion flags for the Discover ladder rungs
  // (Admire / Irks / Portrait). Set true when the user taps Continue on
  // that rung, so a rung can read "done" even when its content is
  // legitimately empty (e.g. no irks). Name-the-standards derives done
  // from clusters, not from a flag.
  discoverSections: { admire: boolean; irks: boolean; portrait: boolean };
  // Phase 3 · Flip-the-irks decisions, one entry per irk the user has
  // worked through. accepted=true spawns a source:"flipped" behavior in
  // the admire pool (id af-<irkId>); accepted=false = skipped (nothing
  // added); absent = not yet worked through. Top-level (not per-cluster)
  // because flipping happens before the user groups standards.
  flips: M4Flip[];
};

// Ship 5.6g · Section 4 — typed operationalize schema. The fifth
// "bothers"/"turns" sources from M4Behavior collapse into "warms"
// for Behaviors room provenance per spec ordering (Lights → Warms
// → Flipped → New); we keep the original chip kind for display via
// na1-m4-pv-chip is-{source} so bothers/turns still render distinct.
export type M4OperationalizeSource = M4BehaviorSource;

export type M4OperationalizeBehavior = {
  id: string;
  name: string;
  practice: string[];
  source: M4OperationalizeSource;
  sourceBehaviorId: string | null;
};

export type M4OperationalizeValue = {
  behaviors: M4OperationalizeBehavior[];
  keystoneId: string | null;
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
  pressureTest: {
    complete: false,
    pairs: [],
    conflicts: 0,
    rankChanges: 0,
    activePairIdx: 0,
    scenarios: {},
  },
  claimed: false,
  claimedAt: null,
  behaviorsActiveClusterId: null,
  behaviorsPrefilledFor: [],
  discoverSections: { admire: false, irks: false, portrait: false },
  flips: [],
};

// ─── M4 room registry ───
// Mirrors M3's M3_ROOMS shape so NewA1M4HubView can reuse the M3 hub
// render pattern verbatim. Section 1 ships with only Discover's body
// (a "Coming in Section 2" placeholder). Operationalize/Rank/Claim
// have bodyShipped:false → veil falls back to hub on click.
// Claim has tone:"gold" + is rendered with a 3px gold left accent.
export type M4RoomKey =
  | "admire"
  | "irks"
  | "portrait"
  | "flip"
  | "name"
  | "operationalize"
  | "rank"
  | "claim";

export const M4_ROOMS: ReadonlyArray<{
  n: number;
  key: M4RoomKey;
  name: string;
  tone: "burgundy" | "yellow" | "green" | "purple" | "silver" | "gold";
  threshold: string;
  bodyShipped: boolean;
  // Phase 2 · "coming soon" rung (Flip the irks). Locked, non-blocking,
  // never flashes. Body ships in Phase 3.
  comingSoon?: boolean;
}> = [
  {
    n: 1,
    key: "admire",
    name: "Admire",
    tone: "burgundy",
    threshold: "Surfacing what you admire…",
    bodyShipped: true,
  },
  {
    n: 2,
    key: "irks",
    name: "Irks",
    tone: "purple",
    threshold: "Naming what irks you…",
    bodyShipped: true,
  },
  {
    n: 3,
    key: "portrait",
    name: "Portrait",
    tone: "silver",
    threshold: "Seeing the whole portrait…",
    bodyShipped: true,
  },
  {
    // Phase 3 · live rung. Flip the irks unlocks off Portrait and flashes
    // as the next rung; it stays non-blocking (Name also unlocks off
    // Portrait), so a user with no irks is never gated by it.
    n: 4,
    key: "flip",
    name: "Flip the Irks",
    tone: "silver",
    threshold: "Flipping what irks you…",
    bodyShipped: true,
  },
  {
    // Name the Standards is the single place the whole value is built:
    // the standard name + its evidence behaviors (assign from pool or
    // author fresh). The former "Behaviors" (operationalize) rung was
    // removed — its evidence lives inside each standard here. The
    // operationalize state/type is kept vestigial (migration-safe) but
    // is no longer a rung and no longer gates the chain.
    n: 5,
    key: "name",
    name: "Name the Standards",
    tone: "yellow",
    threshold: "Naming your standards…",
    bodyShipped: true,
  },
  {
    n: 6,
    key: "rank",
    name: "Rank",
    tone: "green",
    threshold: "Putting them in order…",
    bodyShipped: true,
  },
  {
    n: 7,
    key: "claim",
    name: "Claim",
    tone: "gold",
    threshold: "The moment of claiming…",
    bodyShipped: true,
  },
];

// ─── Phase 2 · completion helpers ───
// "Complete" cluster = a named standard with at least one piece of
// evidence (behavior). userDefinition is no longer required (kept on the
// type as a vestigial field). Centralized so the hub, the A1 stepper,
// and the Behaviors room all read the same predicate and never drift.
export function m4IsClusterComplete(c: M4Cluster): boolean {
  return c.userName.trim() !== "" && c.behaviorIds.length > 0;
}

// Keystone = the one evidence behavior the user marks as the truest signal
// of a standard, stored as keystoneBehaviorId (an id within the cluster's
// behaviorIds). Toggle semantics: marking the current keystone clears it,
// marking another moves it. One keystone per value, optional. No-op if the
// behavior is not part of the cluster.
export function m4SetKeystone(
  state: Mirror4State,
  clusterId: string,
  behaviorId: string,
): Mirror4State {
  return updateCluster(state, clusterId, (c) => {
    if (!c.behaviorIds.includes(behaviorId)) return c;
    return {
      ...c,
      keystoneBehaviorId:
        c.keystoneBehaviorId === behaviorId ? null : behaviorId,
    };
  });
}

// Resolve an evidence behavior's display text from its id by scanning the
// admire + irks pools. Returns null when the id is unknown (e.g. a stale
// keystone pointer after the behavior was deleted). Used by Claim and the
// Rank pressure-test to surface the real keystone behavior.
export function m4BehaviorTextById(
  state: Mirror4State,
  id: string | null,
): string | null {
  if (!id) return null;
  const b = [...state.admire, ...state.irks].find((x) => x.id === id);
  return b ? b.text.trim() || null : null;
}

// Per-rung "done" for the 8-rung Values ladder. Admire/Irks/Portrait read
// their persisted discoverSections flag (set on Continue) OR fall back to
// content so existing blobs that predate the flag still show as done.
// Flip is the reserved "coming soon" rung — never done in Phase 2.
export function m4RoomDone(state: Mirror4State, key: M4RoomKey): boolean {
  const ds = state.discoverSections ?? {
    admire: false,
    irks: false,
    portrait: false,
  };
  switch (key) {
    case "admire":
      return ds.admire === true || state.admire.length > 0;
    case "irks":
      return ds.irks === true || state.irks.length > 0;
    case "portrait":
      return ds.portrait === true || state.clusters.length > 0;
    case "flip":
      return m4FlipsDone(state);
    case "name":
      return state.clusters.some(m4IsClusterComplete);
    case "operationalize": {
      const complete = state.clusters.filter(m4IsClusterComplete);
      return (
        complete.length >= 3 &&
        complete.every((c) => {
          const op = state.operationalize[c.id];
          return (op?.behaviors?.length ?? 0) >= 3 && !!op?.keystoneId;
        })
      );
    }
    case "rank":
      return state.pressureTest.complete === true;
    case "claim":
      return state.claimed === true;
    default:
      return false;
  }
}

// ─── load / save helpers ───
// Dedicated localStorage key (owner spec). Safe in non-DOM contexts and
// against quota/parse errors — both fall back to EMPTY_MIRROR4.
export function loadMirror4State(): Mirror4State {
  try {
    if (typeof window === "undefined") return EMPTY_MIRROR4;
    const raw = previewRead(M4_STORAGE_KEY) ?? window.localStorage.getItem(M4_STORAGE_KEY);
    if (!raw) return EMPTY_MIRROR4;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Shallow-merge over EMPTY_MIRROR4 so any future schema additions
      // get sensible defaults on older stored blobs.
      const merged = { ...EMPTY_MIRROR4, ...parsed } as Mirror4State;
      // Ship 5.6f · per-cluster migration — older blobs (pre-3b)
      // don't carry peelChain. Default to [] without dropping any
      // other fields the cluster might have.
      if (Array.isArray(merged.clusters)) {
        merged.clusters = merged.clusters.map((c) =>
          Array.isArray((c as M4Cluster).peelChain)
            ? c
            : { ...c, peelChain: [] as string[] },
        );
      }
      // Phase 2 fix · discard legacy AI-proposed clusters on load. The
      // user-driven redesign must start existing profiles with an empty
      // grouping area + an admires-only pool — never pre-made standards
      // or AI-suggested names. Drop every "proposed" cluster, release any
      // behavior it claimed back to the ungrouped pool (clear the stored
      // inUseByCluster pointer), and strip the vestigial proposal /
      // proposedNames from any user-created clusters that survive. Raw
      // admire/irks behaviors are preserved untouched. Idempotent.
      if (Array.isArray(merged.clusters)) {
        // Only drop clusters that are UNAMBIGUOUSLY old AI proposals: the
        // AI-only "proposed" status AND carrying an AI proposal/proposedNames
        // AND with no user-entered name. A standard the user named or built
        // must NEVER be deleted — even a legacy one mistakenly saved as
        // "proposed" survives as long as it has a userName (best-effort
        // recovery of standards lost to the earlier bug).
        const droppedClusterIds = new Set(
          merged.clusters
            .filter(
              (c) =>
                c.status === "proposed" &&
                ((typeof c.proposal === "string" && c.proposal !== "") ||
                  (Array.isArray(c.proposedNames) &&
                    c.proposedNames.length > 0)) &&
                !(typeof c.userName === "string" && c.userName.trim() !== ""),
            )
            .map((c) => c.id),
        );
        if (droppedClusterIds.size > 0) {
          merged.clusters = merged.clusters.filter(
            (c) => !droppedClusterIds.has(c.id),
          );
          const releaseRefs = (arr: M4Behavior[]): M4Behavior[] =>
            arr.map((b) =>
              b.inUseByCluster != null &&
              droppedClusterIds.has(b.inUseByCluster)
                ? { ...b, inUseByCluster: null }
                : b,
            );
          if (Array.isArray(merged.admire))
            merged.admire = releaseRefs(merged.admire);
          if (Array.isArray(merged.irks))
            merged.irks = releaseRefs(merged.irks);
        }
        merged.clusters = merged.clusters.map((c) =>
          c.proposal === "" && c.proposedNames.length === 0
            ? c
            : { ...c, proposal: "", proposedNames: [] },
        );
        // Keystone-per-value · default keystoneBehaviorId on older blobs
        // that predate the field (migration-safe → no keystone). Also drop
        // a stale pointer if the behavior no longer belongs to the cluster.
        merged.clusters = merged.clusters.map((c) => {
          const k =
            typeof c.keystoneBehaviorId === "string" ? c.keystoneBehaviorId : null;
          return {
            ...c,
            keystoneBehaviorId:
              k != null && c.behaviorIds.includes(k) ? k : null,
          };
        });
      }
      // Ship 5.6g · Section 4 — defensive defaults for older blobs
      // that predate the operationalize / behaviors schema fields.
      if (!merged.operationalize || typeof merged.operationalize !== "object")
        merged.operationalize = {};
      if (!Array.isArray(merged.behaviorsPrefilledFor))
        merged.behaviorsPrefilledFor = [];
      if (typeof merged.behaviorsActiveClusterId === "undefined")
        merged.behaviorsActiveClusterId = null;
      // Phase 2 · discoverSections default for older blobs. Coerce to
      // strict booleans so a partial object can't leave a field undefined.
      if (
        !merged.discoverSections ||
        typeof merged.discoverSections !== "object"
      ) {
        merged.discoverSections = {
          admire: false,
          irks: false,
          portrait: false,
        };
      } else {
        merged.discoverSections = {
          admire: merged.discoverSections.admire === true,
          irks: merged.discoverSections.irks === true,
          portrait: merged.discoverSections.portrait === true,
        };
      }
      // Phase 3 · flips default for older blobs; drop malformed entries and
      // coerce `accepted` to a strict boolean | null (a stray value must not
      // read as "worked through" in m4FlipsDone).
      if (!Array.isArray(merged.flips)) merged.flips = [];
      else
        merged.flips = merged.flips
          .filter(
            (f) =>
              f &&
              typeof f.irkId === "string" &&
              typeof f.toText === "string",
          )
          .map((f) => ({
            irkId: f.irkId,
            toText: f.toText,
            accepted:
              f.accepted === true || f.accepted === false
                ? f.accepted
                : null,
          }));
      // Ship 5.6i · Section 5 — rank + pressureTest defensive defaults
      // for older blobs that predate the typed schema. activePairIdx
      // was added in 5.6i; older blobs default it to 0.
      if (!Array.isArray(merged.rank)) merged.rank = [];
      else merged.rank = merged.rank.filter((id) => typeof id === "string");
      if (!merged.pressureTest || typeof merged.pressureTest !== "object") {
        merged.pressureTest = {
          complete: false,
          pairs: [],
          conflicts: 0,
          rankChanges: 0,
          activePairIdx: 0,
          scenarios: {},
        };
      } else {
        const pt = merged.pressureTest as Partial<M4PressureTest>;
        // Ship 5.6k · scenarios migration. Older blobs predate this
        // field; default to {} and drop any malformed values so the
        // render-time lookup never blows up.
        const rawScenarios = (pt as { scenarios?: unknown }).scenarios;
        const scenarios: Record<string, string> = {};
        if (rawScenarios && typeof rawScenarios === "object") {
          for (const [k, v] of Object.entries(
            rawScenarios as Record<string, unknown>,
          )) {
            if (typeof v === "string") scenarios[k] = v;
          }
        }
        merged.pressureTest = {
          complete: typeof pt.complete === "boolean" ? pt.complete : false,
          pairs: Array.isArray(pt.pairs)
            ? (pt.pairs.filter(
                (p) =>
                  p &&
                  typeof p === "object" &&
                  typeof (p as M4PressureTestPair).aId === "string" &&
                  typeof (p as M4PressureTestPair).bId === "string",
              ) as M4PressureTestPair[])
            : [],
          conflicts: typeof pt.conflicts === "number" ? pt.conflicts : 0,
          rankChanges:
            typeof pt.rankChanges === "number" ? pt.rankChanges : 0,
          activePairIdx:
            typeof pt.activePairIdx === "number" ? pt.activePairIdx : 0,
          scenarios,
        };
      }
      return merged;
    }
  } catch {}
  return EMPTY_MIRROR4;
}

export function saveMirror4State(state: Mirror4State): void {
  if (previewWrite(M4_STORAGE_KEY, JSON.stringify(state))) return;
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(M4_STORAGE_KEY, JSON.stringify(state));
    notifyLocalChange(M4_STORAGE_KEY);
  } catch {}
}

// True when the M4 schema has ever been written. Used by the hub
// container to seed EMPTY_MIRROR4 on first-ever mount.
export function hasMirror4State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return previewRead(M4_STORAGE_KEY) !== undefined || window.localStorage.getItem(M4_STORAGE_KEY) !== null;
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
    // Phase 3 · accepted flips live in the admire array (so they surface
    // in the Name-the-standards pool) but are NOT part of the Admire/Irks
    // portrait — skip them so they never leak into a quadrant.
    if (b.source === "flipped") continue;
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

// Edit the free-text of a behavior in place (Admire/Irks/Portrait).
// Tier and portrait membership are unchanged, so no portrait rebuild
// is needed. Empty/whitespace text is rejected — the caller keeps the
// original value.
export function editBehaviorText(
  state: Mirror4State,
  id: string,
  text: string,
): Mirror4State {
  const t = text.trim();
  if (!t) return state;
  const apply = (arr: M4Behavior[]): M4Behavior[] =>
    arr.map((b) => (b.id === id ? { ...b, text: t } : b));
  return {
    ...state,
    admire: apply(state.admire),
    irks: apply(state.irks),
  };
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

// ─── Phase 3 · Flip-the-irks helpers (user-driven, no AI) ──────────
// The irks the Flip rung walks: only Bothers / Turns behaviors (an irk
// is a boundary in disguise). Lights/Warms admire behaviors are not
// flippable.
export function m4FlippableIrks(state: Mirror4State): M4Behavior[] {
  return state.irks.filter(
    (b) => b.tier === "bothers" || b.tier === "turns",
  );
}

// Stable id for the source:"flipped" behavior an accepted flip spawns in
// the admire pool. Deterministic so accept is idempotent and skip can
// find + remove it.
function flippedBehaviorId(irkId: string): string {
  return `af-${irkId}`;
}

// The persisted flip for an irk, or a fresh unanswered default whose
// suggested text is rule-based (no AI / no network).
export function m4FlipFor(state: Mirror4State, irk: M4Behavior): M4Flip {
  return (
    state.flips.find((f) => f.irkId === irk.id) ?? {
      irkId: irk.id,
      toText: defaultFlipText(irk.text),
      accepted: null,
    }
  );
}

// Upsert a flip entry, patching only the provided fields.
function upsertFlip(
  state: Mirror4State,
  irkId: string,
  patch: Partial<Omit<M4Flip, "irkId">>,
): Mirror4State {
  const exists = state.flips.some((f) => f.irkId === irkId);
  const flips = exists
    ? state.flips.map((f) => (f.irkId === irkId ? { ...f, ...patch } : f))
    : [
        ...state.flips,
        {
          irkId,
          toText: patch.toText ?? "",
          accepted: patch.accepted ?? null,
        },
      ];
  return { ...state, flips };
}

// Edit a flip's suggested text. If the flip is already accepted, keep the
// spawned flipped behavior's text in sync. For an accepted flip, blank text
// is a no-op: the spawned behavior must stay non-empty, so we never persist
// a blank that would desync flip.toText from the admire-pool behavior.
export function m4SetFlipText(
  state: Mirror4State,
  irkId: string,
  text: string,
): Mirror4State {
  const flip = state.flips.find((f) => f.irkId === irkId);
  if (flip?.accepted === true && !text.trim()) return state;
  let next = upsertFlip(state, irkId, { toText: text });
  if (flip?.accepted === true) {
    const bId = flippedBehaviorId(irkId);
    const t = text.trim();
    next = {
      ...next,
      admire: next.admire.map((b) => (b.id === bId ? { ...b, text: t } : b)),
    };
  }
  return next;
}

// Accept a flip: persist accepted=true with the (edited) text and ensure a
// source:"flipped" behavior exists in the admire pool so it can be grouped
// into a standard. Empty text is a no-op (can't accept a blank flip).
export function m4AcceptFlip(
  state: Mirror4State,
  irk: M4Behavior,
  text: string,
): Mirror4State {
  const t = text.trim();
  if (!t) return state;
  const bId = flippedBehaviorId(irk.id);
  let next = upsertFlip(state, irk.id, { toText: t, accepted: true });
  const exists = next.admire.some((b) => b.id === bId);
  if (exists) {
    next = {
      ...next,
      admire: next.admire.map((b) =>
        b.id === bId ? { ...b, text: t } : b,
      ),
    };
  } else {
    const beh: M4Behavior = {
      id: bId,
      text: t,
      tier: "warms",
      source: "flipped",
      inUseByCluster: null,
    };
    next = { ...next, admire: [...next.admire, beh] };
  }
  return next;
}

// Skip a flip: persist accepted=false and remove the spawned flipped
// behavior (releasing it from any standard first). Nothing is added to the
// pool for a skipped irk.
export function m4SkipFlip(
  state: Mirror4State,
  irkId: string,
): Mirror4State {
  const bId = flippedBehaviorId(irkId);
  let next = state;
  const beh = next.admire.find((b) => b.id === bId);
  if (beh?.inUseByCluster) {
    next = removeBehaviorFromCluster(next, beh.inUseByCluster, bId);
  }
  next = { ...next, admire: next.admire.filter((b) => b.id !== bId) };
  return upsertFlip(next, irkId, { accepted: false });
}

// Mark every still-unanswered flippable irk as skipped. Called when the
// user taps Continue on the Flip rung so the rung reports done (accepted
// flips are kept; the rest are treated as skipped).
export function m4FinalizeFlips(state: Mirror4State): Mirror4State {
  let next = state;
  for (const irk of m4FlippableIrks(next)) {
    const f = next.flips.find((x) => x.irkId === irk.id);
    if (!f || f.accepted === null) {
      next = m4SkipFlip(next, irk.id);
    }
  }
  return next;
}

// The Flip rung is done once every flippable irk has been worked through
// (accepted or skipped). No flippable irks → done gracefully (empty state).
export function m4FlipsDone(state: Mirror4State): boolean {
  const irks = m4FlippableIrks(state);
  if (irks.length === 0) return true;
  return irks.every((irk) => {
    const f = state.flips.find((x) => x.irkId === irk.id);
    return f != null && f.accepted !== null;
  });
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
    keystoneBehaviorId: null,
    // User-authored standard. Must NOT be "proposed" — that status is reserved
    // for stale AI-generated groups, which the load-time migration deletes.
    // Tagging a user-created cluster "proposed" caused it to be wiped on the
    // next loadMirror4State() (data loss). Completion never reads status (only
    // userName + behaviorIds), so this is purely a migration-safety marker.
    status: "named",
    colorIndex,
    peelChain: [],
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
    keystoneBehaviorId:
      c.keystoneBehaviorId === behaviorId ? null : c.keystoneBehaviorId,
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

// Author a fresh evidence behavior straight onto a standard. Used by the
// "+ add behavior" affordance in Name the Standards so the whole value
// (name + evidence) is built in one place — no trip back to Admire/Irks.
// The new behavior is a real admire-pool record (tier "lights") that is
// immediately assigned to the cluster. Removing it back to the pool makes
// it a normal admired behavior again, consistent with the rest of Values.
export function addEvidenceBehaviorToCluster(
  state: Mirror4State,
  clusterId: string,
  text: string,
): Mirror4State {
  const t = text.trim();
  if (!t) return state;
  const id = nextBehaviorId(state, "admire");
  const b: M4Behavior = {
    id,
    text: t,
    tier: "lights",
    inUseByCluster: null,
  };
  let next: Mirror4State = { ...state, admire: [...state.admire, b] };
  next.portrait = rebuildPortrait(next);
  return addBehaviorToCluster(next, clusterId, id);
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

// ─── Ship 5.6g · Section 4 · Behaviors room helpers ──────────────
// Source ordering for pre-fill (Lights → Warms → Flipped → New).
// Bothers/turns get folded into the same source ordering bucket as
// warms for sort purposes but keep their own provenance chip kind.
const M4_OP_SOURCE_RANK: Record<M4BehaviorSource, number> = {
  lights: 0,
  warms: 1,
  bothers: 1,
  turns: 1,
  flipped: 2,
  new: 3,
};

// Build the initial operationalize entry for a cluster from its
// portrait behaviors + accepted flips. Pure helper (no state writes)
// so callers can compose it into a mutate(s => ...) cycle. Caps at
// 5 by dropping lowest-intensity entries last. Behavior IDs prefixed
// `b-` with a stable per-cluster counter.
export function buildOperationalizeForCluster(
  state: Mirror4State,
  cluster: M4Cluster,
): M4OperationalizeValue {
  const lookup = new Map<string, M4Behavior>();
  for (const b of [...state.admire, ...state.irks]) lookup.set(b.id, b);
  const items: M4OperationalizeBehavior[] = [];
  let n = 1;
  // Portrait behaviors (lights / warms / bothers / turns / new).
  for (const id of cluster.behaviorIds) {
    const beh = lookup.get(id);
    if (!beh) continue;
    const src: M4OperationalizeSource = beh.source ?? beh.tier;
    items.push({
      id: `b-${n++}`,
      name: beh.text,
      practice: [],
      source: src,
      sourceBehaviorId: beh.id,
    });
  }
  // Accepted flips → "flipped".
  for (const flip of cluster.flips) {
    if (flip.accepted !== true) continue;
    const toText = (flip.toText ?? "").trim();
    if (!toText) continue;
    items.push({
      id: `b-${n++}`,
      name: toText,
      practice: [],
      source: "flipped",
      sourceBehaviorId: flip.irkId,
    });
  }
  // Sort by source rank (stable within bucket).
  items.sort(
    (a, b) => M4_OP_SOURCE_RANK[a.source] - M4_OP_SOURCE_RANK[b.source],
  );
  // Cap at 5 — drop from the end (lowest-intensity sources first).
  const capped = items.slice(0, 5);
  return { behaviors: capped, keystoneId: null };
}

// Stable next behavior id within an operationalize entry. Walks
// existing behaviors to find the highest b-N suffix and returns N+1.
export function nextOpBehaviorId(value: M4OperationalizeValue): string {
  let max = 0;
  for (const b of value.behaviors) {
    if (!b.id.startsWith("b-")) continue;
    const n = parseInt(b.id.slice(2), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `b-${max + 1}`;
}

// ─── Ship 5.6i · Section 5 · Pressure-test pair generation ───────
// Deterministic, adjacent-first ordering. For N named values:
//   1. Emit all pairs grouped by gap (1..N-1); within a gap, by
//      starting index. This is the "adjacent first, then jumping"
//      order called out in the spec (e.g. for N=4: (1,2)(2,3)(3,4)
//      then (1,3)(2,4) then (1,4)).
//   2. If the total exceeds the 10-pair cap (only possible at N≥5
//      under normal Mirror 4 limits), keep all adjacent pairs and
//      deterministically pick the remaining slots from the non-
//      adjacent pool using a seed derived from the rank order. The
//      same rank → same selection every render.
// Used by both the Begin-Pressure-Test card's pair count and the
// modal's pair walk. Already-walked pair entries in state.mirror4
// .pressureTest.pairs[] persist independently; this helper only
// produces the canonical (a,b) sequence for the current rank.
export const M4_PRESSURE_TEST_CAP = 10;
export function m4PressureTestPairs(
  rankIds: readonly string[],
): Array<{ aId: string; bId: string }> {
  const N = rankIds.length;
  if (N < 2) return [];
  const allByGap: Array<{ aId: string; bId: string; gap: number }> = [];
  for (let gap = 1; gap < N; gap++) {
    for (let i = 0; i + gap < N; i++) {
      allByGap.push({
        aId: rankIds[i]!,
        bId: rankIds[i + gap]!,
        gap,
      });
    }
  }
  if (allByGap.length <= M4_PRESSURE_TEST_CAP) {
    return allByGap.map(({ aId, bId }) => ({ aId, bId }));
  }
  const adjacent = allByGap.filter((p) => p.gap === 1);
  const rest = allByGap.filter((p) => p.gap > 1);
  // Seed = rolling hash of rankIds. Stable for a given rank order.
  let seed = 0;
  for (let i = 0; i < rankIds.length; i++) {
    const s = rankIds[i]!;
    for (let j = 0; j < s.length; j++) {
      seed = (Math.imul(seed, 31) + s.charCodeAt(j)) | 0;
    }
    seed = (Math.imul(seed, 17) + i) | 0;
  }
  let rngState = (seed >>> 0) || 1;
  const rng = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...rest];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffled[i]!;
    const b = shuffled[j]!;
    shuffled[i] = b;
    shuffled[j] = a;
  }
  const take = M4_PRESSURE_TEST_CAP - adjacent.length;
  return [...adjacent, ...shuffled.slice(0, Math.max(0, take))].map(
    ({ aId, bId }) => ({ aId, bId }),
  );
}
