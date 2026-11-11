import { STOPS } from "../../FreeRoad";
import type { ScreenProps } from "../FreeCourse";

// FC-19 · Katherine's bridge
export function Bridge() {
  return <>
    <div className="fc-kb"><span className="fc-kb-avatar" aria-hidden="true">KB</span>
      <span><em>Katherine</em><small>Decades of my own life, and of working alongside owners</small></span></div>
    <p className="fc-body">Here's what I've seen, over and over. When these five things are part of your operating system, you stop chasing your life.</p>
    <p className="fc-rule is-plain">You align it to you. Not the other way around.</p>
    <p className="fc-soft">Most of us have one place where it slips. Let's find yours.</p>
  </>;
}

// FC-20 · Five parts of your operating system (the heading may change; Katherine is deciding)
export function Road() {
  const rows = [...STOPS].reverse();
  return <>
    <h1 className="fc-h1">Five parts of your operating system.</h1>
    <p className="fc-body is-tight">When all five are in place, you move toward your life. When one is missing, that's where it slips.</p>
    <div className="fc-os">
      <svg className="fc-os-road" viewBox="0 0 120 440" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M70 410C34 380 30 340 62 308S110 250 70 214 30 168 62 130 96 86 70 36" fill="none" stroke="#EFE6D6" strokeWidth="26" strokeLinecap="round" />
        <path d="M70 410C34 380 30 340 62 308S110 250 70 214 30 168 62 130 96 86 70 36" fill="none" stroke="#CDB48E" strokeWidth="2.5" strokeDasharray="5 8" strokeLinecap="round" />
        <path d="M70 410C50 396 40 380 46 362" fill="none" stroke="#C9A55E" strokeWidth="26" strokeLinecap="round" />
      </svg>
      <span className="fc-os-star" aria-hidden="true">★</span>
      <ol>{rows.map(([id, name, outcome]) => <li key={id}><strong>{id} · {name} <span aria-label="locked">🔒</span></strong><em>{outcome}</em></li>)}
        <li className="is-done"><strong>✓ Reality Check · done</strong><em>You looked. You found it. You chose.</em></li></ol>
    </div>
  </>;
}

// FC-21 · What you get
const GETS: [string, string][] = [
  ["The weight comes off.", "You stop carrying what was never yours to carry."],
  ["You get your power back.", "The part you own is the part you can move."],
  ["You get a place to start.", "“Everything is wrong” becomes one thing that's yours to change."],
  ["A life that fits.", "Your days and your choices start to look and feel like you."],
];
export function Get({ error }: Pick<ScreenProps, never> & { error: string }) {
  return <>
    <div><p className="fc-eyebrow">You chose Future B</p><h1 className="fc-h1">Here's what you get when you own it.</h1></div>
    <ol className="fc-gets">{GETS.map(([title, line], n) => <li key={title}><span className="fc-getnum" aria-hidden="true">{["I", "II", "III", "IV"][n]}</span><div><strong>{title}</strong><span>{line}</span></div></li>)}</ol>
    <p className="fc-rule is-plain is-center">Own who you are. Own what you tolerate. Own the direction you're moving.</p>
    {error && <p role="alert" className="fc-error">{error}</p>}
  </>;
}
