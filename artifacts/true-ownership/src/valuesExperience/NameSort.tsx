import { useEffect, useRef, useState } from "react";
import type { Mirror4State } from "../mirror4Constants";
import { NameCreate } from "./NameCreate";
import { behaviorCount, nameBehaviorLabel, standardName, unplacedNameBehaviors } from "./nameData";

type Props = {
  state: Mirror4State;
  onPlace: (behaviorId: string, clusterId: string) => void;
  onCreate: (name: string, behaviorId: string) => void;
  onBack: () => void;
};

export function NameSort({ state, onPlace, onCreate, onBack }: Props) {
  const pool = unplacedNameBehaviors(state);
  const [queue, setQueue] = useState(() => pool.map(b => b.id));
  const initialCount = useRef(pool.length);
  const pending = [
    ...queue.filter(id => pool.some(b => b.id === id)),
    ...pool.map(b => b.id).filter(id => !queue.includes(id)),
  ];
  const behavior = pool.find(b => b.id === pending[0]);
  const [creating, setCreating] = useState(false);
  const [glowing, setGlowing] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const skip = () => {
    setCreating(false);
    setQueue(pending.length > 1 ? [...pending.slice(1), pending[0]!] : pending);
  };
  if (!behavior) return null;
  const total = Math.max(initialCount.current, pending.length);
  return <div className="vxnc-layout vxnc-sort" data-name-moment="sort">
    <div className="vxnc-sort-body">
      <div className="vx-eyebrow" aria-live="polite">
        BEHAVIOR {total - pending.length + 1} OF {total} · WHERE DOES THIS BELONG?
      </div>
      <article className="vxnc-behavior" key={behavior.id} data-behavior-id={behavior.id}>
        <div className={`vxnc-strength${behavior.source === "flipped" ? " is-flipped" : ""}`}>
          {nameBehaviorLabel(state, behavior)}
        </div>
        <p>{behavior.text}</p>
      </article>
      <p className="vxnc-helper">{state.clusters.length
        ? "Same standard, or a new one?"
        : "You don’t have any standards yet. Start one with this behavior. What does it point to?"}</p>
      <div className="vxnc-tiles" aria-label="Place this behavior">
        {state.clusters.map(cluster => <button type="button" key={cluster.id}
          data-standard-id={cluster.id} className={`vxnc-tile${glowing === cluster.id ? " is-glowing" : ""}`}
          onClick={() => {
            setGlowing(cluster.id);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setGlowing(null), 420);
            setCreating(false);
            onPlace(behavior.id, cluster.id);
          }}>
          <strong>{standardName(state, cluster.id)}</strong>
          <span>{behaviorCount(cluster.behaviorIds.length)}</span>
        </button>)}
        {!state.clusters.length && !creating && <button type="button" className="vxnc-tile vxnc-new" onClick={() => setCreating(true)}>
          + Name your first standard
        </button>}
      </div>
      {creating ? <NameCreate key={behavior.id} suggestions={[...new Set(state.clusters.flatMap(c => c.proposedNames))]}
        onCancel={() => setCreating(false)} onCreate={name => {
        setCreating(false);
        onCreate(name, behavior.id);
      }} /> : <div className="vxnc-sort-links">
        {state.clusters.length > 0 && <button type="button" onClick={() => setCreating(true)}>+ New standard</button>}
        <button type="button" className="vxnc-skip" onClick={skip}>Skip for now</button>
      </div>}
    </div>
    <footer className="na1-m4-disc-foot">
      <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>
      <button type="button" className="na1-m4-continue" onClick={skip}>{state.claimed ? "Next →" : "Next behavior →"}</button>
    </footer>
  </div>;
}
