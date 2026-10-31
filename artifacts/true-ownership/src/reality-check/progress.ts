import { EMPTY_VISION } from "../mirror2Constants";
import { EMPTY_MIRROR3 } from "../mirror3Constants";

// The legacy Map of Me includes automatic empty mirror shapes, not exercises.
// Dedicated saved exercise records, however, count even on their first screen.
export function substantive(value: unknown, empty?: unknown, key = ""): boolean {
  if (/^(version|updatedAt|createdAt|lastSaved|lastViewed|lastOpened|activeTab|section)$/.test(key)) return false;
  if (value == null || value === empty || value === "" || value === false) return false;
  if (typeof value === "number") return value !== 0 && value !== empty;
  if (typeof value === "string") return !!value.trim();
  if (Array.isArray(value)) return value.some((v, i) => substantive(v, Array.isArray(empty) ? empty[i] : undefined));
  if (typeof value === "object") return Object.entries(value).some(([k, v]) =>
    substantive(v, empty && typeof empty === "object" ? (empty as Record<string, unknown>)[k] : undefined, k));
  return value === true;
}
export function hasPriorProgress(read: (key: string) => unknown): boolean {
  const map = (read("to_map") ?? {}) as Record<string, unknown>;
  if (substantive(map.vision, EMPTY_VISION) || substantive(map.mirror3, EMPTY_MIRROR3)) return true;
  if (["purpose_final", "purpose_draft", "purpose_layers", "a2_one_thing", "a3_board_candidates"]
    .some(key => substantive(map[key]))) return true;
  if (["a1_ex1_done", "a1_ex2_done", "a1_ex3_done", "a1_ex4_done", "a1_to_curq", "a1_to_answers", "a1_sym_holdback", "a1_sym_picks", "a1_sym_note", "a1_peel_draft"]
    .some(key => read(key) != null)) return true;
  return ["to_a2_state_v1", "to_a3_state_v1", "to_a4_state_v1", "to_a5_state_v1", "to_mirror4_state_v1"]
    .some(key => read(key) != null);
}

/** Inspect received cloud data too: reconciliation must not erase eligibility. */
export function hasCloudProgress(cache: Record<string, unknown>): boolean {
  const unwrap = (value: unknown): unknown => value && typeof value === "object" && "v" in value
    ? (value as { v: unknown }).v : value;
  const a1 = unwrap(cache.a1progress);
  if (a1 != null) return true;
  const stores: Record<string, unknown> = {
    to_map: unwrap(cache.map), to_a2_state_v1: unwrap(cache.a2state),
    to_a3_state_v1: unwrap(cache.a3state), to_a4_state_v1: unwrap(cache.a4state),
    to_a5_state_v1: unwrap(cache.a5state), to_mirror4_state_v1: unwrap(cache.m4state),
  };
  return hasPriorProgress(key => stores[key]);
}
