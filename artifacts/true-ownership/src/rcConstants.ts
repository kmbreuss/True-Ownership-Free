import { notifyLocalChange } from "./syncHook";
import { previewRead, previewWrite } from "./devPreview";

// The key is a stable sync identity; payload version 2 is the only journey.
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

// Free course v2: 24 more statements (three per pattern, per area). The 12 above keep
// their ids; the legacy mirror screen still shows only those 12. The 36 are used to
// count and to normalise saved answers. Tags are never shown to the reader.
export const RC_MIRROR_EXTRA: typeof RC_MIRROR = [
  { id: "self-avoiding-2", text: "I'm fine.", area: "self", default: "avoiding" },
  { id: "self-avoiding-3", text: "I stay busy so I don't have to think about it.", area: "self", default: "avoiding" },
  { id: "self-blaming-2", text: "No one makes it easy for me.", area: "self", default: "blaming" },
  { id: "self-blaming-3", text: "That's just how I was raised.", area: "self", default: "blaming" },
  { id: "self-carrying-2", text: "I feel guilty when I put myself first.", area: "self", default: "carrying" },
  { id: "self-carrying-3", text: "Everyone else's problems become mine.", area: "self", default: "carrying" },
  { id: "self-hoping-2", text: "One day I'll get back to me.", area: "self", default: "hoping" },
  { id: "self-hoping-3", text: "Someone will see what I need without me asking.", area: "self", default: "hoping" },
  { id: "time-avoiding-2", text: "I don't have time.", area: "time", default: "avoiding" },
  { id: "time-avoiding-3", text: "I keep pushing the big things to next week.", area: "time", default: "avoiding" },
  { id: "time-blaming-2", text: "My calendar isn't really mine.", area: "time", default: "blaming" },
  { id: "time-blaming-3", text: "It's the job. That's just how it is.", area: "time", default: "blaming" },
  { id: "time-carrying-2", text: "I say yes when every part of me wants to say no.", area: "time", default: "carrying" },
  { id: "time-carrying-3", text: "If I don't do it, no one will.", area: "time", default: "carrying" },
  { id: "time-hoping-2", text: "Once this project is done, I'll slow down.", area: "time", default: "hoping" },
  { id: "time-hoping-3", text: "Someone will notice how much I'm doing.", area: "time", default: "hoping" },
  { id: "wealth-avoiding-2", text: "I'll sort the money stuff out later.", area: "wealth", default: "avoiding" },
  { id: "wealth-avoiding-3", text: "I avoid the money conversation.", area: "wealth", default: "avoiding" },
  { id: "wealth-blaming-2", text: "Prices keep going up. What can I do?", area: "wealth", default: "blaming" },
  { id: "wealth-blaming-3", text: "If I were paid what I'm worth, I'd be fine.", area: "wealth", default: "blaming" },
  { id: "wealth-carrying-2", text: "I cover the gap so no one else has to.", area: "wealth", default: "carrying" },
  { id: "wealth-carrying-3", text: "I can't say no when someone needs money.", area: "wealth", default: "carrying" },
  { id: "wealth-hoping-2", text: "It'll work out somehow.", area: "wealth", default: "hoping" },
  { id: "wealth-hoping-3", text: "Next year will be the year.", area: "wealth", default: "hoping" },
];
export const RC_MIRROR_ALL: typeof RC_MIRROR = [...RC_MIRROR, ...RC_MIRROR_EXTRA];
export type RCUnderneath = "fear" | "guilt" | "shame" | "loss" | "other";
export interface RCPath { month: string; year: string; threeYears: string }
export interface RCScene { morning: string; work: string; family: string; people: string; money: string; feels: string[]; ownWords: string }

export interface RCState {
  version: 2; step: number; maxReached?: number; startedAt: string | null; completedAt: string | null;
  mirror: string[]; phoneMirror?: { set: 0 | 1; viewedBoth: boolean }; areaCounts: Record<RCArea, number>; defaultCounts: Record<RCDefault, number>;
  focus: RCArea | null; focusChosenBy: "revealed" | "tie-picked" | "changed" | "picked" | null;
  topDefaults: RCDefault[]; tuesday: string; defaultsNamed: Record<RCDefault, string>; defaultsTogether?: string;
  cost: { monthly: number | null; moneyWhere: string; hoursPerWeek: number | null; hoursWhere: string; you: string; whoElse: string; youAmount?: "a little" | "a lot" | "most of me" };
  futureA: { extra: string }; compound: { feels: string[]; results: string; whoElse: string };
  futureB5: { feels: string[]; tuesday: string; whoNotices: string };
  futureB1: { doing: string; oneThing: string };
  choice: "A" | "B" | null; willing: "yes" | "not-yet" | null; notYetWhy: string;
  complete: boolean; rounds: RCRound[];
  // Free course v2 (optional; absent on every answer saved before it).
  fcScreen?: number; pattern?: RCDefault; patternCounts?: Record<RCDefault, number>;
  patternChosenBy?: "revealed" | "tie-picked"; oneThing?: string;
  underneath?: RCUnderneath; underneathOther?: string; partIOwn?: string;
  futureAPath?: RCPath; futureBPath?: RCPath; futureBScene?: RCScene; firstStep?: string;
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
  for (const sentence of RC_MIRROR_ALL) if (ids.includes(sentence.id)) {
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
// Free course v2 fields are kept only when present, so an answer saved before them
// normalises to exactly what it always did.
function courseFields(v: Record<string, any>): Partial<RCState> {
  const out: Partial<RCState> = {};
  if (Number.isInteger(v.fcScreen)) out.fcScreen = Math.max(0, Math.min(26, v.fcScreen));
  if (RC_DEFAULTS.includes(v.pattern)) out.pattern = v.pattern as RCDefault;
  if (v.patternCounts && typeof v.patternCounts === "object") {
    const c = obj(v.patternCounts), n = (k: string) => typeof c[k] === "number" && c[k] >= 0 ? c[k] as number : 0;
    out.patternCounts = { avoiding: n("avoiding"), blaming: n("blaming"), carrying: n("carrying"), hoping: n("hoping") };
  }
  if (v.patternChosenBy === "revealed" || v.patternChosenBy === "tie-picked") out.patternChosenBy = v.patternChosenBy;
  if (typeof v.oneThing === "string") out.oneThing = v.oneThing;
  if (["fear", "guilt", "shame", "loss", "other"].includes(v.underneath)) out.underneath = v.underneath as RCUnderneath;
  if (typeof v.underneathOther === "string") out.underneathOther = v.underneathOther;
  if (typeof v.partIOwn === "string") out.partIOwn = v.partIOwn;
  if (typeof v.firstStep === "string") out.firstStep = v.firstStep;
  const path = (p: unknown): RCPath => { const o = obj(p); return { month: text(o.month), year: text(o.year), threeYears: text(o.threeYears) }; };
  if (v.futureAPath && typeof v.futureAPath === "object") out.futureAPath = path(v.futureAPath);
  if (v.futureBPath && typeof v.futureBPath === "object") out.futureBPath = path(v.futureBPath);
  if (v.futureBScene && typeof v.futureBScene === "object") {
    const s = obj(v.futureBScene);
    out.futureBScene = { morning: text(s.morning), work: text(s.work), family: text(s.family), people: text(s.people),
      money: text(s.money), feels: texts(s.feels), ownWords: text(s.ownWords) };
  }
  return out;
}
export function normalizeRC(value: unknown): RCState {
  const seed = JSON.parse(JSON.stringify(EMPTY_RC)) as RCState, v = obj(value);
  if (v.version !== 2) return seed;
  const mirror = [...new Set(texts(v.mirror))].filter(id => RC_MIRROR_ALL.some(m => m.id === id));
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
    focus, focusChosenBy: !focus ? null : ["revealed", "tie-picked", "changed", "picked"].includes(v.focusChosenBy)
      ? v.focusChosenBy : areas.length === 1 && areas[0] === focus ? "revealed" : areas.length > 1 ? "tie-picked" : "changed",
    tuesday: text(v.tuesday),
    defaultsNamed: { avoiding: text(named.avoiding), blaming: text(named.blaming), carrying: text(named.carrying), hoping: text(named.hoping) },
    ...(typeof v.defaultsTogether === "string" ? { defaultsTogether: v.defaultsTogether } : {}),
    cost: { monthly: amount(cost.monthly), moneyWhere: text(cost.moneyWhere), hoursPerWeek: amount(cost.hoursPerWeek),
      hoursWhere: text(cost.hoursWhere), you: text(cost.you), whoElse: text(cost.whoElse),
      ...(["a little", "a lot", "most of me"].includes(cost.youAmount) ? { youAmount: cost.youAmount as RCState["cost"]["youAmount"] } : {}) },
    futureA: { extra: text(a.extra) },
    compound: { feels: texts(compound.feels), results: text(compound.results), whoElse: text(compound.whoElse) },
    futureB5: { feels: texts(b5.feels), tuesday: text(b5.tuesday), whoNotices: text(b5.whoNotices) },
    futureB1: { doing: text(b1.doing), oneThing: text(b1.oneThing) },
    choice: v.choice === "A" || v.choice === "B" ? v.choice : null,
    willing: v.willing === "yes" || v.willing === "not-yet" ? v.willing : null,
    notYetWhy: text(v.notYetWhy), complete: v.complete === true, ...courseFields(v),
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
