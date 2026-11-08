import { useEffect, useRef, useState } from "react";
import { ROAD_GROUPS, type JourneySnapshot } from "./progress";

const TIP_KEY = "to_road_phone_tip_seen_v1";
let tipSeenThisSession = false;

export function RoadBar({ snapshot, current, onOpen, newestGroup }: {
  snapshot: JourneySnapshot; current: string; onOpen: () => void; newestGroup?: string;
}) {
  const currentStage = ROAD_GROUPS.find(group => group.id === current);
  const currentLabel = currentStage?.label.replace(" · ", " ") ?? current.toUpperCase();
  const [showTip, setShowTip] = useState(false);
  const tipDeadline = useRef(0);
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 899.98px)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const showOnPhone = () => {
      if (!phone.matches) {
        setShowTip(false);
        clearTimeout(timer);
        tipDeadline.current = 0;
        return;
      }
      // React's development effect replay must not cancel the dismissal timer.
      if (tipDeadline.current > Date.now()) {
        timer = setTimeout(() => setShowTip(false), tipDeadline.current - Date.now());
        return;
      }
      if (tipSeenThisSession) return;
      try {
        if (localStorage.getItem(TIP_KEY)) { tipSeenThisSession = true; return; }
      } catch { /* Storage can be unavailable; still show once this session. */ }
      tipSeenThisSession = true;
      try { localStorage.setItem(TIP_KEY, "1"); } catch { /* No account storage fallback. */ }
      setShowTip(true);
      tipDeadline.current = Date.now() + 6000;
      timer = setTimeout(() => setShowTip(false), 6000);
    };
    showOnPhone();
    phone.addEventListener("change", showOnPhone);
    return () => { clearTimeout(timer); phone.removeEventListener("change", showOnPhone); };
  }, []);
  return <>
  <button className="jr-phone-bar" type="button" onClick={() => { tipDeadline.current = 0; setShowTip(false); onOpen(); }}
    aria-describedby={showTip ? "jr-phone-tip" : undefined} aria-label={`Open your full road: ${snapshot.count} steps finished`}>
    <span className="jr-phone-head"><span>YOU ARE HERE · {currentLabel}</span><span className="jr-phone-head-right"><span>Road ▾</span></span></span>
    <span className="jr-phone-segments">{ROAD_GROUPS.map(group => {
      const count = snapshot.bricks.filter(b => b.group === group.id && b.done).length;
      return <span className={`jr-phone-segment ${current === group.id ? "is-current" : ""} ${count ? "has-progress" : ""} ${newestGroup === group.id ? "is-newest" : ""}`} key={group.id}
        aria-label={`${group.short}: ${count} of ${group.total}`} data-road-group={group.id}>
        <span className="jr-segment-track"><span style={{ width: `${100 * count / group.total}%` }} /></span>
        <span className={current === group.id ? "is-current" : ""}>{current === group.id ? `● ${group.short}` : group.short}</span>
      </span>;
    })}<span className="jr-phone-destination" aria-label="Future B">★</span></span>
  </button>
  {showTip && <p className="jr-phone-tip" id="jr-phone-tip" role="status">Tap your road to see your progress or jump to any step.</p>}
  </>;
}
