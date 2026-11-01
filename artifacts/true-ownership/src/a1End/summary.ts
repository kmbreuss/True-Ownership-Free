import { LENS_DOMAINS } from "../mirror2Constants";
import type { RCState } from "../rcConstants";

const text = (v: unknown): string => typeof v === "string" ? v.trim() : "";
export function shortLine(value: string): string {
  const s = value.trim().replace(/\s+/g, " ");
  if (s.length <= 90) return s;
  const cut = s.slice(0, 90);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : 90)}…`;
}
export function endSummary(map: any, values: any, rc: RCState) {
  const names: string[] = (values?.rank || []).map((id: string) => {
    const c = values?.clusters?.find((v: any) => v.id === id);
    return text(c?.userName) || text(c?.proposal);
  }).filter(Boolean).slice(0, 5);
  const creatures: string[] = (map?.mirror3?.clusters || []).map((c: any) =>
    [text(c.descriptorWord1), text(c.descriptorWord2), text(c.animal)].filter(Boolean).join(" "),
  ).filter(Boolean);
  const vision = (["time", "wealth", "self"] as const).map(area => {
    const v = map?.vision;
    const stored = text(v?.declaration?.sentences?.[area]) || text(v?.declaration?.[area]);
    const first = LENS_DOMAINS[area].flatMap(part => [text(v?.[area]?.[part]?.blank1), text(v?.[area]?.[part]?.blank2)]).find(Boolean);
    return { area, words: shortLine(stored || first || "") };
  }).filter(v => v.words);
  const top = rc.topDefaults?.[0];
  const defaults = { avoiding: "Avoiding", blaming: "Blaming", carrying: "Carrying", hoping: "Blindly hoping" };
  const focus = rc.focus ? rc.focus[0].toUpperCase() + rc.focus.slice(1) : "";
  return {
    names, creatures, vision,
    where: top && focus ? `${defaults[top]}, mostly in ${focus}.` : "",
    purpose: text(map?.purpose_final),
    futureB: rc.choice === "B" ? text(rc.futureB5?.tuesday) : "",
  };
}
export type EndSummary = ReturnType<typeof endSummary>;
