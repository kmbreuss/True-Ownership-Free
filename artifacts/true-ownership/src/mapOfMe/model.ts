import { DOMAIN_LABELS, LENS_DOMAINS, SENTENCE_TEMPLATES, type Lens } from "../mirror2Constants";
import { RC_LABEL, RC_DEFAULT_LABEL, RC_MIRROR } from "../rcConstants";
import { normalizePractical, practicalCreatures, weeklyProjection, type Practical } from "../a1End/practical";

export type Stage = "rc" | "a1" | "a2" | "a3" | "a4" | "a5";
export type EditTarget = { kind: string; mirror: string; stage: Stage; id?: string; part?: string; screen?: number };
export type Answer = { label: string; text: string };
export type MapSection = {
  id: string; stage: Stage; title: string; target: EditTarget; answers: Answer[];
  empty: string; ranked?: string[]; summary?: string; children?: MapSection[];
};
export type MapSources = { map: any; values: any; rc: any; notice: any; holdback?: string;
  rateScreens?: any[]; a2?: any; a3?: any; a4?: any; a5?: any; practical?: Practical };
export const STAGES: { id: Stage; title: string }[] = [
  { id: "rc", title: "Reality Check" }, { id: "a1", title: "A1 · All In" },
  { id: "a2", title: "A2 · Align" }, { id: "a3", title: "A3 · Advocate" },
  { id: "a4", title: "A4 · Act" }, { id: "a5", title: "A5 · Accountable" },
];
export const text = (value: unknown): string => typeof value === "string" ? value : "";
export const list = (value: unknown): any[] => Array.isArray(value) ? value : [];
export const answer = (label: string, value: unknown): Answer => ({
  label, text: typeof value === "number" && Number.isFinite(value) ? String(value) : text(value),
});
export const present = (value: Answer) => !!value.text.trim();
const sentence = (blanks: any, animal: string): string => {
  const parts = [text(blanks?.blank1).trim(), text(blanks?.blank2).trim(), text(blanks?.blank3).trim()].filter(Boolean);
  if (!parts.length) return "";
  const joined = parts.length === 1 ? parts[0] : parts.length === 2 ? `${parts[0]}, and ${parts[1]}`
    : `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
  return `In my power, the ${animal.trim().toLowerCase() || "creature"} ${joined}.`;
};
export function section(id: string, stage: Stage, title: string, mirror: string, kind: string,
  answers: Answer[], extra: Partial<MapSection> & { target?: EditTarget } = {}): MapSection {
  return { id, stage, title, answers: answers.filter(present), empty: `Fills in after ${stage === "rc" ? "Reality Check" : stage.toUpperCase()}`,
    target: { kind, stage, mirror }, ...extra };
}

/** A read-only projection of the fields owned by today's authoring rooms. Never uses legacy Map aliases. */
export function a1Sections(src: MapSources): MapSection[] {
  const { map = {}, values = {}, rc = {}, notice } = src;
  const rows: MapSection[] = [];
  const rcRow = (id: string, title: string, screen: number, answers: Answer[]) =>
    rows.push(section(`rc-${id}`, "rc", title, "Reality Check", "rc", answers,
      { target: { kind: "rc", stage: "rc", mirror: "Reality Check", screen } }));
  rcRow("mirror", "What I see", 1, list(rc.mirror).map(id =>
    answer("What I recognise", RC_MIRROR.find(item => item.id === id)?.text)));
  rcRow("focus", "Where I am now", 2, [
    answer("My focus", RC_LABEL[rc.focus as keyof typeof RC_LABEL]),
    ...list(rc.topDefaults).map(id => answer("My default", RC_DEFAULT_LABEL[id as keyof typeof RC_DEFAULT_LABEL])),
    ...Object.entries(rc.defaultsNamed || {}).map(([key, value]) =>
      answer(RC_DEFAULT_LABEL[key as keyof typeof RC_DEFAULT_LABEL] || key, value)),
  ]);
  rcRow("tuesday", "My Tuesday now", 3, [answer("My Tuesday", rc.tuesday)]);
  rcRow("cost", "What it costs me", 4, [
    answer("Money each month", rc.cost?.monthly == null ? "" : `$${rc.cost.monthly}`),
    answer("Where the money goes", rc.cost?.moneyWhere),
    answer("Hours each week", rc.cost?.hoursPerWeek), answer("Where the hours go", rc.cost?.hoursWhere),
    answer("What it costs me", rc.cost?.you), answer("How much of me", rc.cost?.youAmount),
    answer("Who else", rc.cost?.whoElse),
  ]);
  rcRow("future-a", "If nothing changes", 6, [answer("Future A", rc.futureA?.extra)]);
  rcRow("compound", "Five years of the same", 7, [
    answer("How it feels", list(rc.compound?.feels).join(" · ")), answer("What happens", rc.compound?.results),
    answer("Who else", rc.compound?.whoElse),
  ]);
  rcRow("future-b", "My Future B · five years", 8, [
    answer("A Tuesday", rc.futureB5?.tuesday), answer("How it feels", list(rc.futureB5?.feels).join(" · ")),
    answer("Who notices", rc.futureB5?.whoNotices),
  ]);
  rcRow("future-week", "My Future B · one year", 9, [
    answer("What I am doing", rc.futureB1?.doing), answer("This week", rc.futureB1?.oneThing),
  ]);
  const ranked = list(values.rank).map(id => list(values.clusters).find(c => c.id === id)).filter(Boolean);
  rows.push(section("values-rank", "a1", "What I value", "Values", "values-rank",
    ranked.map((c, i) => answer(`#${i + 1}`, text(c.userName) || text(c.proposal))),
    { ranked: ranked.map(c => text(c.userName) || text(c.proposal)), empty: "Fills in after Values",
      summary: "In the order that matters to me." }));
  for (const c of ranked) {
    const behavior = (id: string) => list(values.admire).concat(list(values.irks)).find(b => b.id === id)?.text;
    rows.push(section(`value-${c.id}`, "a1", text(c.userName) || text(c.proposal), "Values", "values-name", [
      answer("What it means to me", c.userDefinition),
      ...list(c.behaviorIds).map(id => answer(id === c.keystoneBehaviorId ? "★ What I would defend first" : "My evidence", behavior(id))),
    ], { target: { kind: "values-name", mirror: "Values", stage: "a1", id: c.id }, empty: "Fills in after Values" }));
  }
  const identity = map.mirror3 || {};
  rows.push(section("gifts", "a1", "My gifts", "Identity", "identity-gifts",
    list(identity.pickedGifts).map(g => answer(g.state === "emerging" ? "Emerging" : "Owned", g.label)),
    { empty: "Fills in after Identity" }));
  for (const c of list(identity.clusters)) {
    const creature = [text(c.animalEmoji), text(c.descriptorWord1), text(c.descriptorWord2), text(c.animal)].filter(Boolean).join(" ");
    const target = { kind: "identity-power", mirror: "Identity", stage: "a1" as const, id: c.id };
    rows.push(section(`creature-${c.id}`, "a1", creature || "Creature Superpowers", "Identity", "identity-power", [
      answer("My Superpower", sentence(c.superpower, text(c.animal))),
      ...list(c.giftIds).map(id => answer("Gift", list(identity.pickedGifts).find(g => g.id === id)?.label)),
    ], { target, empty: "Fills in after Identity · Superpowers" }));
    const shadow = identity.shadowStories?.[c.id];
    const story = typeof shadow === "string" ? shadow : [
      text(shadow?.blank1) ? `Under pressure, I ${text(shadow.blank1)}` : "",
      text(shadow?.blank2) ? `costing me ${text(shadow.blank2)}` : "",
      text(shadow?.blank3) ? `costing others ${text(shadow.blank3)}` : "",
    ].filter(Boolean).join(", ");
    rows.push(section(`pressure-${c.id}`, "a1", `Under pressure · ${text(c.animal) || "my creature"}`, "Identity", "identity-pressure", [
      answer("My pattern", story),
      ...list(c.giftIds).flatMap(id => list(identity.shadows?.[id]?.pickedShadows)
        .map(s => answer(s === identity.shadows?.[id]?.primaryShadow ? "Primary shadow" : "Shadow", s))),
    ], { target: { ...target, kind: "identity-pressure" }, empty: "Fills in after Identity · Under Pressure" }));
  }
  if (!list(identity.clusters).length) rows.push(section("creatures", "a1", "Creature Superpowers", "Identity", "identity-power", [],
    { empty: "Fills in after Identity · Superpowers" }));
  rows.push(section("purpose", "a1", "My why", "Purpose", "purpose", [answer("My why", map.purpose_final)],
    { empty: "Fills in after Purpose · Declare" }));
  rows.push(section("holdback", "a1", "What I was holding back", "Purpose", "holdback", [
    answer("What I was holding back", src.holdback),
  ], { empty: "Fills in after Purpose" }));
  for (const area of ["time", "wealth", "self"] as Lens[]) {
    const title = area[0].toUpperCase() + area.slice(1);
    rows.push(section(`vision-${area}`, "a1", `10-year vision · ${title}`, "Vision", "vision",
      LENS_DOMAINS[area].flatMap(domain => {
        const saved = map.vision?.[area]?.[domain], template = SENTENCE_TEMPLATES[area][domain];
        return [answer(`${DOMAIN_LABELS[area][domain]} · ${template.stem1}`, saved?.blank1),
          answer(template.stem2, saved?.blank2)];
      }), { target: { kind: "vision", mirror: "Vision", stage: "a1", part: area }, empty: "Fills in after Vision" }));
  }
  const practical = normalizePractical(src.practical);
  const week = practical.weekReviewedAt ? weeklyProjection(practical, practicalCreatures(map?.mirror3), rc?.futureB1?.oneThing || "", rows.find(row => row.id === "values-rank")?.ranked?.[0] || "") : null;
  rows.push(section("notice", "a1", "This week I'm living", "A1 · Live", "notice", [
    ...(week ? [answer("Do", week.do), answer("Be", week.try), answer("Live", week.notice)] : []),
    answer("My value", notice?.value), answer("A moment I lived it", notice?.lived),
    answer("A moment I didn't", notice?.didnt),
  ], { empty: "Fills in after the optional A1 weekly reflection" }));
  return rows;
}
