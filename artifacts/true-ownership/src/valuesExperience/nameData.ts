import type { M4Behavior, Mirror4State } from "../mirror4Constants";

/** Presentation order only: never reorder the persisted admire array. */
export function unplacedNameBehaviors(state: Mirror4State): M4Behavior[] {
  const unplaced = state.admire.filter(b => b.inUseByCluster == null);
  return [
    ...unplaced.filter(b => b.source !== "flipped" && b.tier === "lights"),
    ...unplaced.filter(b => b.source !== "flipped" && b.tier !== "lights"),
    ...unplaced.filter(b => b.source === "flipped"),
  ];
}

export function nameBehaviorLabel(state: Mirror4State, behavior: M4Behavior): string {
  if (behavior.source !== "flipped") return behavior.tier === "lights" ? "★ LIGHTS ME UP" : "WARMS ME";
  const irk = state.irks.find(b => `af-${b.id}` === behavior.id);
  return irk ? `FLIPPED FROM "${irk.text}"` : "FLIPPED FROM AN IRK";
}

export function standardName(state: Mirror4State, id: string): string {
  const index = state.clusters.findIndex(c => c.id === id);
  return state.clusters[index]?.userName.trim() || `Standard ${index + 1}`;
}

export function behaviorCount(count: number): string {
  return `${count} ${count === 1 ? "behavior" : "behaviors"}`;
}
