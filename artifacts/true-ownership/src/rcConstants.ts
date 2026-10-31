import { notifyLocalChange } from "./syncHook";
import { previewRead, previewWrite } from "./devPreview";

export const RC_STORAGE_KEY = "to_rc_state_v1";
export const RC_INTRO_VIDEO_URL = "";
export type RCArea = "self" | "time" | "wealth";
export type RCDefault = "avoiding" | "blaming" | "carrying" | "hoping";
export const RC_AREAS: RCArea[] = ["self", "time", "wealth"];
export const RC_LABEL: Record<RCArea, string> = { self: "Self", time: "Time", wealth: "Wealth" };
export const RC_DEFINITION: Record<RCArea, string> = {
  self: "The relationship you have with you.",
  time: "Who and what gets your life.",
  wealth: "Whether money works for you, or you work for it.",
};
export interface RCState {
  version: number; step: number; startedAt: string | null; completedAt: string | null;
  scores: Record<RCArea, number | null>;
  focusChosenBy: "suggested" | "picked" | null; focus: RCArea | null; looked: RCArea[];
  reality: Record<RCArea, { text: string; howLong: "weeks" | "months" | "year" | "years" | null; symptoms: number[] }>;
  defaults: Record<RCArea, RCDefault[]>;
  defaultsNamed: Record<RCArea, Record<RCDefault, string>>;
  defaultsNone: Record<RCArea, boolean>;
  cost: {
    wealth: { chips: string[]; own: string; monthly: number | null };
    time: { chips: string[]; own: string; hoursPerWeek: number | null };
    self: { chips: string[]; own: string; whoElse: string };
  };
  futureA: Record<RCArea, string>; futureB: Record<RCArea, string>;
  firstDifferent: string; chosen: "yes" | "not-yet" | null; complete: boolean; rounds: unknown[];
}
const perArea = <T,>(make: () => T): Record<RCArea, T> => ({ self: make(), time: make(), wealth: make() });
export const EMPTY_RC: RCState = {
  version: 1, step: 1, startedAt: null, completedAt: null,
  scores: perArea(() => null), focusChosenBy: null, focus: null, looked: [],
  reality: perArea(() => ({ text: "", howLong: null, symptoms: [] })),
  defaults: perArea(() => []),
  defaultsNamed: perArea(() => ({ avoiding: "", blaming: "", carrying: "", hoping: "" })),
  defaultsNone: perArea(() => false),
  cost: {
    wealth: { chips: [], own: "", monthly: null },
    time: { chips: [], own: "", hoursPerWeek: null },
    self: { chips: [], own: "", whoElse: "" },
  },
  futureA: perArea(() => ""), futureB: perArea(() => ""),
  firstDifferent: "", chosen: null, complete: false, rounds: [],
};

// Additive hydration: older/imported RC answers retain their values and reserved fields.
export function normalizeRC(value: Partial<RCState> | null): RCState {
  const seed = JSON.parse(JSON.stringify(EMPTY_RC)) as RCState;
  if (!value || typeof value !== "object") return seed;
  const state = { ...seed, ...value };
  state.step = Number.isInteger(value.step) ? Math.max(1, Math.min(6, value.step!)) : 1;
  state.focus = RC_AREAS.includes(value.focus as RCArea) ? value.focus! : null;
  state.scores = { ...seed.scores, ...value.scores };
  state.reality = { ...seed.reality };
  state.defaults = { ...seed.defaults };
  state.defaultsNamed = { ...seed.defaultsNamed };
  state.defaultsNone = { ...seed.defaultsNone, ...value.defaultsNone };
  for (const area of RC_AREAS) {
    const n = state.scores[area];
    state.scores[area] = Number.isInteger(n) && n! >= 1 && n! <= 10 ? n : null;
    state.reality[area] = { ...seed.reality[area], ...value.reality?.[area] };
    state.defaults[area] = Array.isArray(value.defaults?.[area]) ? value.defaults![area] : [];
    state.defaultsNamed[area] = { ...seed.defaultsNamed[area], ...value.defaultsNamed?.[area] };
  }
  state.cost = {
    wealth: { ...seed.cost.wealth, ...value.cost?.wealth },
    time: { ...seed.cost.time, ...value.cost?.time },
    self: { ...seed.cost.self, ...value.cost?.self },
  };
  state.futureA = { ...seed.futureA, ...value.futureA };
  state.futureB = { ...seed.futureB, ...value.futureB };
  return state;
}
export function loadRCState(): RCState {
  try { return normalizeRC(JSON.parse(previewRead(RC_STORAGE_KEY) ?? localStorage.getItem(RC_STORAGE_KEY) ?? "null")); }
  catch { return normalizeRC(null); }
}
export function saveRCState(state: RCState): void {
  const raw = JSON.stringify(state);
  if (previewWrite(RC_STORAGE_KEY, raw)) return;
  localStorage.setItem(RC_STORAGE_KEY, raw);
  notifyLocalChange(RC_STORAGE_KEY);
}
export function rcEnabled(): boolean {
  return typeof location !== "undefined" && new URLSearchParams(location.search).get("newRC") === "1";
}
export function scoreWords(n: number): string {
  return n <= 2 ? "It owns me" : n <= 4 ? "Mostly, it owns me" : n <= 6
    ? "Some days I own it, some days it owns me" : n <= 8 ? "Mostly, I own it" : "I own it";
}
export function focusOptions(scores: RCState["scores"]): { kind: "incomplete" | "suggested" | "tie" | "high"; areas: RCArea[] } {
  if (RC_AREAS.some(a => scores[a] == null)) return { kind: "incomplete", areas: [] };
  const lowest = Math.min(...RC_AREAS.map(a => scores[a]!));
  if (lowest >= 8) return { kind: "high", areas: [...RC_AREAS] };
  const areas = RC_AREAS.filter(a => scores[a] === lowest);
  return { kind: areas.length === 1 ? "suggested" : "tie", areas };
}
export function withScore(s: RCState, area: RCArea, score: number): RCState {
  const scores = { ...s.scores, [area]: score };
  const choice = focusOptions(scores);
  // Re-evaluate after a score edit; ties and all-high never silently pick a focus.
  return { ...s, scores, focus: choice.kind === "suggested" ? choice.areas[0] : null,
    focusChosenBy: choice.kind === "suggested" ? "suggested" : null };
}
export function rcReady(s: RCState): boolean {
  if (s.step === 2) return focusOptions(s.scores).kind !== "incomplete" && s.focus !== null;
  if (s.step === 3) return !!s.focus && !!s.reality[s.focus].text.trim();
  if (s.step === 4) return !!s.focus && (s.defaults[s.focus].length > 0 || s.defaultsNone[s.focus]);
  return true;
}
export const RC_SYMPTOMS = [
  "You say 'yes' to things when every part of you wants to say 'no.'",
  'You can\'t take action because you\'re waiting for the "perfect" moment.',
  "You blame external factors for why things aren't going the way you want.",
  "You feel busy all the time but not productive.",
  "You're avoiding a hard conversation you know you need to have.",
  "You feel guilty when you prioritize yourself.",
  "Your calendar is controlled by everyone except you.",
  "You take on other people's problems as if they're your own.",
  "You know what you need to do but you keep putting it off.",
  "You feel resentful but won't say anything about it.",
  "You check your phone before you check in with yourself.",
  "You're exhausted but can't explain what you actually accomplished.",
];
export const RC_AREA_SYMPTOMS: Record<RCArea, number[]> = {
  time: [6, 3, 0, 11, 10, 5], self: [5, 9, 8, 0, 11, 10], wealth: [1, 2, 8, 4, 7, 0],
};
export function toggleSymptom(s: RCState, area: RCArea, index: number): RCState {
  const r = s.reality[area], sentence = RC_SYMPTOMS[index], selected = r.symptoms.includes(index);
  // Only remove the exact standalone line we inserted, never substrings in their prose.
  const lines = r.text.split("\n");
  const at = lines.lastIndexOf(sentence);
  if (selected && at >= 0) lines.splice(at, 1);
  return { ...s, reality: { ...s.reality, [area]: { ...r,
    text: selected ? lines.join("\n") : [r.text, sentence].filter(Boolean).join("\n"),
    symptoms: selected ? r.symptoms.filter(i => i !== index) : [...r.symptoms, index],
  } } };
}
export function costSummary(cost: RCState["cost"]): string {
  const totals: string[] = [];
  if (cost.wealth.monthly && cost.wealth.monthly > 0) totals.push(`$${(cost.wealth.monthly * 12).toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
  if (cost.time.hoursPerWeek && cost.time.hoursPerWeek > 0) totals.push(`${(cost.time.hoursPerWeek * 52).toLocaleString("en-US", { maximumFractionDigits: 2 })} hours`);
  const personal = [...cost.self.chips, ...(cost.self.own.trim() ? [cost.self.own.trim()] : [])].slice(0, 2).map(v => v.replace(/^My /, "").toLowerCase());
  const people = cost.self.whoElse.trim();
  const named = [...personal.map(v => `your ${v}`), ...(people ? [people] : [])];
  const selected = [...cost.wealth.chips, cost.wealth.own, ...cost.time.chips, cost.time.own].filter(Boolean);
  return [totals.length ? `Over a year, that's about ${totals.join(" and ")}.` : "",
    named.length ? `${totals.length ? "And " : ""}${named.join(" and ")} ${named.length === 1 ? "is" : "are"} paying too.` : "",
    !totals.length && !named.length && selected.length ? `It is costing you ${selected.join(", ").toLowerCase()}.` : ""].filter(Boolean).join(" ");
}
