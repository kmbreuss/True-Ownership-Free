import { endSummary, shortLine } from "../a1End/summary";
import { EMPTY_MIRROR4, m4RoomDone, type Mirror4State } from "../mirror4Constants";
import { EMPTY_RC, type RCState } from "../rcConstants";

export const ROAD_GROUPS = [
  { id: "rc", label: "REALITY CHECK", short: "RC", total: 16 },
  { id: "a1", label: "A1 · ALL IN", short: "A1", total: 18 },
  { id: "a2", label: "A2 · ALIGN", short: "A2", total: 11 },
  { id: "a3", label: "A3 · ADVOCATE", short: "A3", total: 19 },
  { id: "a4", label: "A4 · ACT", short: "A4", total: 19 },
  { id: "a5", label: "A5 · ACCOUNTABLE", short: "A5", total: 5 },
] as const;
export type RoadGroup = typeof ROAD_GROUPS[number]["id"];
export type Brick = { id: string; group: RoadGroup; mirror: string; label: string; done: boolean; detail: string; moment: string };
export type ReadProgress = (key: string) => any;
const words = (v: unknown) => typeof v === "string" ? v.trim() : "";
const list = (v: any): any[] => Array.isArray(v) ? v : [];
const lower = (s: string) => s ? s[0].toLowerCase() + s.slice(1) : "";
export const joinNames = (s: string[]) => s.length < 3 ? s.join(" and ") : `${s.slice(0, -1).join(", ")} and ${s.at(-1)}`;

/** Pure projection: never calls a save helper, seeds a store or changes a gate. */
export function readJourney(read: ReadProgress) {
  const map = read("to_map") ?? {}, rc: RCState = { ...EMPTY_RC, ...(read("to_rc_state_v1") ?? {}) };
  const values = { ...EMPTY_MIRROR4, ...(read("to_mirror4_state_v1") ?? {}) } as Mirror4State;
  const identity = map.mirror3 ?? {}, vision = map.vision ?? {};
  const summary = endSummary(map, values, rc);
  const bricks: Brick[] = [];
  const series = (group: RoadGroup, mirror: string, labels: string[], done: boolean[], details: string[] = [], moments: string[] = []) =>
    labels.forEach((label, i) => bricks.push({ id: `${group}:${mirror}:${i}`, group, mirror, label,
      done: !!done[i], detail: shortLine(details[i] ?? ""), moment: moments[i] ?? `${mirror} · ${label} done.` }));
  const reached = Math.max(rc.step ?? 0, rc.maxReached ?? 0);
  const rcEverComplete = !!rc.complete || list(rc.rounds).some(round => round.complete === true);
  const rcLabels = ["Begin", "Opening", "Person A / Person B", "The mirror", "What you’re showing yourself",
    "Your Tuesday", "The price", "Close your eyes", "Future A", "It compounds", "Future B · five years",
    "A note from next October", "The choice", "What you’re willing to do", "Your readback", "Your path"];
  // Start is evidenced by startedAt. The two opening beats share step 0:
  // advancing to step 1 proves both; no invented per-beat saved flags.
  const rcDone = rcLabels.map((_, i) => rcEverComplete || (i === 0 ? !!rc.startedAt
    : i <= 2 ? reached >= 1 : reached > i - 2));
  series("rc", "Reality Check", rcLabels, rcDone, ["", "", "", "", "", rc.tuesday, rc.cost?.you, "", "",
    rc.compound?.results, rc.futureB5?.tuesday, rc.futureB1?.oneThing]);
  const noticeCount = list(values.admire).filter(b => b.source !== "flipped").length + list(values.irks).length;
  const valueKeys = ["admire", "irks", "portrait", "flip", "name", "rank", "claim"] as const;
  const valueLabels = ["Admire", "Irks", "Portrait", "Flip the Irks", "Name the Standards", "Rank and pressure test", "Claim"];
  const valueDone = valueKeys.map(k => {
    if (values.claimed) return true;
    if (k === "flip" && !list(values.irks).length) return false;
    if (k === "admire" || k === "irks" || k === "portrait") return values.discoverSections?.[k] === true;
    if (k === "name") return !!values.pressureTest.complete ||
      list(values.clusters).length > 0 && list(values.clusters).every(c => words(c.userName)) &&
      list(values.admire).every(b => b.inUseByCluster);
    return m4RoomDone(values, k);
  });
  series("a1", "Values", valueLabels, valueDone,
    [`${list(values.admire).filter(b => b.source !== "flipped").length} behaviors admired`, `${list(values.irks).length} irks noticed`,
      `${noticeCount} behaviors noticed`, "", joinNames(summary.names.slice(0, 3)), joinNames(summary.names.slice(0, 3))],
    [`Admire done. ${list(values.admire).filter(b => b.source !== "flipped").length} behaviors that light you up.`,
      `Irks done. ${list(values.irks).length} behaviors that show what you won’t accept.`,
      `Notice done. ${noticeCount} behaviors that show what you stand for.`,
      "Flip done. You’ve turned what you can’t stand into what you stand for.",
      `Name done. ${summary.names.length} standards named.`,
      "Order done. You know which value wins when they clash.", "Values claimed. You know what you won’t trade."]);
  const identityDone = !!identity.sealCompleted;
  const clusters = list(identity.clusters);
  series("a1", "Identity", ["Your Gifts", "Superpowers", "Under Pressure", "Claim"], [
    identityDone || list(identity.pickedGifts).length > 0,
    identityDone || clusters.length > 0 && clusters.every(c => words(c.animal)),
    identityDone || clusters.length > 0 && clusters.every(c => identity.shadowStories?.[c.id]),
    identityDone,
  ], [list(identity.pickedGifts).map(g => words(g.name ?? g.label)).filter(Boolean).join(" · "),
    joinNames(summary.creatures), "", joinNames(summary.creatures)]);
  const purposeDone = !!read("a1_ex4_done");
  series("a1", "Purpose", ["Turn Out", "Peel", "Declare"], [
    purposeDone || !!read("a1_ex2_done"), purposeDone || !!read("a1_ex3_done"), purposeDone,
  ], ["", "", summary.purpose]);
  const visionDone = !!vision.complete;
  series("a1", "Vision", ["Time", "Wealth", "Self", "Declare"], [
    visionDone || !!vision.time_complete, visionDone || !!vision.wealth_complete,
    visionDone || !!vision.self_complete, visionDone,
  ], ["time", "wealth", "self"].map(area => summary.vision.find(v => v.area === area)?.words ?? ""));
  const a2 = read("to_a2_state_v1") ?? {};
  const m1 = a2.m1 ?? {}, m2 = a2.m2 ?? {}, m3 = a2.m3 ?? {};
  series("a2", "Alignment Check", ["Read your A1", "Rate alignment", "Key Misalignment", "Claim"],
    [1, 2, 3, 4].map(n => !!m1.claimed || n < Number(m1.maxReached ?? 1)), ["", "", words(m1.bottleneck)]);
  series("a2", "Time Audit", ["Your priorities", "Where time goes", "What’s missing", "Claim"],
    [list(m2.activities).length > 0 || list(m2.missingItems).length > 0, list(m2.missingItems).length > 0, false, false].map(done => !!m2.claimed || done),
    [list(m2.priorities).join(" · "), `${list(m2.activities).length} activities`, list(m2.missingItems).map(v => v.name).join(" · ")]);
  series("a2", "Named Truth", ["The gap", "Rethink your time", "Claim"],
    [Object.keys(m3.activityDecisions ?? {}).length > 0 || !!words(m3.moveText), false, false].map(done => !!m3.claimed || done), ["", words(m3.moveText)]);
  const a3 = read("to_a3_state_v1") ?? {};
  const a3Parts = [
    ["People", ["Name them", "Rate them", "Claim"]],
    ["Environment", ["Name them", "Rate them", "Claim"]],
    ["Thoughts", ["Listen", "Shape", "Claim"]],
    ["Energy Map", ["The view", "Claim"]],
    ["The Board", ["Fill the seats", "Your table", "Claim"]],
    ["The Move", ["The people", "Your surroundings", "The inner voice", "The bottleneck", "Claim"]],
  ] as const;
  a3Parts.forEach(([name, labels], i) => {
    const s = a3[`m${i + 1}`] ?? {};
    const evidence = i === 0 ? [Object.keys(s.ratings ?? {}).length > 0, false, false]
      : i === 1 ? [list(s.items).some(item => item.rating), false, false]
      : i === 2 ? [!!words(s.voiceNow) || !!words(s.voiceWant), false, false]
      : i === 3 ? [false, false] : i === 4 ? [false, false, false]
      : [!!s.environment, !!s.thought, !!s.bottleneck, false, false];
    series("a3", name, [...labels], labels.map((_, j) => !!s.claimed || evidence[j]),
      i === 0 ? [list(s.names).join(" · ")] : i === 2 ? [list(s.thoughts).map(t => t.text).join(" · "), words(s.voiceWant)]
        : i === 4 ? [list(s.seats).map(t => t.role).join(" · ")] : []);
  });
  const a4 = read("to_a4_state_v1") ?? {};
  ["self", "time", "wealth"].forEach(key => {
    const s = a4[key] ?? {};
    series("a4", `Act · ${key[0].toUpperCase()}${key.slice(1)}`,
      ["See the gap", "Choose the gap", "Your commitment", "One year from now", "Your plan", "Claim"],
      [!!words(s.will), !!words(s.will), !!words(s.year), !!words(s.plan), false, false].map(done => !!s.claimed || done),
      ["", "", words(s.will), words(s.year), words(s.plan)]);
  });
  series("a4", "Act", ["Claim A4"], [!!a4.a4?.claimed]);
  const a5 = read("to_a5_state_v1") ?? {};
  series("a5", "Accountable", ["Your promises from A4", "Your plan", "Your supports", "Your rhythm", "Claim"],
    [0, 1, 2, 3, 4].map(() => !!a5.claimed));
  const claimed = { values: !!values.claimed, identity: identityDone, purpose: purposeDone, vision: visionDone };
  const lines = { values: summary.names.length ? `I live by ${joinNames(summary.names.slice(0, 3))}.` : "",
    identity: summary.creatures.length ? `I lead with ${joinNames(summary.creatures)}.` : "",
    purpose: summary.purpose ? `Because ${lower(summary.purpose).replace(/[.!?]+$/, "")}.` : "",
    vision: summary.vision.length ? `In ten years, ${lower(summary.vision.map(v => v.words).join(" · ")).replace(/[.!?]+$/, "")}.` : "" };
  return { bricks, rc, summary, claimed, lines, count: bricks.filter(b => b.done).length,
    clarity: Number(rcEverComplete) + Object.values(claimed).filter(Boolean).length };
}
export type JourneySnapshot = ReturnType<typeof readJourney>;
export function groupForView(view: string): RoadGroup {
  if (view === "rc" || view === "rcroom") return "rc";
  for (const group of ["a2", "a3", "a4", "a5"] as const) if (view.startsWith(group)) return group;
  return "a1";
}
