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
  admire: unknown[];
  irks: unknown[];
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
    n: 2,
    key: "operationalize",
    name: "Operationalize",
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
