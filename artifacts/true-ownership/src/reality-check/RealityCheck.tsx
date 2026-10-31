import React, { useEffect, useRef, useState, type ReactNode, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { isDevPreview } from "../devPreview";
import { loadRCState, rcReady, RC_LABEL, RC_DEFAULT_LABEL, rcNumber, saveRCState, type RCState } from "../rcConstants";
import { RealityCheckScreens } from "./RealityCheckScreens";
import { RCStartVideo } from "./RCStartVideo";
import { RCDevReset } from "./RCDevReset";
import { RealityCheckFutures } from "./RealityCheckFutures";
import { persistRCCompletion, redoDue, startRedo, lastTimeWords } from "./rcJourney";
import { useRCAccess } from "./access";
import "./reality-check.css";
import "./rc-polish.css";

const STAGES = ["The mirror", "A Tuesday", "The price", "Two futures", "Choose"];
const ROWS = [
  "What you've been telling yourself.",
  "What it actually feels like.",
  "What it's costing you in money, hours and you.",
  "Where it goes if nothing changes, and if you own it.",
  "Which future you're ready to build.",
];
type VeilPhase = "rising" | "hold" | "falling" | "idle";
export function RealityCheck({
  room, resume, onEnter, onClose, onEntryHall, onBeginA1, devTools, Veil, timing,
}: {
  room: boolean; resume: boolean; onEnter: () => void; onClose: () => void;
  onEntryHall: () => void; onBeginA1: () => void; devTools: ReactNode;
  Veil: ComponentType<{ phase: VeilPhase; text: string }>;
  timing: { holdAt: number; fallingAt: number; idleAt: number };
}) {
  const [state, setState] = useState(loadRCState);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<VeilPhase>("idle");
  const [burst, setBurst] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [join, setJoin] = useState(false);
  const access = useRCAccess();
  const wasRoom = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const update = (next: RCState) => {
    next = { ...next, maxReached: Math.max(state.maxReached ?? state.step, next.step, state.complete ? 13 : 0) };
    try { saveRCState(next); setState(next); setError(""); return true; }
    catch { setError("Your answer could not be saved. Please free browser storage and try again."); return false; }
  };
  const act = (next: RCState, complete = false, celebrate = false) => {
    if (!complete) { update(next); return; }
    if (!isDevPreview() && (!next.focus || next.mirror.length < 3 || !next.tuesday.trim() || !next.futureB5.tuesday.trim() || !next.futureB1.oneThing.trim())) {
      setError("Please finish your mirror, Tuesday and Future B answers before continuing."); return;
    }
    try {
      const finished = persistRCCompletion(next);
      setState(finished); setError("");
      if (celebrate && !state.complete) setBurst(true);
    } catch { setError("Your Reality Check could not finish saving. Your answers are still here. Please try again."); }
  };
  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(false), 2100);
    return () => window.clearTimeout(timer);
  }, [burst]);
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
  const stage = state.step <= 2 ? 0 : state.step === 3 ? 1 : state.step === 4 ? 2 : state.step <= 9 ? 3 : 4;
  const sceneGroups = [[0, 1, 2], [3], [4], [5, 6, 7, 8, 9], [10, 11, 12, 13]];
  const preview = isDevPreview();
  const forward = state.step === 0 ? "I'm ready →" : state.step === 1 ? "Show me what I see →" : state.step === 2
    ? state.focus ? `Start with ${RC_LABEL[state.focus]} →` : "Choose an area →"
    : state.step === 3 ? "Show me the price →" : state.step === 4 ? "Close your eyes →"
    : state.step === 5 ? "Show me →" : state.step === 6 ? "Keep going →" : state.step === 7 ? "And if you own it? →"
    : state.step === 8 ? "Bring it back to one year →" : "Choose →";
  const advance = () => {
    if (!rcReady(state) && !isDevPreview()) return;
    update({ ...state, step: Math.min(13, state.step + 1) });
  };
  const thread = [
    state.focus ? RC_LABEL[state.focus] : "",
    state.topDefaults.map(d => RC_DEFAULT_LABEL[d]).join(" and "),
    state.tuesday.trim().split(/\s+/).slice(0, 6).join(" "),
    [state.cost.monthly !== null ? `$${rcNumber(state.cost.monthly)}` : "",
      state.cost.hoursPerWeek !== null ? `${rcNumber(state.cost.hoursPerWeek)} hrs` : ""].filter(Boolean).join(" · "),
  ].filter(Boolean);
  return <div className="na1-root rc-root">
    <main className="rc-hub">
      {devTools && <details className="rc-dev-tools"><summary>DEV tools</summary>{devTools}{import.meta.env.DEV && <RCDevReset />}</details>}
      <div className="na1-breadcrumb"><button onClick={onEntryHall}>Entry Hall</button><span>›</span><span>Start here</span></div>
      <div className="rc-start-top">
      <div className="rc-start-copy"><p className="rc-eyebrow">START HERE · THE REALITY CHECK</p><h1>Before you start, a reality check.</h1>
      <p className="rc-hub-lead">Where you are now, and where it leads. Two futures are in front of you.</p>
      <p className="rc-hub-lead"><em>Which one you live depends on what you decide today.</em></p></div>
      <RCStartVideo />
      <div className="rc-hub-action">
        <button className="na1-btn-gold rc-begin" onClick={() => {
          const next = { ...state, step: state.complete ? 1 : state.step, startedAt: state.startedAt ?? new Date().toISOString() };
          try { saveRCState(next); setState(next); setError(""); onEnter(); }
          catch { setError("Your Reality Check could not be saved. Please try again."); }
        }}>{state.complete ? "Review the Reality Check →" : state.startedAt ? "Continue →" : "Begin the Reality Check →"}</button>
        <p className="rc-helper">About 10 minutes · just you · saved as you go</p>
      </div>
      </div>
      {savedMessage && <p role="status">Your Reality Check is saved. Come back when you're ready.</p>}
      {redoDue(state) && <div className="rc-redo"><p>It's been 90 days. Ready to look again? Your previous words will stay with you.</p><button onClick={() => {
        if (update(startRedo(state))) { setSavedMessage(false); onEnter(); }
      }}>Begin a new Reality Check →</button></div>}
      <section className="rc-journey"><p className="rc-eyebrow">YOUR JOURNEY · FIVE STEPS</p>
        <ol>{STAGES.map((stageName, i) => <li key={stageName}><span className={`rc-stop rc-stop-${i + 1}`}>{i + 1}</span><h3>{stageName}</h3><p><em>{ROWS[i]}</em></p></li>)}</ol>
      </section>
      <blockquote className="rc-closing-quote">Those two futures are real. One is where you're headed if nothing changes. The other is what you could be.</blockquote>
      {error && <p role="alert">{error}</p>}
    </main>
    {room && createPortal(<div className="na1-room-overlay na1-a4-overlay is-open rc-overlay">
      <div ref={dialogRef} className={`na1-room-card rc-room ${state.step === 5 ? "rc-deepwater" : state.step === 6 ? "rc-road-a" : state.step === 7 ? "rc-road-a rc-road-a-deeper" : [8, 9, 12, 13].includes(state.step) ? "rc-warm" : ""}`} role="dialog" aria-modal="true" aria-label="The Reality Check" data-step={state.step}
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
        <ol className="rc-stepper">{STAGES.map((label, i) => <li key={label} className={i < stage ? "is-done" : i === stage ? "is-current" : ""} aria-current={i === stage ? "step" : undefined}><button disabled={!preview && !state.complete && sceneGroups[i][0] > (state.maxReached ?? state.step)} onClick={() => { setJoin(false); update({ ...state, step: sceneGroups[i][0] }); }}>{label}</button></li>)}</ol>
        {state.step >= 6 && state.step <= 9 && <div className={`rc-future-banner ${state.step <= 7 ? "is-a" : "is-b"}`}>FUTURE {state.step <= 7 ? "A · If nothing changes" : "B · If you own it"}</div>}
        <div className="rc-pips" aria-label={`Scene ${state.step + 1} of 14`}>
          {sceneGroups[stage].map(n => <button key={n} aria-label={`Scene ${n}`} aria-current={state.step === n ? "step" : undefined} disabled={!preview} onClick={() => { setJoin(false); update({ ...state, step: n }); }} className={n <= state.step ? "is-done" : ""} />)}
        </div>
        {state.rounds.length > 0 && <details className="rc-last-time" key={`last-${state.step}`}><summary>Last time you said…</summary><p>{lastTimeWords(state.rounds[state.rounds.length - 1], state.step).split(/\s+/).slice(0, 38).join(" ")}{lastTimeWords(state.rounds[state.rounds.length - 1], state.step).split(/\s+/).length > 38 ? "…" : ""}</p></details>}
        {(state.step === 3 || state.step === 4) && <div className="rc-thread" aria-label="Your thread"><span className="rc-thread-label">YOUR THREAD</span>{thread.map((word, i) => <span className="rc-thread-chip" key={i} title={word}>{i === 2 ? <em>{word}</em> : word}</span>)}</div>}
        <div className="rc-screen" key={`${state.step}-${join}`}>
          {join ? <div className="rc-scene"><p className="rc-eyebrow">TRUE OWNERSHIP™</p><h2>Start building Future B.</h2><p>Joining will be available here. Everything you wrote is saved.</p><p>[YOUR PRICE] · everything you wrote today comes with you.</p></div>
            : state.step < 5 ? <RealityCheckScreens state={state} update={update} />
            : <RealityCheckFutures state={state} update={update} act={act} closeSaved={() => { setSavedMessage(true); onClose(); }} />}
        </div>
        {error && <p role="alert">{error}</p>}
        <footer className="rc-footer"><button onClick={() => join ? setJoin(false) : state.step === 0 ? onClose() : update({ ...state, step: state.step - 1 })}>← Back</button>
          {state.step < 10 && <button className="na1-btn-gold" disabled={!rcReady(state) && !preview} onClick={advance}>{forward}</button>}
          {state.step === 13 && !join && <div className="rc-final-cta"><button className="na1-btn-gold" disabled={!state.complete && !preview} onClick={() => access === "free" ? setJoin(true) : onBeginA1()}>{access === "free" ? "Start building Future B →" : "Begin A1 · All In →"}</button><small>{access === "free" ? "True Ownership™ · [YOUR PRICE] · everything you wrote today comes with you." : "About 20 minutes · your Future B goes with you."}</small></div>}
        </footer>
      </div>
    </div>, document.body)}
    {room && phase !== "idle" && <Veil phase={phase} text="Looking at where you are…" />}
    {room && burst && <div className="na1-gold-burst" aria-hidden="true"><div className="na1-gold-burst-inner" /></div>}
  </div>;
}
