import React, { useEffect, useRef } from "react";
import type { EndSummary } from "./summary";
import { WeeklyNotice } from "./WeeklyNotice";
import { Claimed } from "./Claimed";
import "./a1-end.css";

export interface A1EndProps {
  step: 1 | 2 | 3;
  summary: EndSummary;
  onStep: (step: 1 | 2 | 3) => void;
  onClose: () => void;
  onMap: () => void;
  onA2: () => void;
  canA2: boolean;
}
export function A1End({ step, summary: s, onStep, onClose, onMap, onA2, canA2 }: A1EndProps) {
  const body = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo(0, 0); }, [step]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled),textarea,a[href]") || []);
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [onClose]);
  const titles = ["This is you", "This week", "Claimed"];
  return <div className="na1-room-overlay is-open a1-end-overlay">
    <div className="na1-room-card a1-end-card" role="dialog" aria-modal="true"
      aria-label={`The end of A1 · ${titles[step - 1]}`} ref={dialog} tabIndex={-1}>
      <header className="a1-end-header">
        <div className="na1-room-crumb">A1 · All In <span className="sep">›</span> {titles[step - 1]}</div>
        <button type="button" className="na1-room-close" aria-label="Close" onClick={onClose}>×</button>
        <div className="a1-end-progress" aria-label={`The end of A1 · ${step} of 3`}>
          {[1, 2, 3].map(n => <span key={n} className={n === step ? "is-current" : n < step ? "is-done" : ""} />)}
        </div>
        <p className="a1-end-label">THE END OF A1 · {step} OF 3</p>
      </header>
      <div className={`a1-end-body${step === 2 ? " is-notice" : ""}`} ref={body}>
        {step === 1 ? <>
          <p className="a1-end-label a1-end-eyebrow">A1 · ALL IN · COMPLETE</p>
          <h1 className="a1-end-title is-first">This is you.</h1>
          <dl className="a1-end-rows">
            {s.where && <div><dt className="is-burgundy">WHERE I WAS</dt><dd>{s.where}</dd></div>}
            {!!s.names.length && <div><dt>WHAT I VALUE</dt><dd>{s.names.join(" · ")}</dd></div>}
            {!!s.creatures.length && <div><dt>WHO I AM</dt><dd>{s.creatures.join(" · ")}</dd></div>}
            {s.purpose && <div><dt>MY WHY</dt><dd><em>{s.purpose}</em></dd></div>}
            {!!s.vision.length && <div><dt>WHERE I'M GOING<br />IN 10 YEARS</dt><dd className="a1-end-vision">
              {s.vision.map(v => <div key={v.area}><span className={`a1-end-label is-${v.area}`}>{v.area.toUpperCase()}</span><span>{v.words}</span></div>)}
            </dd></div>}
          </dl>
          {s.futureB && <aside className="a1-end-future"><span className="a1-end-label">MY FUTURE B ★</span><blockquote>“{s.futureB}”</blockquote></aside>}
        </> : step === 2 ? <WeeklyNotice value={s.names[0]} onDone={() => onStep(3)} />
          : <><Claimed />{!canA2 && <p className="a1-end-helper">Complete all four A1 mirrors to unlock A2.</p>}</>}
      </div>
      <footer key={step} className={`a1-end-footer${step === 1 ? " is-summary" : ""}`}>
        {step === 2 ? <>
          <button type="button" className="na1-btn-ghost" onClick={() => onStep(3)}>I'll do it this week</button>
          <button type="submit" form="a1-weekly-notice" className="na1-btn-gold">Save →</button>
        </> : step === 3 ? <>
          <button className="na1-btn-ghost" onClick={onMap}>See my Map of Me</button>
          <button className="na1-btn-gold" disabled={!canA2} onClick={onA2}>Continue to A2 →</button>
        </> : <><p className="a1-end-question">Before any yes this week, ask: <em>{s.futureB ? "does this move me toward Future B?" : "does this fit who I am?"}</em></p><button className="na1-btn-gold" onClick={() => onStep(2)}>Continue →</button></>}
      </footer>
    </div>
  </div>;
}
