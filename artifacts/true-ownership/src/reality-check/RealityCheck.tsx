import React, { useEffect, useRef, useState, type ReactNode, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { isDevPreview } from "../devPreview";
import { costSummary, loadRCState, rcReady, RC_LABEL, saveRCState, type RCState } from "../rcConstants";
import { RealityCheckScreens, RCVideo } from "./RealityCheckScreens";
import "./reality-check.css";

const STAGES = ["Look", "Name it", "The cost", "Two futures", "Choose"];
const ROWS = [
  "How much you own Self, Time and Wealth right now, and what isn't working.",
  "What you've been doing about it: avoiding, blaming, carrying, blindly hoping.",
  "What staying here is costing you in money, hours and you.",
  "A year from now if nothing changes, and if you own it.",
  "Which future you're ready to build.",
];
type VeilPhase = "rising" | "hold" | "falling" | "idle";
export function RealityCheck({
  room, resume, onEnter, onClose, onEntryHall, devTools, Veil, timing,
}: {
  room: boolean; resume: boolean; onEnter: () => void; onClose: () => void;
  onEntryHall: () => void; devTools: ReactNode;
  Veil: ComponentType<{ phase: VeilPhase; text: string }>;
  timing: { holdAt: number; fallingAt: number; idleAt: number };
}) {
  const [state, setState] = useState(loadRCState);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<VeilPhase>("idle");
  const wasRoom = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const update = (next: RCState) => {
    try { saveRCState(next); setState(next); setError(""); }
    catch { setError("Your answer could not be saved. Please free browser storage and try again."); }
  };
  useEffect(() => {
    const entered = room && !wasRoom.current;
    wasRoom.current = room;
    if (!entered) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    if (resume) return () => previous?.focus();
    setPhase("rising");
    const timers = [
      window.setTimeout(() => setPhase("hold"), timing.holdAt),
      window.setTimeout(() => setPhase("falling"), timing.fallingAt),
      window.setTimeout(() => setPhase("idle"), timing.idleAt),
    ];
    return () => { timers.forEach(window.clearTimeout); previous?.focus(); };
  }, [room, resume, timing]);
  const stage = state.step <= 3 ? 0 : state.step - 3;
  const forward = state.step === 1 ? "I've pictured both →" : state.step === 2
    ? state.focus ? `Start with ${RC_LABEL[state.focus]} →` : "Choose an area →"
    : state.step === 3 ? "Continue to Name it →" : state.step === 4 ? "Continue to The cost →" : "Continue to Two futures →";
  const advance = () => {
    if (!rcReady(state) && !isDevPreview()) return;
    update({ ...state, step: Math.min(6, state.step + 1),
      looked: state.step === 3 && state.focus ? [...new Set([...state.looked, state.focus])] : state.looked });
  };
  const summary = costSummary(state.cost);
  return <div className="na1-root rc-root">
    <main className="rc-hub">
      {devTools && <details className="rc-dev-tools"><summary>DEV tools</summary>{devTools}</details>}
      <div className="na1-breadcrumb"><button onClick={onEntryHall}>Entry Hall</button><span>›</span><span>Start here</span></div>
      <p className="rc-eyebrow">START HERE · THE REALITY CHECK</p><h1>Before you start, a reality check.</h1>
      <p className="rc-hub-lead">Where you are now, and where it leads. Two futures are in front of you. Which one you live depends on what you decide today.</p>
      <div className="rc-hub-action">
        <button className="na1-btn-gold rc-begin" onClick={() => {
          const next = { ...state, startedAt: state.startedAt ?? new Date().toISOString() };
          try { saveRCState(next); setState(next); setError(""); onEnter(); }
          catch { setError("Your Reality Check could not be saved. Please try again."); }
        }}>{state.complete ? "Review" : "Begin"} the Reality Check →</button>
        <p className="rc-helper">Free · about 10 minutes · saved as you go.</p>
      </div>
      <div className="rc-hub-grid"><section>
        {STAGES.map((stageName, i) => <div className="rc-hub-row" key={stageName}><span>{i + 1}</span><div><h3>{stageName}</h3><p>{ROWS[i]}</p></div></div>)}
      </section><aside><RCVideo /><blockquote>Those two futures are real. One of them is where you're headed right now if nothing changes, and the other is what you could be.</blockquote></aside></div>
      {error && <p role="alert">{error}</p>}
    </main>
    {room && createPortal(<div className="na1-room-overlay na1-a4-overlay is-open rc-overlay">
      <div ref={dialogRef} className="na1-room-card rc-room" role="dialog" aria-modal="true" aria-label="The Reality Check" data-step={state.step}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
          if (e.key === "Tab") {
            const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,summary,[tabindex="0"]') ?? []).filter(el => el.getClientRects().length);
            if (!items.length) return;
            if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
          }
        }}>
        <header className="rc-room-header"><div className="rc-crumb">The Reality Check › {STAGES[stage]}{state.focus ? ` › ${RC_LABEL[state.focus]}` : ""}</div><button ref={closeRef} aria-label="Close Reality Check" onClick={onClose}>×</button></header>
        <ol className="rc-stepper">{STAGES.map((label, i) => <li key={label} className={i < stage ? "is-done" : i === stage ? "is-current" : ""} aria-current={i === stage ? "step" : undefined}>{label}</li>)}</ol>
        <div className="rc-pips" aria-label={state.step === 6 ? "Next section placeholder" : `Screen ${state.step} of 5`}>
          {[1, 2, 3, 4, 5].map(n => <button key={n} aria-label={`Screen ${n}`} aria-current={state.step === n ? "step" : undefined} disabled={!isDevPreview()} onClick={() => update({ ...state, step: n })} className={n <= state.step ? "is-done" : ""} />)}
        </div>
        <div className="rc-screen" key={state.step}><RealityCheckScreens state={state} update={update} /></div>
        {state.step === 5 && <div className={`rc-summary ${summary ? "has-summary" : ""}`} aria-live="polite">{summary && <p>{summary}</p>}<em>This isn't blame. It's the diagnosis. And it can change.</em></div>}
        {error && <p role="alert">{error}</p>}
        <footer className="rc-footer"><button onClick={() => state.step === 1 ? onClose() : update({ ...state, step: state.step - 1 })}>← Back</button>
          {state.step < 6 ? <button className="na1-btn-gold" disabled={!rcReady(state) && !isDevPreview()} onClick={advance}>{forward}</button>
            : <button className="na1-btn-gold" onClick={onClose}>Back to Reality Check →</button>}</footer>
      </div>
    </div>, document.body)}
    {room && phase !== "idle" && <Veil phase={phase} text="Looking at where you are…" />}
  </div>;
}
