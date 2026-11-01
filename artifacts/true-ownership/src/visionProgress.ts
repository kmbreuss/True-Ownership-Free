export type VisionProgress = {
  ex2?: boolean; ex3?: boolean; ex4?: boolean; ex5?: boolean; complete?: boolean;
};

/** Historical flags retain their meanings: ex1 belongs to retired Two Futures. */
export function visionSteps(progress: VisionProgress): boolean[] {
  return progress.complete ? [true, true, true, true]
    : [!!progress.ex2, !!progress.ex3, !!progress.ex4, !!progress.ex5];
}

export function visionRoomUnlocked(key: string, vision: any, preview = false): boolean {
  const keys = ["time", "wealth", "self", "declaration"];
  const index = keys.indexOf(key);
  if (index < 0) return false; // Retired rooms stay closed even in Preview.
  if (preview || index === 0 || vision?.complete || vision?.declaration?.claimedAt) return true;
  if (key === "declaration") return !!(vision?.self_complete || vision?.declaration?.sealSeen);
  const answers = vision?.[key];
  const hasDraft = answers && Object.values(answers).some((part: any) =>
    part && [part.blank1, part.blank2].some(v => typeof v === "string" && v.trim()));
  return !!(hasDraft || vision?.[`${key}_complete`] || vision?.[`${keys[index - 1]}_complete`]);
}
