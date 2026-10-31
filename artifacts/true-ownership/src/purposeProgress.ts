export type PurposeProgress = { ex2: boolean; ex3: boolean; ex4: boolean };
export type PurposeRoom = "to" | "peel" | "declare";

/** The historical flags retain their meanings; a declaration is a real claim. */
export function purposeSteps(progress: PurposeProgress): boolean[] {
  return progress.ex4 ? [true, true, true] : [progress.ex2, progress.ex3, false];
}

export function purposeRoomUnlocked(
  key: string, progress: PurposeProgress, map: any = {}, peelDraft: unknown = "", preview = false,
): boolean {
  if (!["to", "peel", "declare"].includes(key)) return false;
  if (preview || key === "to") return true;
  if (key === "peel") return !!(progress.ex2 || progress.ex3 || progress.ex4 ||
    (Array.isArray(map.purpose_layers) && map.purpose_layers.some((v: unknown) => typeof v === "string" && v.trim())) ||
    (typeof peelDraft === "string" && peelDraft.trim()));
  return !!(progress.ex3 || progress.ex4 ||
    (typeof map.purpose_final === "string" && map.purpose_final.trim()));
}
