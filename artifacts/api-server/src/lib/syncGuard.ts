// Decision logic for the "never overwrite newer data with older" guard on the
// versioned new-flow keys. Pure (no DB) so it can be unit-tested.
//
// A synced value is wrapped as { t: <client modified time, epoch ms>, v: <payload> }.
// A write is accepted only if its `t` is >= the stored `t`.

export const SYNC_KEYS = new Set(["a2state", "a3state", "a4state", "a5state", "m4state", "a1progress", "a1practical", "rcstate", "setaside"]);

export type Wrapped = { t: number; v: unknown };

export function isWrapped(x: unknown): x is Wrapped {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as { t?: unknown }).t === "number" &&
    Number.isFinite((x as { t: number }).t) &&
    "v" in (x as object)
  );
}

// A client clock running far ahead would otherwise "lock" a key: nothing from a
// correct clock could ever be newer. Clamp to a small allowance past server time.
export const FUTURE_SKEW_MS = 5 * 60 * 1000;

export function clampT(t: number, now: number): number {
  return Math.min(t, now + FUTURE_SKEW_MS);
}

export type Decision =
  | { action: "insert"; value: Wrapped }
  | { action: "update"; value: Wrapped }
  | { action: "conflict"; current: Wrapped };

export function decideWrite(
  existing: unknown,
  incoming: Wrapped,
  now: number,
): Decision {
  const value: Wrapped = { t: clampT(incoming.t, now), v: incoming.v };
  if (!isWrapped(existing)) {
    // Nothing stored yet (or a non-versioned legacy value): accept.
    return existing === undefined || existing === null
      ? { action: "insert", value }
      : { action: "update", value };
  }
  if (existing.t > value.t) return { action: "conflict", current: existing };
  return { action: "update", value };
}
