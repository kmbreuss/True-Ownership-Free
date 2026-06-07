// ─────────────────────────────────────────────────────────────────────────────
// A2 · Align With It · State module (A2.0 · hub scaffold)
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors mirror4Constants.ts' structural pattern (dedicated localStorage
// key + EMPTY_* + load/save/has helpers) for the A2 program. A2.0 only
// initializes an empty schema stub — one empty object per mirror. The
// per-mirror internals (M1 Alignment Check, M2 Time Audit, M3 Focus +
// Commit, M4 Integrity Claim) land in A2.1+ and will replace each
// A2MirrorStub with its real shape.
// ─────────────────────────────────────────────────────────────────────────────

export const A2_STORAGE_KEY = "to_a2_state_v1";

// Placeholder per-mirror state. Empty until A2.1+ fills each mirror in.
export type A2MirrorStub = Record<string, never>;

export type A2State = {
  m1: A2MirrorStub;
  m2: A2MirrorStub;
  m3: A2MirrorStub;
  m4: A2MirrorStub;
};

export const EMPTY_A2: A2State = {
  m1: {},
  m2: {},
  m3: {},
  m4: {},
};

export function loadA2State(): A2State {
  try {
    if (typeof window === "undefined") return EMPTY_A2;
    const raw = window.localStorage.getItem(A2_STORAGE_KEY);
    if (!raw) return EMPTY_A2;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Shallow-merge over EMPTY_A2 so future schema additions get
      // sensible defaults on older stored blobs.
      return { ...EMPTY_A2, ...parsed } as A2State;
    }
  } catch {}
  return EMPTY_A2;
}

export function saveA2State(state: A2State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(A2_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// True when the A2 schema has ever been written. Used by the hub to seed
// EMPTY_A2 on first-ever mount.
export function hasA2State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(A2_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
