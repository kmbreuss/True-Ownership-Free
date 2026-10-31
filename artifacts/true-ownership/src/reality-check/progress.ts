import { EMPTY_A2 } from "../a2Constants";
import { EMPTY_A3 } from "../a3Constants";
import { EMPTY_A4 } from "../a4Constants";
import { EMPTY_A5 } from "../a5Constants";
import { EMPTY_MIRROR4 } from "../mirror4Constants";
import { EMPTY_VISION } from "../mirror2Constants";
import { EMPTY_MIRROR3 } from "../mirror3Constants";

// Ignore cursors and automatic bookkeeping. Compare actual answers to pristine
// defaults, so mounting an untouched store never grants the legacy exemption.
export function substantive(value: unknown, empty?: unknown, key = ""): boolean {
  if (/^(version|step|currentStep|maxReached|updatedAt|createdAt|lastSaved|lastViewed|lastOpened|activeTab|section)$/.test(key)) return false;
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
  if (["a1_ex1_done", "a1_ex2_done", "a1_ex3_done", "a1_ex4_done", "a1_to_answers", "a1_sym_holdback", "a1_sym_picks", "a1_sym_note", "a1_peel_draft"]
    .some(key => substantive(read(key)))) return true;
  return ([
    ["to_a2_state_v1", EMPTY_A2], ["to_a3_state_v1", EMPTY_A3],
    ["to_a4_state_v1", EMPTY_A4], ["to_a5_state_v1", EMPTY_A5], ["to_mirror4_state_v1", EMPTY_MIRROR4],
  ] as const).some(([key, empty]) => substantive(read(key), empty));
}
