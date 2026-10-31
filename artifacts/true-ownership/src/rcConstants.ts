import { notifyLocalChange } from "./syncHook";
import { previewRead, previewWrite } from "./devPreview";

// The key is a sync identity, not the payload version. Only RC-1 is reset.
export const RC_STORAGE_KEY = "to_rc_state_v1";
export const RC_INTRO_VIDEO_URL = "";
export const RC_EYES_AUDIO_URL = "";
export type RCArea = "self" | "time" | "wealth";
export type RCDefault = "avoiding" | "blaming" | "carrying" | "hoping";
export const RC_AREAS: RCArea[] = ["self", "time", "wealth"];
export const RC_DEFAULTS: RCDefault[] = ["avoiding", "blaming", "carrying", "hoping"];
export const RC_LABEL: Record<RCArea, string> = { self: "Self", time: "Time", wealth: "Wealth" };
export const RC_DEFAULT_LABEL: Record<RCDefault, string> = {
  avoiding: "avoiding", blaming: "blaming", carrying: "carrying", hoping: "blindly hoping",
};
export const RC_DEFAULT_DEFINITION: Record<RCDefault, string> = {
  avoiding: "Putting off what needs your attention.",
  blaming: "Putting the cause outside yourself.",
  carrying: "Taking on what isn't yours to carry.",
  hoping: "Waiting for change without changing your part.",
};
export const RC_DEFAULT_PROMPT: Record<RCDefault, string> = {
  avoiding: "What are you avoiding?",
  blaming: "Who or what have you been blaming?",
  carrying: "What are you carrying that isn't yours?",
  hoping: "What are you hoping will change on its own?",
};
export const RC_MIRROR: { id: string; text: string; area: RCArea; default: RCDefault }[] = [
  { id: "time-avoiding", text: "I'll get to the important stuff when things calm down.", area: "time", default: "avoiding" },
  { id: "wealth-avoiding", text: "I don't really look at the numbers.", area: "wealth", default: "avoiding" },
  { id: "self-carrying", text: "I hold everyone together, and no one holds me.", area: "self", default: "carrying" },
  { id: "time-blaming", text: "If people respected my time, I'd have more of it.", area: "time", default: "blaming" },
  { id: "wealth-hoping", text: "One big break will fix it.", area: "wealth", default: "hoping" },
  { id: "self-avoiding", text: "I keep putting off the thing I need to do for me.", area: "self", default: "avoiding" },
  { id: "time-carrying", text: "It's faster if I just do it myself.", area: "time", default: "carrying" },
  { id: "wealth-blaming", text: "The economy is why it's tight.", area: "wealth", default: "blaming" },
  { id: "self-hoping", text: "I'll feel better once things settle down.", area: "self", default: "hoping" },
  { id: "time-hoping", text: "Next month will be quieter.", area: "time", default: "hoping" },
  { id: "wealth-carrying", text: "I pay for everyone else before myself.", area: "wealth", default: "carrying" },
  { id: "self-blaming", text: "I'd be different if the people around me were different.", area: "self", default: "blaming" },
];

export interface RCState {
  version: 2; step: number; maxReached?: number; startedAt: string | null; completedAt: string | null;
  mirror: string[]; phoneMirror?: { set: 0 | 1; viewedBoth: boolean }; areaCounts: Record<RCArea, number>; defaultCounts: Record<RCDefault, number>;
  focus: RCArea | null; focusChosenBy: "revealed" | "tie-picked" | "changed" | null;
  topDefaults: RCDefault[]; tuesday: string; defaultsNamed: Record<RCDefault, string>; defaultsTogether?: string;
  cost: { monthly: number | null; moneyWhere: string; hoursPerWeek: number | null; hoursWhere: string; you: string; whoElse: string };
  futureA: { extra: string }; compound: { feels: string[]; results: string; whoElse: string };
  futureB5: { feels: string[]; tuesday: string; whoNotices: string };
  futureB1: { doing: string; oneThing: string };
  choice: "A" | "B" | null; willing: "yes" | "not-yet" | null; notYetWhy: string;
  complete: boolean; rounds: RCRound[];
}
export type RCRound = Omit<RCState, "rounds">;
export const EMPTY_RC: RCState = {
  version: 2, step: 0, maxReached: 0, startedAt: null, completedAt: null, mirror: [],
  areaCounts: { self: 0, time: 0, wealth: 0 }, defaultCounts: { avoiding: 0, blaming: 0, carrying: 0, hoping: 0 },
  focus: null, focusChosenBy: null, topDefaults: [], tuesday: "",
  defaultsNamed: { avoiding: "", blaming: "", carrying: "", hoping: "" },
  cost: { monthly: null, moneyWhere: "", hoursPerWeek: null, hoursWhere: "", you: "", whoElse: "" },
  futureA: { extra: "" }, compound: { feels: [], results: "", whoElse: "" },
  futureB5: { feels: [], tuesday: "", whoNotices: "" }, futureB1: { doing: "", oneThing: "" },
  choice: null, willing: null, notYetWhy: "", complete: false, rounds: [],
};
export function mirrorCounts(ids: string[]) {
  const areaCounts = { self: 0, time: 0, wealth: 0 };
  const defaultCounts = { avoiding: 0, blaming: 0, carrying: 0, hoping: 0 };
  for (const sentence of RC_MIRROR) if (ids.includes(sentence.id)) {
    areaCounts[sentence.area]++; defaultCounts[sentence.default]++;
  }
  const most = Math.max(...Object.values(defaultCounts));
  return { areaCounts, defaultCounts, topDefaults: RC_DEFAULTS.filter(d => most > 0 && defaultCounts[d] === most) };
}
export function topAreas(s: Pick<RCState, "areaCounts">): RCArea[] {
  const most = Math.max(...Object.values(s.areaCounts));
  return RC_AREAS.filter(a => most > 0 && s.areaCounts[a] === most);
}
export function toggleMirror(s: RCState, id: string): RCState {
  if (!RC_MIRROR.some(m => m.id === id)) return s;
  const mirror = s.mirror.includes(id) ? s.mirror.filter(v => v !== id) : [...s.mirror, id];
  const counts = mirrorCounts(mirror), areas = topAreas(counts);
  return { ...s, mirror, ...counts, focus: areas.length === 1 ? areas[0] : null,
    focusChosenBy: areas.length === 1 ? "revealed" : null };
}
export function chooseFocus(s: RCState, focus: RCArea): RCState {
  const areas = topAreas(s);
  return { ...s, focus, focusChosenBy: areas.length !== 1 ? "tie-picked" : focus === areas[0] ? "revealed" : "changed" };
}
const obj = (v: unknown): Record<string, any> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, any> : {};
const text = (v: unknown) => typeof v === "string" ? v : "";
const texts = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
const amount = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
export function normalizeRC(value: unknown): RCState {
  const seed = JSON.parse(JSON.stringify(EMPTY_RC)) as RCState, v = obj(value);
  if (v.version !== 2) return seed;
  const mirror = [...new Set(texts(v.mirror))].filter(id => RC_MIRROR.some(m => m.id === id));
  const counts = mirrorCounts(mirror), areas = topAreas(counts);
  const focus = RC_AREAS.includes(v.focus) ? v.focus as RCArea : areas.length === 1 ? areas[0] : null;
  const named = obj(v.defaultsNamed), cost = obj(v.cost), a = obj(v.futureA), compound = obj(v.compound),
    b5 = obj(v.futureB5), b1 = obj(v.futureB1);
  const inferred = v.complete ? 13 : v.willing ? 12 : v.choice ? 11 : text(b1.oneThing) || text(b1.doing) ? 9
    : text(b5.tuesday) || texts(b5.feels).length ? 8 : text(compound.results) || texts(compound.feels).length ? 7
    : text(a.extra) ? 6 : Object.values(cost).some(x => typeof x === "number" || typeof x === "string" && x.trim()) ? 4 : text(v.tuesday) ? 3 : 0;
  return { ...seed, ...counts, mirror, step: Number.isInteger(v.step) ? Math.max(0, Math.min(13, v.step)) : 0,
    ...(v.phoneMirror && typeof v.phoneMirror === "object" ? { phoneMirror: {
      set: (v.phoneMirror.set === 1 ? 1 : 0) as 0 | 1,
      viewedBoth: v.phoneMirror.viewedBoth === true || v.phoneMirror.set === 1,
    } } : {}),
    maxReached: Math.min(13, Math.max(inferred, Number.isInteger(v.step) ? v.step : 0, Number.isInteger(v.maxReached) ? v.maxReached : 0)),
    startedAt: typeof v.startedAt === "string" ? v.startedAt : null,
    completedAt: typeof v.completedAt === "string" ? v.completedAt : null,
    focus, focusChosenBy: !focus ? null : ["revealed", "tie-picked", "changed"].includes(v.focusChosenBy)
      ? v.focusChosenBy : areas.length === 1 && areas[0] === focus ? "revealed" : areas.length > 1 ? "tie-picked" : "changed",
    tuesday: text(v.tuesday),
    defaultsNamed: { avoiding: text(named.avoiding), blaming: text(named.blaming), carrying: text(named.carrying), hoping: text(named.hoping) },
    ...(typeof v.defaultsTogether === "string" ? { defaultsTogether: v.defaultsTogether } : {}),
    cost: { monthly: amount(cost.monthly), moneyWhere: text(cost.moneyWhere), hoursPerWeek: amount(cost.hoursPerWeek),
      hoursWhere: text(cost.hoursWhere), you: text(cost.you), whoElse: text(cost.whoElse) },
    futureA: { extra: text(a.extra) },
    compound: { feels: texts(compound.feels), results: text(compound.results), whoElse: text(compound.whoElse) },
    futureB5: { feels: texts(b5.feels), tuesday: text(b5.tuesday), whoNotices: text(b5.whoNotices) },
    futureB1: { doing: text(b1.doing), oneThing: text(b1.oneThing) },
    choice: v.choice === "A" || v.choice === "B" ? v.choice : null,
    willing: v.willing === "yes" || v.willing === "not-yet" ? v.willing : null,
    notYetWhy: text(v.notYetWhy), complete: v.complete === true,
    rounds: Array.isArray(v.rounds) ? v.rounds.filter(r => obj(r).version === 2 && obj(r).complete === true).map(r => {
      const { rounds: _history, ...round } = normalizeRC({ ...obj(r), rounds: [] });
      return round;
    }) : [],
  };
}
export function loadRCState(): RCState {
  try {
    const raw = previewRead(RC_STORAGE_KEY) ?? localStorage.getItem(RC_STORAGE_KEY);
    const value: unknown = JSON.parse(raw ?? "null"), state = normalizeRC(value);
    if (raw !== null && obj(value).version !== 2) {
      const reset = JSON.stringify(state);
      if (!previewWrite(RC_STORAGE_KEY, reset)) localStorage.setItem(RC_STORAGE_KEY, reset);
    }
    return state;
  } catch { return normalizeRC(null); }
}
export function saveRCState(state: RCState): void {
  const raw = JSON.stringify({ ...state, maxReached: Math.max(state.maxReached ?? 0, state.step, state.complete ? 13 : 0) });
  if (previewWrite(RC_STORAGE_KEY, raw)) return;
  localStorage.setItem(RC_STORAGE_KEY, raw);
  notifyLocalChange(RC_STORAGE_KEY);
}
export function rcEnabled(): boolean {
  return typeof location !== "undefined" && new URLSearchParams(location.search).get("newRC") === "1";
}
export function rcReady(s: RCState, phone = false): boolean {
  if (s.step === 1) return s.mirror.length >= 3 && (!phone || s.phoneMirror?.viewedBoth === true);
  if (s.step === 2) return s.mirror.length >= 3 && s.focus !== null;
  if (s.step === 3) return s.focus !== null && !!s.tuesday.trim();
  if (s.step === 8) return !!s.futureB5.tuesday.trim();
  if (s.step === 9) return !!s.futureB1.oneThing.trim();
  return true;
}
export const rcNumber = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
export const rcMoney = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
export function costSummary(cost: RCState["cost"]): string {
  const totals = [
    cost.monthly !== null ? rcMoney(cost.monthly * 12) : "",
    cost.hoursPerWeek !== null ? `${rcNumber(cost.hoursPerWeek * 52)} hours` : "",
  ].filter(Boolean);
  const hasWords = [cost.moneyWhere, cost.hoursWhere, cost.you, cost.whoElse].some(v => v.trim());
  return totals.length ? `Over a year, that's about ${totals.join(" and ")}. And you're paying too.`
    : hasWords ? "And you're paying too." : "";
}
