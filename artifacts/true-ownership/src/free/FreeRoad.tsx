import { useState } from "react";
import type { RCState } from "../rcConstants";

export const STOPS = [
  ["A1", "All In", "Know who you are, so the next yes is easy."],
  ["A2", "Align", "See where your time and money really go."],
  ["A3", "Advocate", "Surround yourself with what lifts you."],
  ["A4", "Act", "Know your next move. Small, specific, yours."],
  ["A5", "Accountable", "Trust yourself again, week after week."],
] as const;

export function RoadAhead() {
  return <ol className="free-road-ahead">
    <li className="is-done"><span aria-hidden="true">●</span><div><small className="free-status">✓ REALITY CHECK · DONE</small><p>You saw where you are, and you chose.</p></div></li>
    {STOPS.map(([id, name, outcome]) => <li key={id}><span aria-hidden="true">◌</span><div><small className="free-status">{id} · {name.toUpperCase()}</small><p>{outcome}</p></div></li>)}
    <li><span className="free-star" aria-hidden="true">★</span><small className="free-status">YOUR FUTURE B</small></li>
  </ol>;
}

export function FreeRoad({ state, onEnding, compact = false }: { state: RCState; onEnding: () => void; compact?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const earned = state.complete || state.rounds.some(r => r.complete)
    ? 14 : state.startedAt ? Math.max(1, Math.min(13, (state.maxReached ?? state.step) + 1)) : 0;
  return <aside className="free-road" aria-label="Your road to Future B">
    <p className="free-road-label">STEP 1 OF YOUR ROAD{state.complete ? " · DONE" : ""}<span>★</span></p>
    <div className="free-road-segments">
      <button aria-label="Reality Check progress" onClick={() => setSelected(selected === -1 ? null : -1)}>
        <span className="free-rc-bricks">{Array.from({ length: 14 }, (_, i) => <i key={i} className={i < earned ? "earned" : ""} />)}</span><small>✓ RC</small>
      </button>
      {STOPS.map(([id, name], i) => <button key={id} aria-label={`${id} ${name}, locked`} onClick={() => setSelected(selected === i ? null : i)}>
        <span className="free-locked-segment" /><small><span aria-hidden="true">🔒</span> {id}</small>
      </button>)}
      <span className="free-star" aria-label="Future B">★</span>
    </div>
    {selected !== null && <div className="free-stage-detail" role="status">
      <button className="free-detail-close" aria-label="Close road detail" onClick={() => setSelected(null)}>×</button>
      {selected === -1 ? <><strong>Reality Check</strong><p>{earned} of 14 steps</p>{state.complete && !compact && <button onClick={onEnding}>Your Future B and waitlist →</button>}</> :
        <><strong>{STOPS[selected][0]} · {STOPS[selected][1]}</strong><p>{STOPS[selected][2]}</p><small>Opens soon</small></>}
    </div>}
    <div className="free-desktop-road" aria-label="The bigger path" hidden={compact}>
      <p className="free-star">★</p><p className="free-road-destination">YOUR FUTURE B</p>
      <svg viewBox="0 0 230 450" aria-hidden="true">
        <defs><mask id="free-road-earned">
          <path d="M60 425 C60 370 190 395 174 322" fill="none" stroke="white" strokeWidth="20" pathLength="14" strokeDasharray={`${earned} 14`}/>
        </mask></defs>
        <path d="M60 425 C60 370 190 395 174 322 S35 268 65 210 S175 160 148 104 S110 62 125 20" fill="none" stroke="var(--free-line)" strokeWidth="15" strokeDasharray="3 4"/>
        {earned > 0 && <path d="M60 425 C60 370 190 395 174 322" fill="none" stroke="var(--na1-gold)" strokeWidth="15" strokeDasharray=".75 .25" pathLength="14" mask="url(#free-road-earned)"/>}
      </svg>
      <div className="free-desktop-stops">{[...STOPS].reverse().map(([id, name, outcome]) => <button key={id} onClick={() => setSelected(STOPS.findIndex(stop => stop[0] === id))}><small>{id} · {name.toUpperCase()}</small><em>{outcome}</em><span>Opens soon</span></button>)}</div>
      <small className="free-desktop-now">● REALITY CHECK · YOU ARE HERE</small>
    </div>
  </aside>;
}
