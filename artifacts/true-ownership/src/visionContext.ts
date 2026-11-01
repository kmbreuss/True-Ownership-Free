import type { RCState } from "./rcConstants";

export function visionRCContext(area: string, rc: RCState) {
  const words = rc.futureB5?.tuesday;
  if (rc.choice !== "B" || typeof words !== "string" || !words.trim() ||
      !["time", "wealth", "self"].includes(rc.focus || "")) return null;
  const focus = rc.focus!;
  return { words, focus, matching: focus === area,
    focusLabel: focus.charAt(0).toUpperCase() + focus.slice(1) };
}
