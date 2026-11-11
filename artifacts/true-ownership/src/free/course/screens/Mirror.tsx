import { RC_LABEL, RC_MIRROR_ALL } from "../../../rcConstants";
import { PATTERNS, PATTERN_ORDER, areaStatements, pickPattern, tiedPatterns, toggleStatement } from "../courseState";
import { PatternIcon } from "../art";
import type { ScreenProps } from "../FreeCourse";

// FC-05 · And it shows you what we do instead of owning it
export function Mirror() {
  return <>
    <p className="fc-soft">Life is a mirror. It isn't judging you. It's showing you.</p>
    <h1 className="fc-h1">And it shows you what we do <em>instead of owning it.</em></h1>
    <div className="fc-patterns">
      {PATTERN_ORDER.map(p => <section className="fc-pattern" key={p}>
        <span className="fc-pattern-art"><PatternIcon pattern={p} /></span>
        <h2>{PATTERNS[p].name}</h2><p>{PATTERNS[p].def}</p>
      </section>)}
    </div>
    <p className="fc-soft is-center">We all do some of these. Let's find yours.</p>
  </>;
}

// FC-06 · Which of these have you heard yourself say?
export function Statements({ state: s, update }: ScreenProps) {
  const area = s.focus ?? "self", n = s.mirror.length;
  return <>
    <h1 className="fc-h1">Which of these have you heard yourself say?</h1>
    <p className="fc-lead">About your {RC_LABEL[area].toLowerCase()}. Tap any that are true lately. <strong className="fc-count" aria-live="polite">{n} chosen{n < 3 ? " · pick at least 3" : ""}</strong></p>
    <div className="fc-quotes" role="group" aria-label="Statements">
      {areaStatements(area).map(m => <button key={m.id} className={`fc-quote${s.mirror.includes(m.id) ? " is-picked" : ""}`}
        aria-pressed={s.mirror.includes(m.id)} data-mirror-id={m.id} onClick={() => update(toggleStatement(s, m.id))}>“{m.text}”</button>)}
    </div>
  </>;
}

// FC-07 · You lean toward {Pattern}
export function Lean({ state: s, update }: ScreenProps) {
  const tied = tiedPatterns(s), said = (p: string) => RC_MIRROR_ALL.filter(m => s.mirror.includes(m.id) && m.default === p);
  if (tied.length > 1) return <>
    <p className="fc-eyebrow">You lean toward</p>
    <h1 className="fc-h1">Two of these are close. Tap the one that's truer.</h1>
    <div className="fc-tie" role="group" aria-label="Which pattern is truer?">
      {tied.map(p => <button key={p} className={`fc-tie-card${s.pattern === p ? " is-picked" : ""}`} aria-pressed={s.pattern === p} onClick={() => update(pickPattern(s, p))}>
        <span className="fc-tie-head"><span className="fc-pattern-art"><PatternIcon pattern={p} /></span><span><strong>{PATTERNS[p].name}</strong><em>{PATTERNS[p].def}</em></span></span>
        <span className="fc-tie-said">{said(p).map(m => <span key={m.id}>“{m.text}”</span>)}</span>
      </button>)}
    </div>
  </>;
  const p = tied[0];
  return <>
    <div className="fc-glow"><PatternIcon pattern={p} /></div>
    <div className="fc-center">
      <p className="fc-eyebrow is-gold">You lean toward</p>
      <h1 className="fc-h1 is-big">{PATTERNS[p].name}</h1>
      <p className="fc-body">{PATTERNS[p].def}</p>
    </div>
    <section className="fc-said"><h2 className="fc-eyebrow is-gold">You said</h2>{said(p).map(m => <p key={m.id}>“{m.text}”</p>)}</section>
    <p className="fc-rule">None of these solve the problem. They're the cover-up. The bandaid.<br />New shape. New story. Same thing underneath.</p>
  </>;
}
