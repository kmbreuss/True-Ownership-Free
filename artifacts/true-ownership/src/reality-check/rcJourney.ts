import { EMPTY_RC, RC_LABEL, RC_MIRROR, RC_DEFAULT_PROMPT, RC_DEFAULT_LABEL, normalizeRC, saveRCState, rcNumber, rcMoney, type RCState, type RCRound } from "../rcConstants";
import { notifyLocalChange } from "../syncHook";
import { previewRead, previewWrite } from "../devPreview";

export const SETASIDE_KEY = "to_setaside_v1";
export interface SetAsideItem {
  id: string; text: string; source: string; round: string; createdAt: string;
  [key: string]: unknown;
}
export interface SetAsideState { version: 1; items: SetAsideItem[] }
export const EMPTY_SETASIDE: SetAsideState = { version: 1, items: [] };
export function loadSetAside(): SetAsideState {
  const value = JSON.parse(previewRead(SETASIDE_KEY) ?? localStorage.getItem(SETASIDE_KEY) ?? "null");
  if (!value) return { version: 1, items: [] };
  if (value.version !== 1 || !Array.isArray(value.items)) throw new Error("Your set-aside list could not be read.");
  return value;
}
export function completeRC(s: RCState, now = new Date().toISOString()): RCState {
  return { ...s, complete: true, startedAt: s.startedAt ?? now, completedAt: s.completedAt ?? now };
}
export function setAsideFor(s: RCState): SetAsideItem[] {
  const round = s.startedAt ?? "initial", createdAt = s.completedAt ?? s.startedAt ?? "";
  const item = (id: string, text: string): SetAsideItem => ({ id: `rc:${round}:${id}`, text, source: "reality-check", round, createdAt });
  return [
    ...RC_MIRROR.filter(m => s.mirror.includes(m.id) && m.area !== s.focus)
      .map(m => item(m.id, `${RC_LABEL[m.area]} · "${m.text}"`)),
    ...(s.topDefaults.length > 2 && s.defaultsTogether !== undefined
      ? s.defaultsTogether.trim() ? [item("named:together", `${s.focus ? RC_LABEL[s.focus] + " · " : ""}What are you avoiding, blaming, carrying or hoping for? "${s.defaultsTogether}"`)] : []
      : s.topDefaults.filter(d => s.defaultsNamed[d].trim())
      .map(d => item(`named:${d}`, `${s.focus ? RC_LABEL[s.focus] + " · " : ""}${RC_DEFAULT_PROMPT[d]} "${s.defaultsNamed[d]}"`))
    ),
  ];
}
// Set aside first, then mark RC complete. Retries replace only this round's RC
// entries; other rounds, manually added items and sorting metadata survive.
export function persistRCCompletion(s: RCState): RCState {
  const next = completeRC(s), old = loadSetAside(), round = next.startedAt!;
  const additions = setAsideFor(next).map(item => ({ ...old.items.find(v => v.id === item.id), ...item }));
  const aside = { version: 1 as const, items: [...old.items.filter(v => v.source !== "reality-check" || v.round !== round), ...additions] };
  const raw = JSON.stringify(aside);
  if (!previewWrite(SETASIDE_KEY, raw)) {
    localStorage.setItem(SETASIDE_KEY, raw); notifyLocalChange(SETASIDE_KEY);
  }
  saveRCState(next);
  return next;
}
export function lastCompletedRC(s: RCState): RCState | RCRound | null {
  return s.complete ? s : s.rounds.at(-1) ?? null;
}
export function redoDue(s: RCState, now = Date.now()): boolean {
  return s.complete && !!s.completedAt && now - Date.parse(s.completedAt) >= 90 * 86400000;
}
export function startRedo(s: RCState, now = new Date().toISOString()): RCState {
  const { rounds, ...round } = s;
  const history = s.complete && !rounds.some(r => r.completedAt === s.completedAt) ? [...rounds, round] : rounds;
  return { ...normalizeRC(EMPTY_RC), startedAt: now, rounds: history };
}
export function journeyMonth(s: Pick<RCState, "startedAt">): string {
  const date = s.startedAt ? new Date(s.startedAt) : new Date();
  return (Number.isNaN(date.getTime()) ? new Date() : date).toLocaleDateString("en-US", { month: "long" });
}
export function annualAmounts(s: Pick<RCState, "cost">, years = 1, days: "threshold" | "always" | "never" = "never") {
  const hours = s.cost.hoursPerWeek === null ? null : s.cost.hoursPerWeek * 52 * years;
  return {
    money: s.cost.monthly === null ? "" : rcMoney(s.cost.monthly * 12 * years),
    hours: hours === null ? "" : days === "always" || (days === "threshold" && hours > 1000)
      ? `${rcNumber(Math.round(hours / 24))} days` : `${rcNumber(hours)} hours`,
  };
}
export function futureAReadback(s: RCState | RCRound): string {
  const amounts = annualAmounts(s);
  return [
    s.tuesday.trim() ? /^I(?:['’]m| am)\s+/i.test(s.tuesday.trim())
      ? `You're still ${reflectionClause(s.tuesday)}.`
      : `Your Tuesday is still the same: “${endClean(s.tuesday)}.”` : "",
    ...(s.topDefaults.length > 2 && s.defaultsTogether !== undefined
      ? s.defaultsTogether.trim() ? [`The pattern is still here: “${endClean(s.defaultsTogether)}.”`] : []
      : s.topDefaults.filter(d => s.defaultsNamed[d].trim()).map(d => {
      const word = { avoiding: "avoiding", blaming: "blaming", carrying: "carrying", hoping: "hoping" }[d];
      const clause = reflectionClause(s.defaultsNamed[d]);
      return d === "hoping" ? `You're still hoping for this: “${endClean(s.defaultsNamed[d])}.”`
        : `You're still ${clause.toLowerCase().startsWith(word) ? clause : `${word} ${clause.replace(/^The /, "the ")}`}.`;
    })),
    amounts.money || amounts.hours ? `Another ${[amounts.money, amounts.hours].filter(Boolean).join(" and ")} ${amounts.hours ? "are" : "is"} gone.` : "",
    s.cost.hoursWhere.trim() ? `That time is still going into ${reflectionClause(s.cost.hoursWhere)}.` : "",
  ].filter(Boolean).join(" ");
}
export function endClean(value: string): string { return value.trim().replace(/[.!?…]+$/u, ""); }
export function reflectionClause(value: string): string {
  return endClean(value).replace(/^I(?:['’]m| am)\s+/i, "").replace(/^I\s+/i, "")
    .replace(/\bmy\b/gi, "your").replace(/\bmyself\b/gi, "yourself").replace(/\bme\b/gi, "you");
}
export function defaultList(s: Pick<RCState, "topDefaults">): string {
  const words = s.topDefaults.map(d => RC_DEFAULT_LABEL[d]);
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words.at(-1)}`;
}
export function lastTimeWords(previous: RCRound, step: number): string {
  const defaults = previous.topDefaults.map(d => RC_DEFAULT_LABEL[d]).join(" and ");
  const answers: Record<number, string> = {
    0: previous.completedAt ? new Date(previous.completedAt).toLocaleDateString("en-US") : "",
    1: RC_MIRROR.filter(m => previous.mirror.includes(m.id)).map(m => m.text).join(" "),
    2: `${previous.focus ? RC_LABEL[previous.focus] : ""} · ${defaults}`,
    3: previous.tuesday, 4: [previous.cost.you, ...Object.values(annualAmounts(previous))].filter(Boolean).join(" · "),
    5: previous.tuesday, 6: futureAReadback(previous), 7: [previous.compound.feels.join(", "), previous.compound.results, previous.compound.whoElse].filter(Boolean).join(" · "),
    8: previous.futureB5.tuesday, 9: previous.futureB1.oneThing, 10: previous.choice ? `Future ${previous.choice}` : "",
    11: previous.willing ?? "", 12: previous.notYetWhy || previous.futureB1.oneThing, 13: previous.futureB1.oneThing,
  };
  return answers[step] ?? "";
}
