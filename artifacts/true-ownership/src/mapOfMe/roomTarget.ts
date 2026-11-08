import type { EditTarget } from "./model";

/** Presentation only. Never changes a mirror's stored step or access flags. */
export function mapRoomTarget(t: EditTarget) {
  const groups: [string[], string, number, string][] = [
    [["alignment-rate"], "Alignment Check", 2, "Rate alignment"],
    [["alignment-gap"], "Alignment Check", 3, "Choose your gap"],
    [["time-priorities"], "Time Audit", 1, "Priorities"],
    [["time-activities"], "Time Audit", 2, "Where your time goes"],
    [["time-missing"], "Time Audit", 3, "What's missing"],
    [["truth-intentions"], "Named Truth", 1, "Your intentions"],
    [["truth-decisions"], "Named Truth", 2, "Name the truth"],
    [["truth-move"], "Named Truth", 3, "My move"],
    [["people-names"], "People", 1, "Your people"],
    [["people-ratings"], "People", 2, "Who lifts you"],
    [["environment-items"], "Environment", 1, "Habits and places"],
    [["environment-ratings"], "Environment", 2, "What helps"],
    [["thought-moment"], "Thoughts", 1, "Your thoughts"],
    [["thoughts", "thought-voice"], "Thoughts", 2, "Shape your thoughts"],
    [["board"], "The Board", 1, "Fill your table"],
    [["move-pick"], "The Move", 1, "Pick your move"],
    [["move-bottleneck"], "The Move", 4, "Your one move"],
  ];
  const found = groups.find(g => g[0].includes(t.kind));
  const name = found?.[1] || t.mirror;
  const step = t.kind === "move-pick" ? Math.max(0, ["person", "env", "thought"].indexOf(t.part || "")) + 1 : found?.[2] || 1;
  const part = found?.[3] || t.part || t.mirror;
  const areaStep = ({ "a4-money": 0, "a4-gap": 1, "a4-name": 2, "a4-promise": 3, "a4-year": 4, "a4-plan": 5,
    "a5-plan": 1, "a5-supports": 2, "a5-rhythm": 3, "a5-checkin": 0, "a5-lookback": 1 } as Record<string, number>)[t.kind];
  const frame = t.stage === "a2" && name === "Alignment Check" ? "na1-a2m1-room-card"
    : t.stage === "a2" && name === "Named Truth" ? "na1-a2m3-room-card"
    : `na1-a2m2-room-card${t.stage === "a4" || t.stage === "a5" ? " na1-a4-room" : ""}${t.stage === "a5" ? " na1-a5-room" : ""}`;
  const body = t.stage === "a2" && name === "Alignment Check" ? "na1-a2m1-body"
    : t.stage === "a2" && name === "Named Truth" ? "na1-a2m3-body" : "na1-a2m2-body";
  return { name, step, part, areaStep, frame, body };
}
