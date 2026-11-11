import { RC_LABEL, type RCArea, type RCState } from "../../rcConstants";

// The 26 screens of the free course, in order. Five reuse the original scenes.
export const SCREENS = [
  "opening", "meaning", "area", "tuesday", "price",             // FC-01, FC-02, FC-03, A Tuesday (original), FC-04
  "mirror", "statements", "lean",                               // FC-05, FC-06, FC-07
  "oneThing", "underneath", "protecting", "beyond", "partIOwn", // FC-08 .. FC-12
  "eyes",                                                       // Close your eyes (original)
  "futureA", "turn", "futureB", "scene", "yourB",               // FC-13 .. FC-17
  "letter", "choose", "willing",                                // note from next month, Choose, Willing / Not yet (original)
  "take",                                                       // FC-18
  "bridge", "road", "get",                                      // FC-19 .. FC-21
  "ending",                                                     // the existing waitlist ending (poster, waitlist)
] as const;
export type CourseScreen = typeof SCREENS[number];
export const SCREEN_COUNT = SCREENS.length;
export const screenIndex = (id: CourseScreen) => SCREENS.indexOf(id);

// The six movements shown in the top bar.
export const MOVEMENT_LABELS = [
  "1 · Do you own your life?", "2 · What is it costing you?", "3 · Look · the mirror",
  "4 · Ask · what part do I own?", "↻ · The turn · two futures", "5 · Act · move toward your life",
];
const MOVEMENT_START = [0, 3, 5, 8, 14, 23];
export const movementOf = (i: number) => MOVEMENT_START.filter(start => i >= start).length - 1;

// `step` (0..13) stays meaningful for the road, the ending and older readers.
// It only ever moves forward as the screen index does.
// Step 13 is the ending only; FC-18 to FC-21 sit at 12.
const LEGACY_STEP = [0, 0, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 6, 7, 8, 8, 8, 9, 10, 11, 12, 12, 12, 12, 13];
export function goTo(s: RCState, screen: number): RCState {
  const i = Math.max(0, Math.min(SCREEN_COUNT - 1, screen));
  return { ...s, fcScreen: i, step: LEGACY_STEP[i] };
}

export const AREA_COPY: Record<RCArea, { title: string; line: string; covers: string }> = {
  self: { title: "Self", line: "The relationship you have with you.", covers: "How you speak to yourself, how you see yourself, your energy, whether you're still growing." },
  time: { title: "Time", line: "Who and what gets your life.", covers: "Work, family, friends, rest and play, your health." },
  wealth: { title: "Wealth", line: "Whether money works for you, or you work for it.", covers: "Cash flow, what you're building for later, feeling secure." },
};

// FC-03 is a direct pick. A different area means different statements, so everything
// that was derived from the old area's statements is cleared; the reader's own
// Tuesday and cost words stay.
export function pickArea(s: RCState, area: RCArea): RCState {
  const next: RCState = { ...s, focus: area, focusChosenBy: "picked" };
  if (s.focus === null || s.focus === area) return next;
  const { pattern: _p, patternCounts: _c, patternChosenBy: _b, oneThing: _o, underneath: _u, underneathOther: _uo, partIOwn: _po, ...rest } = next;
  return { ...rest, mirror: [], areaCounts: { self: 0, time: 0, wealth: 0 },
    defaultCounts: { avoiding: 0, blaming: 0, carrying: 0, hoping: 0 }, topDefaults: [],
    defaultsNamed: { avoiding: "", blaming: "", carrying: "", hoping: "" }, defaultsTogether: undefined } as RCState;
}

// Whether a screen's Continue is allowed. Anything not listed is always ready.
export function courseReady(s: RCState, screen: number): boolean {
  switch (SCREENS[screen]) {
    case "area": return s.focus !== null;
    case "tuesday": return s.focus !== null && !!s.tuesday.trim();
    case "statements": return s.mirror.length >= 3;
    case "lean": return !!s.pattern;
    case "oneThing": return !!s.oneThing?.trim();
    case "underneath": return !!s.underneath && (s.underneath !== "other" || !!s.underneathOther?.trim());
    case "partIOwn": return !!s.partIOwn?.trim();
    case "futureA": return !!s.futureAPath?.year.trim();
    case "futureB": return !!s.futureBPath?.year.trim();
    case "yourB": return !!s.futureBScene?.ownWords.trim();
    case "letter": return !!s.futureB1.oneThing.trim();
    case "take": return !!(s.firstStep ?? s.futureB1.oneThing).trim();
    default: return true;
  }
}
export const areaWord = (s: RCState) => RC_LABEL[s.focus ?? "self"];

// ---- Patterns (FC-05 .. FC-10) ----
import { RC_MIRROR_ALL, mirrorCounts, type RCDefault, type RCUnderneath } from "../../rcConstants";
export const PATTERN_ORDER: RCDefault[] = ["avoiding", "blaming", "carrying", "hoping"];
export const PATTERNS: Record<RCDefault, { name: string; def: string; verb: string; keep: string; lead: string }> = {
  avoiding: { name: "Avoiding", def: "Deciding it isn't important. Pushing through. Putting it off.", verb: "avoiding", keep: "avoiding", lead: "avoiding" },
  blaming: { name: "Blaming", def: "The cause is out there. The boss, the market, someone else.", verb: "blaming", keep: "blaming", lead: "blaming" },
  carrying: { name: "Carrying", def: "Taking on what isn't yours to carry. The fixer.", verb: "carrying", keep: "carrying", lead: "carrying" },
  hoping: { name: "Blindly hoping", def: "Waiting for it to change on its own.", verb: "hoping would fix itself", keep: "waiting", lead: "waiting on" },
};
export const FEELINGS: { id: Exclude<RCUnderneath, "other">; name: string }[] = [
  { id: "fear", name: "Fear" }, { id: "guilt", name: "Guilt" }, { id: "shame", name: "Shame" }, { id: "loss", name: "Loss" },
];

// The 12 statements for the chosen area, in a fixed mixed order (tags are never shown).
const mixKey = (id: string) => { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export function areaStatements(area: RCArea) {
  return RC_MIRROR_ALL.filter(m => m.area === area).sort((a, b) => mixKey(a.id) - mixKey(b.id));
}

// Keeps pattern, topDefaults and defaultsNamed telling the same story.
function applyPattern(s: RCState, top: RCDefault[], pattern: RCDefault | undefined, by: "revealed" | "tie-picked" | undefined): RCState {
  const { pattern: _p, patternChosenBy: _b, ...rest } = s;
  const named = { avoiding: "", blaming: "", carrying: "", hoping: "" };
  if (pattern && s.oneThing) named[pattern] = s.oneThing;
  return { ...rest, topDefaults: pattern ? [pattern] : top, defaultsNamed: named,
    ...(pattern ? { pattern, patternChosenBy: by } : {}) };
}
export function toggleStatement(s: RCState, id: string): RCState {
  if (!RC_MIRROR_ALL.some(m => m.id === id && m.area === s.focus)) return s;
  const mirror = s.mirror.includes(id) ? s.mirror.filter(v => v !== id) : [...s.mirror, id];
  const counts = mirrorCounts(mirror), top = counts.topDefaults;
  const kept = s.pattern && top.includes(s.pattern) && s.patternChosenBy === "tie-picked" ? s.pattern : undefined;
  const pattern = top.length === 1 ? top[0] : kept;
  const by = top.length === 1 ? "revealed" as const : kept ? "tie-picked" as const : undefined;
  return applyPattern({ ...s, mirror, areaCounts: counts.areaCounts, defaultCounts: counts.defaultCounts, patternCounts: counts.defaultCounts }, top, pattern, by);
}
export function pickPattern(s: RCState, pattern: RCDefault): RCState { return applyPattern(s, [pattern], pattern, "tie-picked"); }
export function setOneThing(s: RCState, text: string): RCState {
  const next = { ...s, oneThing: text };
  return s.pattern ? { ...next, defaultsNamed: { avoiding: "", blaming: "", carrying: "", hoping: "", [s.pattern]: text } } : next;
}
export const tiedPatterns = (s: RCState): RCDefault[] => mirrorCounts(s.mirror).topDefaults;
export const feelingWord = (s: RCState) => s.underneath === "other" ? s.underneathOther?.trim() ?? "" : FEELINGS.find(f => f.id === s.underneath)?.name ?? "";

// ---- Future A / B (FC-13 .. FC-18) ----
import { rcMoney, rcNumber } from "../../rcConstants";
import { composeLine, labelOf, EMPTY_SCENE, type SceneKey } from "./tiles";
export const STOPS: { key: "month" | "year" | "threeYears"; label: string; months: number; required: boolean }[] = [
  { key: "month", label: "In one month", months: 1, required: false },
  { key: "year", label: "In one year", months: 12, required: true },
  { key: "threeYears", label: "In three years", months: 36, required: false },
];
// Weekly hours become 4 weeks a month, 52 a year, 156 in three years (10 a week = 40 · 520 · 1,560).
// Money is the monthly amount × 1, × 12, × 36. A blank cost is left out, never shown as zero.
const WEEKS: Record<number, number> = { 1: 4, 12: 52, 36: 156 };
export function stopCost(s: RCState, months: number, sign: "−" | "+"): string {
  const hours = s.cost.hoursPerWeek !== null ? `${sign}${rcNumber(s.cost.hoursPerWeek * WEEKS[months])} hours` : "";
  const money = s.cost.monthly !== null ? `${sign}${rcMoney(s.cost.monthly * months)}` : "";
  return [hours, money].filter(Boolean).join(" · ");
}
export const emptyPath = { month: "", year: "", threeYears: "" };
export function setPath(s: RCState, which: "futureAPath" | "futureBPath", key: "month" | "year" | "threeYears", text: string): RCState {
  return { ...s, [which]: { ...emptyPath, ...(s[which] ?? {}), [key]: text } };
}
// A short form of the reader's one thing for headings: up to the first natural break, lower-cased. Their full words are kept everywhere else.
export function ownThingClause(s: RCState): string {
  const full = (s.oneThing ?? "").trim().replace(/[.!?…]+$/u, "");
  const cut = full.split(/[,;:.—–]\s/)[0];
  const t = cut.length >= 12 ? cut : full;
  const lowered = /^I(\s|'|’)/.test(t) ? t : t.charAt(0).toLocaleLowerCase("en-US") + t.slice(1);
  if (lowered.length <= 60) return lowered;
  const clipped = lowered.slice(0, 60), at = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, at > 20 ? at : 60).trimEnd()}…`;
}
function withScene(s: RCState, scene: NonNullable<RCState["futureBScene"]>): RCState {
  return { ...s, futureBScene: scene, futureB5: { ...s.futureB5, feels: scene.feels.map(labelOf), tuesday: scene.ownWords } };
}
// Picks write the six scene fields. The Future B line follows the picks until the reader edits it.
export function setScene(s: RCState, key: SceneKey, value: string | string[]): RCState {
  const old = s.futureBScene ?? EMPTY_SCENE, next = { ...old, [key]: value } as typeof old;
  const follow = !old.ownWords || old.ownWords === composeLine(old);
  return withScene(s, { ...next, ownWords: follow ? composeLine(next) : old.ownWords });
}
export function setOwnLine(s: RCState, text: string): RCState {
  return withScene(s, { ...(s.futureBScene ?? EMPTY_SCENE), ownWords: text });
}
export function sceneAnswered(s: RCState, key: SceneKey): boolean {
  const sc = s.futureBScene ?? EMPTY_SCENE;
  return key === "feels" ? sc.feels.length > 0 : !!sc[key].trim();
}
export function setFirstStep(s: RCState, text: string): RCState {
  return { ...s, firstStep: text, futureB1: { ...s.futureB1, oneThing: text } };
}
