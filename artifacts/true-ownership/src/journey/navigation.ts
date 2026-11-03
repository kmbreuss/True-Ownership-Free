import { groupForView, ROAD_GROUPS, type RoadGroup } from "./progress";

export type RoadNavigationItem = {
  id: RoadGroup;
  label: string;
  accessibleLabel: string;
  destination: string | null;
  isCurrent: boolean;
  status: string | null;
};

/** Same destinations and feature gates as NewA1Spine; navigation still uses its guarded router. */
export function spineNavigation({ view, complete, a2Enabled, a3Enabled, freeLocked, returning }: {
  view: string;
  complete: Record<RoadGroup, boolean>;
  a2Enabled: boolean;
  a3Enabled: boolean;
  freeLocked: boolean;
  returning: boolean;
}): RoadNavigationItem[] {
  const destinations: Record<RoadGroup, string | null> = {
    rc: "rc", a1: "grid", a2: a2Enabled ? "a2" : null,
    a3: a3Enabled ? "a3" : null, a4: "a4", a5: "a5",
  };
  return ROAD_GROUPS.map(group => {
    const isCurrent = groupForView(view) === group.id;
    return {
      id: group.id, label: group.label,
      accessibleLabel: `Go to ${group.label.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase())}`,
      destination: destinations[group.id], isCurrent,
      status: group.id !== "rc" && freeLocked ? "Unlocks when you join"
        : group.id === "rc" && !isCurrent && !complete.rc && returning ? "Start here · New"
        : isCurrent ? "You are here"
        : complete[group.id] ? group.id === "rc" ? "Complete" : "Claimed" : null,
    };
  });
}
