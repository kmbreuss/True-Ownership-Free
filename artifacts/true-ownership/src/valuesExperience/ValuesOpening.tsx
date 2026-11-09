import type { ReactNode } from "react";
import { M4_ROOMS, m4RoomDone, type Mirror4State } from "../mirror4Constants";
import "./values-experience.css";
type M4Room = (typeof M4_ROOMS)[number];

export const VALUES_PARTS = [
  { name: "Notice", keys: ["admire", "irks", "portrait"], line: "what lights you up and what you can't stand", minutes: 7 },
  { name: "Flip", keys: ["flip"], line: "turn what you can't stand into what you stand for", minutes: 5 },
  { name: "Name", keys: ["name"], line: "the standard underneath", minutes: 6 },
  { name: "Order", keys: ["rank", "claim"], line: "which one wins when they clash", minutes: 5 },
] as const;

export function ValuesProgress({ roomKey, state, onOpen }: { roomKey: string; state: Mirror4State; onOpen?: (key: string) => void }) {
  const current = VALUES_PARTS.findIndex(p => (p.keys as readonly string[]).includes(roomKey));
  return <nav className="vx-progress" aria-label="Values progress">{VALUES_PARTS.map((p, i) => {
    const done = state.claimed || p.keys.every(k => m4RoomDone(state, k));
    return <button type="button" key={p.name} className={i === current ? "is-current" : done ? "is-done" : ""}
      onClick={() => onOpen?.(p.keys[0])}>
      <span aria-hidden="true" /><small>{p.name}</small>
    </button>;
  })}</nav>;
}

export function ValuesOpening({ state, canOpen, onOpen, onBack, onVideo, video, futureB }: {
  state: Mirror4State; canOpen: (room: M4Room) => boolean; onOpen: (room: M4Room) => void;
  onBack: () => void; onVideo: () => void; video: ReactNode; futureB: boolean;
}) {
  const next = M4_ROOMS.find(r => canOpen(r) && !r.comingSoon && !m4RoomDone(state, r.key));
  const active = state.claimed ? -1 : VALUES_PARTS.findIndex(p => (p.keys as readonly string[]).includes(next?.key ?? ""));
  const finding = (i: number) => {
    if (state.claimed) return "Claimed";
    if (i === 0) return `★ ${state.admire.filter(b => b.source !== "flipped").length + state.irks.length} behaviors noticed`;
    if (i === 1) return "Irks explored";
    if (i === 2) return `${state.clusters.filter(c => c.userName.trim()).length} standards named`;
    return "Claimed";
  };
  return <section className="vx-opening">
    <div className="vx-eyebrow">A1 · Mirror 1 · Values</div>
    <h1>What do you stand for?</h1>
    <p className="vx-opening-lead">Four stops. You can pause between any two and pick up right where you left off.</p>
    <ol className="vx-trail" style={{ "--vx-position": state.claimed ? 3 : Math.max(0, active) } as React.CSSProperties}>
      {VALUES_PARTS.map((p, i) => {
        const done = state.claimed || p.keys.every(k => m4RoomDone(state, k));
        const rooms = M4_ROOMS.filter(r => (p.keys as readonly string[]).includes(r.key));
        const target = rooms[0];
        return <li key={p.name} className={`${done ? "is-done" : ""} ${i === active ? "is-current" : ""}`}>
          <button type="button" className="vx-stop" onClick={() => target && onOpen(target)}>
            <span className="vx-stop-circle">{done ? "✓" : i + 1}</span><strong>{p.name}</strong>
            <em>{p.line}</em>
            <small>{done ? <span className="vx-finding">{finding(i)}</span> : `${i === active ? "You are here · " : ""}about ${p.minutes} minutes`}</small>
          </button>
        </li>;
      })}
    </ol>
    {futureB && <p className="vx-thread"><span>●</span> Future B needs you to know what you won't trade.</p>}
    {video}
    <div className="vx-opening-actions">
    <footer className="vx-opening-footer">
      <button type="button" className="na1-btn-ghost" onClick={onVideo}>▶ Watch Katherine</button>
      <button type="button" className="na1-btn-gold" onClick={() => {
        const target = state.claimed ? M4_ROOMS.find(canOpen) : next;
        if (target) onOpen(target);
      }}>{state.claimed ? "Revisit →" : `Continue with ${VALUES_PARTS[active]?.name ?? "Notice"} →`}</button>
    </footer>
    <button type="button" className="vx-back-link" onClick={onBack}>← Back to A1</button>
    </div>
  </section>;
}
