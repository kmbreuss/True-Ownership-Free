import { useEffect, useRef, useState } from "react";
import { isDevPreview } from "../devPreview";
import type { JourneySnapshot } from "./progress";

export type StepNotice = { id: string; text: string; group: string };
export function useStepMoments(snapshot: JourneySnapshot) {
  const rcComplete = snapshot.bricks.filter(b => b.group === "rc").every(b => b.done);
  const seen = useRef(new Set(snapshot.bricks.filter(b => b.done).map(b => b.id)));
  const completedRC = useRef(rcComplete);
  const preview = useRef(isDevPreview());
  const [queue, setQueue] = useState<StepNotice[]>([]);
  const [newest, setNewest] = useState<string>();
  useEffect(() => {
    const inPreview = isDevPreview();
    if (inPreview || preview.current !== inPreview) {
      seen.current = new Set(snapshot.bricks.filter(b => b.done).map(b => b.id));
      completedRC.current = rcComplete;
      preview.current = inPreview;
      setQueue([]); setNewest(undefined);
      return;
    }
    const added = snapshot.bricks.filter(b => b.done && !seen.current.has(b.id));
    added.forEach(b => seen.current.add(b.id));
    if (added.length) setNewest(added.at(-1)!.id);
    const next: StepNotice[] = [];
    if (rcComplete && !completedRC.current) next.push({
      id: "rc:complete", group: "rc",
      text: `Reality Check done. ${snapshot.count} steps on your road.`,
    });
    completedRC.current = rcComplete;
    // A claim can prove previously unrecorded/optional work in one batch.
    // Celebrate the actual last action once, not a burst of inferred history.
    const mirrors = new Set(added.filter(b => b.group !== "rc").map(b => b.mirror));
    mirrors.forEach(mirror => {
      const brick = added.filter(b => b.mirror === mirror).at(-1)!;
      next.push({ id: brick.id, text: brick.moment, group: brick.group });
    });
    if (next.length) setQueue(old => [...old, ...next]);
  }, [snapshot]);
  const active = queue[0];
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setQueue(old => old.slice(1)), 4000);
    return () => window.clearTimeout(timer);
  }, [active]);
  return { active, newest };
}

export function StepMoment({ notice }: { notice?: StepNotice }) {
  return notice ? <aside className="jr-moment" role="status" aria-live="polite" key={notice.id}>
    <p className="jr-eyebrow">+1 STEP ON YOUR ROAD</p>
    <p className="jr-moment-words">{notice.text}</p>
    <p className="jr-moment-end">Future B is a little brighter.</p>
  </aside> : null;
}
