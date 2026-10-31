import { EMPTY_VISION } from "./mirror2Constants";
import { EMPTY_MIRROR3 } from "./mirror3Constants";
import { EMPTY_MIRROR4 } from "./mirror4Constants";
import { substantive } from "./reality-check/progress";

export type A1Mirror = "purpose" | "vision" | "identity" | "values";
export type A1Flags = Record<A1Mirror, boolean>;

/** Grandfather each mirror's own work, including incomplete saved answers. */
export function a1Started(read: (key: string) => unknown, values: unknown): A1Flags {
  const map = (read("to_map") ?? {}) as Record<string, unknown>;
  return {
    purpose: Object.entries(map).some(([key, value]) => /^purpose_/.test(key) && substantive(value)) ||
      ["a1_ex1_done", "a1_ex2_done", "a1_ex3_done", "a1_ex4_done", "a1_to_curq",
        "a1_to_answers", "a1_sym_holdback", "a1_sym_picks", "a1_sym_note", "a1_peel_draft"]
        .some(key => read(key) != null),
    vision: substantive(map.vision, EMPTY_VISION),
    identity: substantive(map.mirror3, EMPTY_MIRROR3),
    values: substantive(values, EMPTY_MIRROR4),
  };
}

export function a1Unlocks(eligible: boolean, started: A1Flags, complete: A1Flags, preview = false): A1Flags {
  return {
    values: preview || started.values || complete.values || eligible,
    identity: preview || started.identity || complete.identity || complete.values,
    purpose: preview || started.purpose || complete.purpose || complete.identity,
    vision: preview || started.vision || complete.vision || complete.purpose,
  };
}
