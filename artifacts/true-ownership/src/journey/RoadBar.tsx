import { ROAD_GROUPS, type JourneySnapshot } from "./progress";

export function RoadBar({ snapshot, current, mirror, onOpen, newestGroup }: {
  snapshot: JourneySnapshot; current: string; mirror: string; onOpen: () => void; newestGroup?: string;
}) {
  return <button className="jr-phone-bar" type="button" onClick={onOpen} aria-label={`Open your full road: ${snapshot.count} steps finished`}>
    <span className="jr-phone-head"><span>YOU · {current.toUpperCase()}{mirror ? ` · ${mirror}` : ""}</span><span>FUTURE B ★</span></span>
    <span className="jr-phone-segments">{ROAD_GROUPS.map(group => {
      const count = snapshot.bricks.filter(b => b.group === group.id && b.done).length;
      return <span className={`jr-phone-segment ${newestGroup === group.id ? "is-newest" : ""}`} key={group.id}
        aria-label={`${group.short}: ${count} of ${group.total}`} data-road-group={group.id}>
        <span className="jr-segment-track"><span style={{ width: `${100 * count / group.total}%` }} /></span>
        <span className={current === group.id ? "is-current" : ""}>{group.short}</span>
      </span>;
    })}</span>
  </button>;
}
