import { isDevPreview, previewRead } from "../devPreview";
import { notifyLocalChange } from "../syncHook";
import type { Mirror3State } from "../mirror3Constants";

export const PRACTICAL_KEY = "to_a1_practical_v1";
export type Balance = "lot" | "right" | "behind";
export interface Practical {
  version: 1;
  balanceByCreatureId: Record<string, Balance>;
  balanceIntent: { lotCreatureId: string; behindCreatureId: string; answer: "yes" | "no" } | null;
  tryCreatureId: string | null;
  trySelectionSource: "balance" | "chosen" | "single" | null;
  tryAnswersByCreatureId: Record<string, string>;
  sharpenedOneThing: string | null;
  weekReviewedAt: string | null;
}
export const EMPTY_PRACTICAL: Practical = {
  version: 1, balanceByCreatureId: {}, balanceIntent: null,
  tryCreatureId: null, trySelectionSource: null, tryAnswersByCreatureId: {},
  sharpenedOneThing: null, weekReviewedAt: null,
};
const invalid = (): never => { throw new Error("Your practical A1 answers could not be read. Nothing has been replaced."); };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
function strings<T extends string>(value: unknown, valid: (v: string) => boolean = () => true): Record<string, T> {
  if (value === undefined) return {};
  if (!object(value)) return invalid();
  for (const v of Object.values(value)) if (typeof v !== "string" || !valid(v)) return invalid();
  return { ...value } as Record<string, T>;
}
export function normalizePractical(value: unknown): Practical {
  if (value == null) return { ...EMPTY_PRACTICAL, balanceByCreatureId: {}, tryAnswersByCreatureId: {} };
  if (!object(value) || value.version !== 1) return invalid();
  const p = { ...EMPTY_PRACTICAL, ...value };
  if (p.tryCreatureId !== null && typeof p.tryCreatureId !== "string"
    || p.sharpenedOneThing !== null && typeof p.sharpenedOneThing !== "string"
    || ![null, "balance", "chosen", "single"].includes(p.trySelectionSource)
    || p.weekReviewedAt !== null && (typeof p.weekReviewedAt !== "string" || !Number.isFinite(Date.parse(p.weekReviewedAt)))) return invalid();
  if (p.balanceIntent !== null && (!object(p.balanceIntent)
    || typeof p.balanceIntent.lotCreatureId !== "string" || typeof p.balanceIntent.behindCreatureId !== "string"
    || !["yes", "no"].includes(p.balanceIntent.answer))) return invalid();
  return { ...p, balanceByCreatureId: strings<Balance>(value.balanceByCreatureId, v => ["lot", "right", "behind"].includes(v)),
    tryAnswersByCreatureId: strings(value.tryAnswersByCreatureId) } as Practical;
}
export function loadPractical(): Practical {
  const raw = previewRead(PRACTICAL_KEY) ?? localStorage.getItem(PRACTICAL_KEY);
  return normalizePractical(raw ? JSON.parse(raw) : null);
}
export function savePractical(patch: Partial<Practical>): boolean {
  if (isDevPreview()) return false;
  const next = normalizePractical({ ...loadPractical(), ...patch });
  localStorage.setItem(PRACTICAL_KEY, JSON.stringify(next));
  notifyLocalChange(PRACTICAL_KEY);
  window.dispatchEvent(new Event("a1-practical-change"));
  return true;
}
export interface PracticalCreature { id: string; name: string; animal: string; emoji: string; power: string; gifts: string[] }
export function practicalCreatures(identity?: Mirror3State): PracticalCreature[] {
  return (identity?.clusters || []).map(c => {
    const parts = [c.superpower?.blank1, c.superpower?.blank2, c.superpower?.blank3].filter((s): s is string => !!s?.trim());
    const blanks = parts.length === 3 ? `${parts[0]}, ${parts[1]}, and ${parts[2]}`
      : parts.length === 2 ? `${parts[0]}, and ${parts[1]}` : parts[0] || "";
    return { id: c.id, name: [c.descriptorWord1, c.descriptorWord2, c.animal].filter(s => !!s?.trim()).join(" ") || c.name || c.animal,
      animal: c.animal, emoji: c.animalEmoji || "",
      power: blanks ? `In my power, the ${c.animal.toLowerCase()} ${blanks}.` : "",
      gifts: c.giftIds.map(id => identity?.pickedGifts?.find(g => g.id === id)?.label).filter((s): s is string => !!s) };
  });
}
export function balancePair(p: Practical, creatures: PracticalCreature[]) {
  return { lot: creatures.find(c => p.balanceByCreatureId[c.id] === "lot"),
    behind: creatures.find(c => p.balanceByCreatureId[c.id] === "behind") };
}
export function resolveTry(p: Practical, creatures: PracticalCreature[]): { creature?: PracticalCreature; source: Practical["trySelectionSource"] } {
  if (creatures.length === 1) return { creature: creatures[0], source: "single" };
  const { lot, behind } = balancePair(p, creatures);
  const balanced = behind || (lot && creatures.find(c => p.balanceByCreatureId[c.id] === "right"));
  if (balanced) return { creature: balanced, source: "balance" };
  return { creature: p.trySelectionSource === "chosen" ? creatures.find(c => c.id === p.tryCreatureId) : undefined, source: "chosen" };
}
export function weeklyProjection(p: Practical, creatures: PracticalCreature[], original: string, value: string) {
  const { creature } = resolveTry(p, creatures);
  const answer = creature && p.tryAnswersByCreatureId[creature.id];
  return { do: p.sharpenedOneThing?.trim() ? p.sharpenedOneThing : original, creature,
    try: answer?.trim() ? answer : creature?.gifts[0] ? `Use your ${creature.name}'s gift for ${creature.gifts[0]} once this week.` : "",
    notice: value ? `One moment ${value} showed up this week. And one moment it didn't.` : "" };
}
