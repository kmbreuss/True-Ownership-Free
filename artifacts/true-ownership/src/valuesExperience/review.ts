import type { Mirror4State } from "../mirror4Constants";

/** Review edits may change answers, never the saved completion/claim state. */
export function preserveValuesCompletion(before: Mirror4State, after: Mirror4State): Mirror4State {
  return {
    ...after,
    status: before.status,
    currentStep: before.currentStep,
    claimed: before.claimed,
    claimedAt: before.claimedAt,
    discoverSections: before.discoverSections,
    pressureTest: { ...after.pressureTest, complete: before.pressureTest.complete },
  };
}
