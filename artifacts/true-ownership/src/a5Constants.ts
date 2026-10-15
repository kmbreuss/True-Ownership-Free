// ─────────────────────────────────────────────────────────────────────────────
// A5 · Accountable To It · State module (Ship A5-1 · Hub + Keeping My Word)
// ─────────────────────────────────────────────────────────────────────────────
// Same pattern as a2/a3/a4Constants.ts: one localStorage key, EMPTY_*, normalize
// / load / save / has, registered with the account-sync engine as "a5state".
//
// A4 was the inside work; A5 is the outside work: the plan, the people and
// places that hold you, and the rhythm that makes it stick. The horizon ladder
// is 10 years (A1) → 1 year + promise (A4) → 90 days + this week (A5).
//
// `claimed` is the SOLE driver of completion. `checkins` and `reset90` are
// reserved for Ship A5-2 (weekly check-in, 90-day look-back) — keep the names.
//
// Pure (no React, no App imports) so the logic can be unit-tested on its own.
// ─────────────────────────────────────────────────────────────────────────────

import { notifyLocalChange } from "./syncHook";

export const A5_STORAGE_KEY = "to_a5_state_v1";

export type A5Key = "self" | "time" | "wealth";
export const A5_KEYS: readonly A5Key[] = ["self", "time", "wealth"];
export const A5_LABEL: Record<A5Key, string> = {
  self: "Self",
  time: "Time",
  wealth: "Wealth",
};

export const A5_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type A5Day = (typeof A5_DAYS)[number];
const A5_DAY_LONG: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
export const a5DayLong = (d: string): string => A5_DAY_LONG[d] ?? d;

export type A5Plan = {
  ninety: string; // "In 90 days I'll have…"
  ninetyBy: string; // ISO date (YYYY-MM-DD) — today + 90, fixed at claim
  week: string; // "This week I will…"
  days: string[]; // subset of A5_DAYS
  time: string; // "HH:MM" 24h, or "" (optional)
};
export type A5Support = { name: string; from: "board" | "close" | "own" };
export type A5System = { name: string; own: boolean };
export type A5Supports = { person: A5Support; place: A5Support; system: A5System };
export type A5Rhythm = {
  checkinDay: string;
  checkinTime: string; // "HH:MM"
  personDay: string;
  reminderDay: string;
  reminderTime: string; // "HH:MM"
  channel: "app";
  // When the member last dismissed the in-app reminder card (ISO). The card
  // returns on the next reminder day.
  reminderDismissedAt: string | null;
};

export type A5State = {
  step: number; // 0–4 — the screen the member is on
  plans: Record<A5Key, A5Plan>;
  supports: Record<A5Key, A5Supports>;
  rhythm: A5Rhythm;
  claimed: boolean;
  claimedAt: string | null;
  checkins: unknown[]; // A5-2
  reset90: unknown | null; // A5-2
};

export const EMPTY_A5_PLAN: A5Plan = {
  ninety: "",
  ninetyBy: "",
  week: "",
  days: [],
  time: "",
};
export const EMPTY_A5_SUPPORTS: A5Supports = {
  person: { name: "", from: "own" },
  place: { name: "", from: "own" },
  system: { name: "", own: false },
};
export const DEFAULT_A5_RHYTHM: A5Rhythm = {
  checkinDay: "Sun",
  checkinTime: "19:00",
  personDay: "Fri",
  reminderDay: "Mon",
  reminderTime: "06:45",
  channel: "app",
  reminderDismissedAt: null,
};

const clonePlan = (): A5Plan => ({ ...EMPTY_A5_PLAN, days: [] });
const cloneSupports = (): A5Supports => ({
  person: { ...EMPTY_A5_SUPPORTS.person },
  place: { ...EMPTY_A5_SUPPORTS.place },
  system: { ...EMPTY_A5_SUPPORTS.system },
});

export const EMPTY_A5: A5State = {
  step: 0,
  plans: { self: clonePlan(), time: clonePlan(), wealth: clonePlan() },
  supports: { self: cloneSupports(), time: cloneSupports(), wealth: cloneSupports() },
  rhythm: { ...DEFAULT_A5_RHYTHM },
  claimed: false,
  claimedAt: null,
  checkins: [],
  reset90: null,
};

// ─── normalize (a corrupt store can't poison the room) ───
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const isoOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayOr = (v: unknown, d: string): string =>
  typeof v === "string" && (A5_DAYS as readonly string[]).includes(v) ? v : d;
const timeOr = (v: unknown, d: string): string =>
  typeof v === "string" && HHMM.test(v) ? v : d;

function normalizePlan(raw: unknown): A5Plan {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const days = Array.isArray(r.days)
    ? A5_DAYS.filter((d) => (r.days as unknown[]).includes(d)).map(String)
    : [];
  return {
    ninety: str(r.ninety),
    ninetyBy: /^\d{4}-\d{2}-\d{2}$/.test(str(r.ninetyBy)) ? str(r.ninetyBy) : "",
    week: str(r.week),
    days,
    time: timeOr(r.time, ""),
  };
}
function normalizeSupport(raw: unknown): A5Support {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const from = r.from === "board" || r.from === "close" ? r.from : "own";
  const name = str(r.name).trim();
  return { name, from: name === "" ? "own" : from };
}
function normalizeSupports(raw: unknown): A5Supports {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sys = (r.system && typeof r.system === "object" ? r.system : {}) as Record<string, unknown>;
  const name = str(sys.name).trim();
  return {
    person: normalizeSupport(r.person),
    place: normalizeSupport(r.place),
    system: { name, own: name !== "" && sys.own === true },
  };
}

export function normalizeA5(raw: unknown): A5State {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const plans = (r.plans && typeof r.plans === "object" ? r.plans : {}) as Record<string, unknown>;
  const sups = (r.supports && typeof r.supports === "object" ? r.supports : {}) as Record<string, unknown>;
  const rh = (r.rhythm && typeof r.rhythm === "object" ? r.rhythm : {}) as Record<string, unknown>;
  const stepN = typeof r.step === "number" && Number.isFinite(r.step) ? r.step : 0;
  return {
    step: Math.max(0, Math.min(4, Math.round(stepN))),
    plans: {
      self: normalizePlan(plans.self),
      time: normalizePlan(plans.time),
      wealth: normalizePlan(plans.wealth),
    },
    supports: {
      self: normalizeSupports(sups.self),
      time: normalizeSupports(sups.time),
      wealth: normalizeSupports(sups.wealth),
    },
    rhythm: {
      checkinDay: dayOr(rh.checkinDay, DEFAULT_A5_RHYTHM.checkinDay),
      checkinTime: timeOr(rh.checkinTime, DEFAULT_A5_RHYTHM.checkinTime),
      personDay: dayOr(rh.personDay, DEFAULT_A5_RHYTHM.personDay),
      reminderDay: dayOr(rh.reminderDay, DEFAULT_A5_RHYTHM.reminderDay),
      reminderTime: timeOr(rh.reminderTime, DEFAULT_A5_RHYTHM.reminderTime),
      channel: "app",
      reminderDismissedAt: isoOrNull(rh.reminderDismissedAt),
    },
    claimed: r.claimed === true,
    claimedAt: isoOrNull(r.claimedAt),
    checkins: Array.isArray(r.checkins) ? r.checkins : [],
    reset90: r.reset90 && typeof r.reset90 === "object" ? r.reset90 : null,
  };
}

export function loadA5State(): A5State {
  try {
    if (typeof window === "undefined") return EMPTY_A5;
    const raw = window.localStorage.getItem(A5_STORAGE_KEY);
    if (!raw) return EMPTY_A5;
    return normalizeA5(JSON.parse(raw));
  } catch {}
  return EMPTY_A5;
}
export function saveA5State(state: A5State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(A5_STORAGE_KEY, JSON.stringify(state));
    notifyLocalChange(A5_STORAGE_KEY);
  } catch {}
}
export function hasA5State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(A5_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ─── dates + times ───
const pad = (n: number) => String(n).padStart(2, "0");
export const a5IsoDate = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Today + 90 days, as an ISO date (local time).
export function a5NinetyBy(now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90);
  return a5IsoDate(d);
}
// "2026-01-12" → "Jan 12"
export function a5FormatBy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
// "19:00" → "7:00 pm"
export function a5FormatTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "am" : "pm"}`;
}

// ─── prefills from A4's `when` ───
const DAY_PATTERNS: [string, RegExp][] = [
  ["Mon", /\bmon(day)?s?\b/i],
  ["Tue", /\btue(s|sday)?s?\b/i],
  ["Wed", /\bwed(nesday)?s?\b/i],
  ["Thu", /\bthu(r|rs|rsday)?s?\b/i],
  ["Fri", /\bfri(day)?s?\b/i],
  ["Sat", /\bsat(urday)?s?\b/i],
  ["Sun", /\bsun(day)?s?\b/i],
];
// Days a sentence names ("Sunday night", "weekdays", "every day"). [] when none.
export function a5DaysFromText(text: string): string[] {
  const t = text || "";
  if (/\b(every\s?day|daily|each\s?day|seven days)\b/i.test(t)) return [...A5_DAYS];
  const set = new Set<string>();
  if (/\bweekdays?\b/i.test(t)) ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((d) => set.add(d));
  if (/\bweekends?\b/i.test(t)) ["Sat", "Sun"].forEach((d) => set.add(d));
  for (const [d, re] of DAY_PATTERNS) if (re.test(t)) set.add(d);
  return A5_DAYS.filter((d) => set.has(d)).map(String);
}
// "7pm", "6:30 am" → "19:00" / "06:30". "" when the text names no clock time.
export function a5TimeFromText(text: string): string {
  const m = /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i.exec(text || "");
  if (!m) return "";
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === "pm") h += 12;
  return `${pad(h)}:${m[2] ?? "00"}`;
}

// ─── supports: options from A3 ───
export type A5Option = { name: string; from: "board" | "close" };
// Their A3 Board first, then the people they rated "Close to you". Deduped.
export function a5PersonOptions(a3: {
  m5?: { seats?: { name?: string }[] };
  m1?: { names?: string[]; ratings?: Record<string, string> };
}): A5Option[] {
  const out: A5Option[] = [];
  const add = (n: string | undefined, from: "board" | "close") => {
    const t = (n || "").trim();
    if (t !== "" && !out.some((o) => o.name.toLowerCase() === t.toLowerCase())) out.push({ name: t, from });
  };
  for (const s of a3?.m5?.seats ?? []) add(s?.name, "board");
  const ratings = a3?.m1?.ratings ?? {};
  for (const n of a3?.m1?.names ?? []) if (ratings[n] === "advocate") add(n, "close");
  return out;
}
// The places they said lift them (A3 Environment, kind place, rated Advocate).
export function a5PlaceOptions(a3: {
  m2?: { items?: { name?: string; kind?: string; rating?: string | null }[] };
}): A5Option[] {
  const out: A5Option[] = [];
  for (const it of a3?.m2?.items ?? []) {
    const t = (it?.name || "").trim();
    if (it?.kind === "place" && it?.rating === "advocate" && t !== "" && !out.some((o) => o.name.toLowerCase() === t.toLowerCase())) {
      out.push({ name: t, from: "close" });
    }
  }
  return out;
}
export const A5_SYSTEMS = [
  "Calendar block",
  "Phone reminder",
  "Automatic transfer",
  "App weekly check-in",
] as const;
export const A5_SYSTEM_DEFAULT: Record<A5Key, string> = {
  self: "Phone reminder",
  time: "Calendar block",
  wealth: "Automatic transfer",
};
// The four built-in systems with this promise's default first.
export function a5SystemOptions(key: A5Key): string[] {
  const d = A5_SYSTEM_DEFAULT[key];
  return [d, ...A5_SYSTEMS.filter((s) => s !== d)];
}

// ─── done / ready ───
export const a5PlanDone = (p: A5Plan): boolean =>
  p.ninety.trim() !== "" && p.week.trim() !== "" && p.days.length > 0;
export const a5SupportsDone = (s: A5Supports): boolean =>
  s.person.name.trim() !== "" && s.place.name.trim() !== "" && s.system.name.trim() !== "";
export function a5ScreenReady(s: A5State, screen: number): boolean {
  switch (screen) {
    case 1:
      return A5_KEYS.every((k) => a5PlanDone(s.plans[k]));
    case 2:
      return A5_KEYS.every((k) => a5SupportsDone(s.supports[k]));
    case 3:
      return A5_KEYS.every((k) => a5PlanDone(s.plans[k]) && a5SupportsDone(s.supports[k]));
    default:
      return true;
  }
}

// ─── "Your people hear from you" ───
// The note the member can edit and send themselves. The app never sends anything.
export function a5ShareNote(person: string, week: string, personDay: string): string {
  const action = week.trim().replace(/^i will\s+/i, "").replace(/[.\s]+$/, "");
  // "Hi Maya — …"; a described person ("my sister") gets a plain "Hi — …".
  const who = person.trim();
  const hi = who === "" || /^(my|our|the|a|an)\s/i.test(who) ? "Hi —" : `Hi ${who} —`;
  return `${hi} I made a promise to myself: I will ${action}. Can you ask me on ${a5DayLong(personDay)} if I kept it?`;
}

// ─── in-app reminder ───
// The most recent moment (≤ now) that falls on `day` at `time`, within 7 days.
export function a5LastOccurrence(day: string, time: string, now: Date): Date | null {
  const idx = (A5_DAYS as readonly string[]).indexOf(day);
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (idx < 0 || !m) return null;
  for (let back = 0; back <= 7; back++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back, Number(m[1]), Number(m[2]));
    // JS getDay(): Sun=0 → A5_DAYS index: Mon=0 … Sun=6
    const dayIdx = (d.getDay() + 6) % 7;
    if (dayIdx === idx && d.getTime() <= now.getTime()) return d;
  }
  return null;
}
// The reminder card is due once the reminder day/time has passed, until the
// member dismisses it; it returns on the next reminder day. It rotates through
// the three promises week by week.
export function a5ReminderDue(
  s: A5State,
  now: Date,
): { occurrence: Date; key: A5Key } | null {
  if (!s.claimed) return null;
  const occ = a5LastOccurrence(s.rhythm.reminderDay, s.rhythm.reminderTime, now);
  if (!occ) return null;
  const dismissed = s.rhythm.reminderDismissedAt ? new Date(s.rhythm.reminderDismissedAt) : null;
  if (dismissed && !Number.isNaN(dismissed.getTime()) && dismissed.getTime() >= occ.getTime()) return null;
  const week = Math.floor(occ.getTime() / (7 * 24 * 3600 * 1000));
  return { occurrence: occ, key: A5_KEYS[week % 3] };
}
