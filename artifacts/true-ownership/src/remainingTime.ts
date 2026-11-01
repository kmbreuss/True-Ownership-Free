import { purposeSteps, type PurposeProgress } from "./purposeProgress";
import { visionSteps } from "./visionProgress";
import { M4_ROOMS, m4RoomDone, type Mirror4State } from "./mirror4Constants";

const unfinished = (steps: boolean[]) => steps.filter(done => !done).length;

/** Same completion evidence as the four listed Identity rooms; never infer steps from "started". */
export function identitySteps(state: any): boolean[] {
  if (state?.sealCompleted) return [true, true, true, true];
  const clusters: any[] = Array.isArray(state?.clusters) ? state.clusters : [];
  const gifts = Array.isArray(state?.pickedGifts) && state.pickedGifts.length > 0;
  const animals = clusters.length > 0 && clusters.every(c =>
    [c.name, c.animal, c.descriptorWord1, c.descriptorWord2].every(v => typeof v === "string" && v.trim()) &&
    Array.isArray(c.giftIds) && c.giftIds.length > 0);
  const pressure = clusters.length > 0 && clusters.every(c => {
    const picked = Array.isArray(c.giftIds) && c.giftIds.every((id: string) => {
      const shadow = state?.shadows?.[id];
      return shadow?.pickedShadows?.length > 0 && shadow.primaryShadow != null;
    });
    const story = state?.shadowStories?.[c.id];
    return picked && story && typeof story === "object" &&
      [story.blank1, story.blank2, story.blank3].every(v => typeof v === "string" && v.trim());
  });
  return [!!gifts, animals, !!pressure, false];
}

/** Approved estimate: ten minutes for each unfinished, currently listed exercise. */
export function a1RemainingMinutes(purpose: PurposeProgress, vision: any, identity: any, values: Mirror4State): number {
  const activeVisionSteps = visionSteps(vision);
  const valuesSteps = values.claimed ? [] : M4_ROOMS.filter(r => r.bodyShipped && !r.comingSoon)
    .map(r => m4RoomDone(values, r.key));
  return 10 * (unfinished(purposeSteps(purpose)) + unfinished(activeVisionSteps) +
    unfinished(identitySteps(identity)) + unfinished(valuesSteps));
}

export function a2RemainingMinutes(state: any): number {
  return [4, 4, 3].reduce((sum, total, i) => {
    const mirror = state?.[`m${i + 1}`];
    if (mirror?.claimed) return sum;
    const reached = typeof mirror?.maxReached === "number" ? mirror.maxReached : 1;
    return sum + 10 * (total - Math.max(0, Math.min(total - 1, reached - 1)));
  }, 0);
}

export function remainingTimeLabel(minutes: number): string {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return `~${[hours ? `${hours} ${hours === 1 ? "hr" : "hrs"}` : "", rest ? `${rest} min` : ""]
    .filter(Boolean).join(" ")} remaining`;
}
