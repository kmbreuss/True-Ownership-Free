// ─── New-flow progress → server sync ─────────────────────────────────────────
// A1 exercise progress, A2, A3, A4, A5 and Values (Mirror 4) answers used to live only in
// the browser. This module mirrors them to the member's account so they follow
// the member to any device (and to map-of-me.com).
//
// Each store is saved on the server as a versioned value { t, v }:
//   t = when it was last changed on the device that wrote it (epoch ms)
//   v = the payload itself
// Rules (the server enforces the same ones — see api-server/src/lib/syncGuard.ts):
//   • local has data, server has none            → push local up
//   • server has data, this browser has none     → adopt server
//   • both have data                             → the newer `t` wins; an older
//                                                  copy NEVER replaces a newer one
//   • a pristine/empty store is never pushed (an empty seed must not beat real data)
// Nothing here ever deletes local data.
import { setChangeHandler } from "./syncHook";
import { isDevPreview } from "./devPreview";
import { EMPTY_A2 } from "./a2Constants";
import { EMPTY_A3 } from "./a3Constants";
import { EMPTY_A4 } from "./a4Constants";
import { EMPTY_RC, normalizeRC, RC_STORAGE_KEY } from "./rcConstants";
import { EMPTY_SETASIDE } from "./reality-check/rcJourney";
import { EMPTY_A5 } from "./a5Constants";
import { EMPTY_MIRROR4 } from "./mirror4Constants";
import { EMPTY_PRACTICAL, normalizePractical } from "./a1End/practical";
import { EMPTY_DECISIONS, normalizeDecisions, mergeDecisions } from "../../../lib/decision-model";
import { accountCacheReady, accountGeneration, onAccountBoundary } from "./lib/accountIsolation";

export const A1_PROGRESS_KEYS = [
  "a1_ex1_done",
  "a1_ex2_done",
  "a1_ex3_done",
  "a1_ex4_done",
  "a1_to_curq",
  "a1_to_answers",
  "a1_sym_holdback",
  "a1_sym_picks",
  "a1_sym_note",
  "a1_peel_draft",
  "a1_notice",
];

type Store = { sk: string; label: string; lks: string[]; empty?: unknown };
export const STORES: Store[] = [
  { sk: "decisions", label: "My decisions", lks: ["to_decisions_v1"], empty: EMPTY_DECISIONS },
  { sk: "rcstate", label: "Reality Check", lks: ["to_rc_state_v1"], empty: EMPTY_RC },
  { sk: "setaside", label: "Set aside to sort in A4", lks: ["to_setaside_v1"], empty: EMPTY_SETASIDE },
  { sk: "a1progress", label: "A1 exercise progress", lks: A1_PROGRESS_KEYS },
  { sk: "a1practical", label: "A1 · This week", lks: ["to_a1_practical_v1"], empty: EMPTY_PRACTICAL },
  { sk: "a2state", label: "A2 · Align With It", lks: ["to_a2_state_v1"], empty: EMPTY_A2 },
  { sk: "a3state", label: "A3 · Advocate For It", lks: ["to_a3_state_v1"], empty: EMPTY_A3 },
  { sk: "a4state", label: "A4 · Act On It", lks: ["to_a4_state_v1"], empty: EMPTY_A4 },
  { sk: "a5state", label: "A5 · Accountable To It", lks: ["to_a5_state_v1"], empty: EMPTY_A5 },
  { sk: "m4state", label: "Values (Mirror 4)", lks: ["to_mirror4_state_v1"], empty: EMPTY_MIRROR4 },
];
const META_KEY = "to_sync_meta_v1";

type Wrapped = { t: number; v: any };
type Meta = Record<string, { lt: number }>;
export type SyncResult =
  | "nothing to sync"
  | "pushed to your account"
  | "loaded from your account"
  | "already in sync"
  | "push failed (will retry)"
  | "kept newer data from your account";

let enabled = false;
let signedOut = false;
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const resetting = new Set<string>();
const pending = new Map<string, Set<Promise<SyncResult>>>();
export const lastResult: Record<string, SyncResult> = {};

function readMeta(): Meta {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function setLt(sk: string, lt: number) {
  if (isDevPreview()) return;
  try {
    const m = readMeta();
    m[sk] = { lt };
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {}
}
let practicalOwner: string | null = null;
/** Compatibility token for decision saves; the shared boundary owns every cache. */
export function bindPracticalAccount(owner: string | null) {
  if (owner && (!accountCacheReady() || isDevPreview())) return;
  if (owner) localStorage.setItem("to_a1_practical_owner_v1", owner);
  practicalOwner = owner;
}
function storeForLocalKey(lk: string): Store | undefined {
  return STORES.find((s) => s.lks.includes(lk));
}
function isWrapped(x: unknown): x is Wrapped {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as any).t === "number" &&
    Number.isFinite((x as any).t) &&
    "v" in (x as object)
  );
}
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object")
    return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}
// Any non-empty string, non-zero number, true, or non-empty container anywhere.
export function hasRealContent(x: any): boolean {
  if (x === null || x === undefined) return false;
  if (typeof x === "string") return x.trim().length > 0;
  if (typeof x === "number") return x !== 0;
  if (typeof x === "boolean") return x;
  if (Array.isArray(x)) return x.some(hasRealContent);
  if (typeof x === "object") return Object.values(x).some(hasRealContent);
  return false;
}

function readLocal(s: Store): any | undefined {
  if (!accountCacheReady()) return undefined;
  try {
    if (s.sk === "a1progress") {
      const o: Record<string, any> = {};
      let any = false;
      for (const lk of s.lks) {
        const raw = localStorage.getItem(lk);
        if (raw === null) continue;
        any = true;
        try {
          o[lk] = JSON.parse(raw);
        } catch {
          o[lk] = raw;
        }
      }
      return any ? o : undefined;
    }
    const raw = localStorage.getItem(s.lks[0]);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw);
    return s.sk === "decisions" ? normalizeDecisions(parsed) : s.sk === "a1practical" ? normalizePractical(parsed) : s.sk === "rcstate" ? normalizeRC(parsed) : parsed;
  } catch {
    return undefined;
  }
}
function isMeaningful(s: Store, v: any): boolean {
  if (v === undefined) return false;
  if (s.empty !== undefined) return !deepEqual(v, s.empty);
  return hasRealContent(v);
}
function writeLocal(s: Store, v: any) {
  if (isDevPreview()) return;
  try {
    if (s.sk === "decisions") {
      localStorage.setItem(s.lks[0], JSON.stringify(mergeDecisions(readLocal(s), v)));
      window.dispatchEvent(new Event("decisions-change"));
      return;
    }
    if (s.sk === "a1progress") {
      for (const lk of s.lks) if (v && lk in v) localStorage.setItem(lk, JSON.stringify(v[lk]));
      return;
    }
    localStorage.setItem(s.lks[0], JSON.stringify(s.sk === "a1practical" ? normalizePractical(v) : s.sk === "rcstate" ? normalizeRC(v) : v));
    if (s.sk === "a1practical") window.dispatchEvent(new Event("a1-practical-change"));
  } catch {}
}

async function put(sk: string, w: Wrapped): Promise<Response | null> {
  if (isDevPreview()) return null;
  try {
    return await fetch(`/api/userdata/${sk}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: w }),
    });
  } catch {
    return null;
  }
}

function pushNow(s: Store): Promise<SyncResult> {
  if (resetting.has(s.sk)) return Promise.resolve("nothing to sync");
  const job = pushNowImpl(s);
  const jobs = pending.get(s.sk) ?? new Set<Promise<SyncResult>>();
  jobs.add(job); pending.set(s.sk, jobs);
  void job.finally(() => { jobs.delete(job); });
  return job;
}
async function pushNowImpl(s: Store): Promise<SyncResult> {
  if (isDevPreview() || !accountCacheReady() || signedOut) return "nothing to sync";
  const stamp = accountGeneration();
  const owner = practicalOwner;
  const v = readLocal(s);
  if (!isMeaningful(s, v)) return "nothing to sync";
  let lt = readMeta()[s.sk]?.lt;
  if (lt === undefined) {
    lt = Date.now();
    setLt(s.sk, lt);
  }
  const res = await put(s.sk, { t: lt, v });
  if (stamp !== accountGeneration() || !accountCacheReady() || owner !== practicalOwner) return "nothing to sync";
  if (!res) return "push failed (will retry)";
  if (res.status === 409) {
    try {
      const j = await res.json();
      if (isWrapped(j?.current)) {
        writeLocal(s, j.current.v);
        setLt(s.sk, j.current.t);
        return "kept newer data from your account";
      }
    } catch {}
    return "push failed (will retry)";
  }
  if (res.ok && s.sk === "decisions") {
    const ack = await res.json();
    if (!isDevPreview() && owner === practicalOwner && isWrapped(ack.current)) {
      writeLocal(s, ack.current.v);
      setLt(s.sk, ack.current.t);
    }
  }
  return res.ok ? "pushed to your account" : "push failed (will retry)";
}

function schedulePush(s: Store) {
  clearTimeout(timers[s.sk]);
  if (isDevPreview()) return;
  timers[s.sk] = setTimeout(async () => {
    lastResult[s.sk] = await pushNow(s);
  }, 1500);
}

export function markLocalChange(lk: string) {
  if (isDevPreview() || signedOut || !accountCacheReady()) return;
  const s = storeForLocalKey(lk);
  if (!s) return;
  if (resetting.has(s.sk)) return;
  // A pristine seed (EMPTY_*) is not a member change — don't stamp or push it.
  if (!isMeaningful(s, readLocal(s))) return;
  setLt(s.sk, Date.now());
  if (enabled) schedulePush(s);
}
setChangeHandler(markLocalChange);

/** Finish existing saves before the session is removed. A failed save blocks logout. */
export async function flushNewFlowForSignOut(): Promise<void> {
  enabled = false;
  for (const timer of Object.values(timers)) clearTimeout(timer);
  if (isDevPreview()) return;
  await Promise.all([...pending.values()].flatMap(jobs => [...jobs]));
  const results = await Promise.all(STORES.map(pushNow));
  if (results.includes("push failed (will retry)")) {
    resumeNewFlowAfterSignOutFailure();
    throw new Error("Your latest answers could not be saved. Please try signing out again when you’re connected.");
  }
}

export function resumeNewFlowAfterSignOutFailure(): void {
  enabled = true;
}

/** In-memory cleanup only; the caller clears account-local storage after logout. */
export function finishNewFlowSignOut(): void {
  signedOut = true;
  enabled = false;
  practicalOwner = null;
  for (const timer of Object.values(timers)) clearTimeout(timer);
  for (const key of Object.keys(timers)) delete timers[key];
  for (const key of Object.keys(lastResult)) delete lastResult[key];
  pending.clear();
}
onAccountBoundary(finishNewFlowSignOut);

export async function resetRealityCheckForDev(): Promise<void> {
  if (!import.meta.env.DEV || isDevPreview()) throw new Error("Reset is unavailable in this mode.");
  const targets = STORES.filter(s => s.sk === "rcstate" || s.sk === "setaside");
  if (targets.some(s => resetting.has(s.sk))) throw new Error("A reset is already in progress.");
  targets.forEach(s => { resetting.add(s.sk); clearTimeout(timers[s.sk]); });
  const done: string[] = [];
  try {
    await Promise.all(targets.flatMap(s => [...(pending.get(s.sk) ?? [])]));
    const response = await fetch("/api/userdata", { credentials: "include" });
    if (!response.ok) throw new Error("Could not read your account before resetting.");
    const remote = await response.json();
    for (const s of targets) {
      const t = Math.max(Date.now(), (readMeta()[s.sk]?.lt ?? 0) + 1, (isWrapped(remote[s.sk]) ? remote[s.sk].t : 0) + 1);
      const result = await put(s.sk, { t, v: s.empty });
      if (!result?.ok) throw new Error(`Could not clear ${s.label}.`);
      localStorage.setItem(s.lks[0], JSON.stringify(s.empty));
      const ack = await result.json();
      setLt(s.sk, typeof ack.t === "number" ? ack.t : t);
      done.push(s.label);
    }
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : "Reset failed."}${done.length ? ` Already cleared: ${done.join(", ")}. The reset is only partially complete.` : " Nothing was confirmed cleared."}`);
  } finally { targets.forEach(s => resetting.delete(s.sk)); }
}

// Run once, after the member's server data has loaded and BEFORE the app renders,
// so the stores are reconciled before any screen reads them.
export async function hydrateNewFlow(cache: Record<string, any>, ownerId?: string): Promise<void> {
  if (isDevPreview()) return;
  if (!accountCacheReady()) throw new Error("Account cache is not ready.");
  const stamp = accountGeneration();
  signedOut = false;
  if (ownerId) bindPracticalAccount(ownerId);
  const owner = practicalOwner;
  enabled = true;
  for (const s of STORES) {
    if (stamp !== accountGeneration() || owner !== practicalOwner || !accountCacheReady()) return;
    try {
      const wrapped = isWrapped(cache[s.sk]) ? (cache[s.sk] as Wrapped) : null;
      const S = wrapped && s.sk === "a1practical" ? { ...wrapped, v: normalizePractical(wrapped.v) }
        : wrapped && s.sk === "rcstate" ? { ...wrapped, v: normalizeRC(wrapped.v) } : wrapped;
      const L = readLocal(s);
      const localReal = isMeaningful(s, L);
      const lt = readMeta()[s.sk]?.lt;
      if (s.sk === "decisions" && S) {
        writeLocal(s, S.v);
        if (!deepEqual(readLocal(s), S.v)) await pushNow(s);
        else setLt(s.sk, S.t);
        continue;
      }
      if (!S && !localReal) lastResult[s.sk] = "nothing to sync";
      else if (!S && localReal) lastResult[s.sk] = await pushNow(s);
      else if (S && !localReal) {
        writeLocal(s, S.v);
        setLt(s.sk, S.t);
        lastResult[s.sk] = "loaded from your account";
      } else if (S && localReal) {
        if (deepEqual(L, S.v)) {
          setLt(s.sk, Math.max(lt ?? 0, S.t));
          lastResult[s.sk] = "already in sync";
        } else if (lt !== undefined && lt > S.t) lastResult[s.sk] = await pushNow(s);
        else {
          // server is newer (or this browser never stamped its copy): server wins.
          writeLocal(s, S.v);
          setLt(s.sk, S.t);
          lastResult[s.sk] = "loaded from your account";
        }
      }
    } catch (error) {
      lastResult[s.sk] = "push failed (will retry)";
      if (s.sk === "a1practical") throw error;
    }
  }
}

// Legacy keys (map, intake, voice, done): push this browser's copy up when the
// server has none. The server's copy always wins when both exist, as before.
const LEGACY_AUTOPUSH: Array<[string, string]> = [
  ["map", "to_map"],
  ["intake", "to_intake"],
  ["voice", "to_voice"],
  ["done", "to_done"],
];
export async function autoPushLegacy(cache: Record<string, any>): Promise<string[]> {
  if (isDevPreview() || !accountCacheReady()) return [];
  const stamp = accountGeneration();
  const pushed: string[] = [];
  for (const [sk, lk] of LEGACY_AUTOPUSH) {
    if (stamp !== accountGeneration() || !accountCacheReady()) return pushed;
    try {
      const raw = localStorage.getItem(lk);
      if (raw === null) continue;
      if (sk in cache && cache[sk] != null) continue;
      let v: any = raw;
      try {
        v = JSON.parse(raw);
      } catch {}
      if (!hasRealContent(v)) continue;
      if (isDevPreview()) return pushed;
      const res = await fetch(`/api/userdata/${sk}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: v }),
      });
      if (res.ok) {
        cache[sk] = v;
        pushed.push(sk);
      }
    } catch {}
  }
  return pushed;
}

// ── Export / import (moving answers between addresses, e.g. dev preview → published site) ──
// The export carries each store's own "last changed" time, so after an import the
// newer-wins rule still compares real times: an imported copy can never beat a
// genuinely newer copy already in the account.
export const LEGACY_KEYS: Array<{ sk: string; lk: string; label: string }> = [
  { sk: "map", lk: "to_map", label: "A1 answers & map (Purpose, Vision, Identity)" },
  { sk: "intake", lk: "to_intake", label: "Intake (your name and first answers)" },
  { sk: "voice", lk: "to_voice", label: "Voice" },
  { sk: "done", lk: "to_done", label: "Old-flow progress list" },
];
const EXPORT_KEYS = [...STORES.flatMap((s) => s.lks), ...LEGACY_KEYS.map((k) => k.lk)];
export type AnswersExport = {
  kind: "true-ownership-answers";
  version: number;
  exportedAt: string;
  origin: string;
  keys: Record<string, string>;
  meta?: Meta;
};
export function exportLocalAnswers(): string {
  const keys: Record<string, string> = {};
  for (const k of EXPORT_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw !== null) keys[k] = k === RC_STORAGE_KEY ? JSON.stringify(normalizeRC(JSON.parse(raw))) : raw;
  }
  const out: AnswersExport = {
    kind: "true-ownership-answers",
    version: 2,
    exportedAt: new Date().toISOString(),
    origin: location.origin,
    keys,
    meta: readMeta(),
  };
  return JSON.stringify(out, null, 2);
}
export function parseAnswersExport(json: string): AnswersExport | null {
  try {
    const o = JSON.parse(json);
    if (o?.kind !== "true-ownership-answers" || typeof o.keys !== "object" || o.keys === null) return null;
    return o as AnswersExport;
  } catch {
    return null;
  }
}
export function importLocalAnswers(json: string): { ok: boolean; message: string; count: number; parsed?: AnswersExport } {
  if (isDevPreview()) return { ok: false, message: "Read-only mode.", count: 0 };
  const o = parseAnswersExport(json);
  if (!o) return { ok: false, message: "That file isn't a True Ownership answers export.", count: 0 };
  try {
    let n = 0;
    for (const k of EXPORT_KEYS) {
      if (typeof o.keys[k] !== "string") continue;
      // Never replace a copy this browser already has with an imported one.
      const existing = localStorage.getItem(k);
      if (existing !== null && !(k === RC_STORAGE_KEY && JSON.parse(existing)?.version !== 2)) continue;
      localStorage.setItem(k, k === RC_STORAGE_KEY ? JSON.stringify(normalizeRC(JSON.parse(o.keys[k]))) : o.keys[k]);
      n++;
    }
    const fallback = Date.parse(o.exportedAt) || Date.now();
    for (const s of STORES)
      if (s.lks.some((lk) => lk in o.keys) && readMeta()[s.sk] === undefined)
        setLt(s.sk, o.meta?.[s.sk]?.lt ?? fallback);
    return { ok: true, message: `Imported ${n} item(s) into this browser.`, count: n, parsed: o };
  } catch {
    return { ok: false, message: "Couldn't read that file.", count: 0 };
  }
}
// How much real content a saved value holds (count of non-empty leaves) — shown so
// the member can see which copy is the richer one before choosing.
export function contentScore(x: any): number {
  if (x === null || x === undefined) return 0;
  if (typeof x === "string") return x.trim() ? 1 : 0;
  if (typeof x === "number") return x !== 0 ? 1 : 0;
  if (typeof x === "boolean") return x ? 1 : 0;
  if (Array.isArray(x)) return x.reduce((a, v) => a + contentScore(v), 0);
  if (typeof x === "object") return (Object.values(x) as any[]).reduce((a: number, v: any) => a + contentScore(v), 0);
  return 0;
}
export type LegacyRow = { sk: string; lk: string; label: string; fileScore: number; accountScore: number | null; fileValue: any };
// Compare each legacy item in an imported file with what the account holds.
export async function legacyComparison(o: AnswersExport): Promise<LegacyRow[]> {
  let cache: Record<string, any> = {};
  try {
    const r = await fetch("/api/userdata", { credentials: "include" });
    if (r.ok) cache = await r.json();
  } catch {}
  const rows: LegacyRow[] = [];
  for (const k of LEGACY_KEYS) {
    const raw = o.keys[k.lk];
    if (typeof raw !== "string") continue;
    let v: any = raw;
    try {
      v = JSON.parse(raw);
    } catch {}
    rows.push({
      ...k,
      fileScore: contentScore(v),
      accountScore: k.sk in cache && cache[k.sk] != null ? contentScore(cache[k.sk]) : null,
      fileValue: v,
    });
  }
  return rows;
}
// Deliberate, member-confirmed replace of the account's copy of a legacy item (these
// carry no timestamps, so "account wins" would otherwise keep an older copy forever).
// Returns the account's PREVIOUS copy as JSON so it can be saved as a backup first.
export async function replaceAccountCopy(
  row: Pick<LegacyRow, "sk" | "lk" | "fileValue">,
): Promise<{ ok: boolean; backup: string; message: string }> {
  if (isDevPreview()) return { ok: false, backup: "", message: "Read-only mode." };
  let previous: any = null;
  try {
    const r = await fetch("/api/userdata", { credentials: "include" });
    if (r.ok) previous = (await r.json())[row.sk] ?? null;
  } catch {}
  const backup = JSON.stringify({ kind: "true-ownership-account-backup", key: row.sk, savedAt: new Date().toISOString(), value: previous }, null, 2);
  try {
    if (isDevPreview()) return { ok: false, backup, message: "Read-only mode." };
    const res = await fetch(`/api/userdata/${row.sk}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: row.fileValue }),
    });
    if (!res.ok) return { ok: false, backup, message: `The account didn't accept it (HTTP ${res.status}).` };
    if (!isDevPreview()) localStorage.setItem(row.lk, JSON.stringify(row.fileValue));
    return { ok: true, backup, message: "Done — the account copy is now the imported one. Reload this page." };
  } catch {
    return { ok: false, backup, message: "Couldn't reach the account. Nothing was changed." };
  }
}

export type StatusRow = { label: string; sk: string; local: boolean; server: boolean; result: string };
export async function syncStatus(): Promise<StatusRow[]> {
  let cache: Record<string, any> = {};
  try {
    const r = await fetch("/api/userdata", { credentials: "include" });
    if (r.ok) cache = await r.json();
  } catch {}
  return STORES.map((s) => ({
    label: s.label,
    sk: s.sk,
    local: isMeaningful(s, readLocal(s)),
    server: isWrapped(cache[s.sk]),
    result: lastResult[s.sk] ?? "—",
  }));
}
