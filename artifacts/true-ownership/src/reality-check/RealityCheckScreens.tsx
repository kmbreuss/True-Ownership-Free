import React, { useState } from "react";
import {
  RC_AREAS, RC_LABEL, RC_INTRO_VIDEO_URL, RC_MIRROR, RC_DEFAULT_LABEL, RC_DEFAULT_DEFINITION,
  RC_DEFAULT_PROMPT, topAreas, toggleMirror, chooseFocus, costSummary, type RCState, type RCArea,
} from "../rcConstants";
import { annualAmounts, defaultList } from "./rcJourney";
import { PriceWhereField } from "./PriceWhereField";
import { useMirrorLayout } from "./useMirrorLayout";
import { LedgerNumber } from "./RCAnswerFields";

type Props = { state: RCState; update: (state: RCState) => void; phone?: boolean };
export function RCVideo() {
  return RC_INTRO_VIDEO_URL
    ? <video className="rc-video" controls src={RC_INTRO_VIDEO_URL} aria-label="Katherine introduces the Reality Check" />
    : <div className="rc-video rc-video-empty"><span>WATCH FIRST · KATHERINE</span><h3>Person A or Person B?</h3><p>Video coming soon. You can continue without watching.</p></div>;
}
const PERSON_A = ["Already behind before breakfast.", "Says yes when they mean no.", "Waits for the perfect moment."];
const PERSON_B = ["Knows what matters today.", "Says no without guilt.", "Owns their results. Owns their life."];
const TUESDAY: Record<RCArea, string> = {
  time: "By 9am I am already…", wealth: "When I open the bank app, I feel…",
  self: "By Tuesday afternoon, the way I talk to myself is…",
};
const PLACEHOLDERS: Record<RCArea, { money: string; hours: string; you: string }> = {
  time: { money: "Opportunities I keep missing", hours: "My evenings · my weekends", you: "My patience. My sleep." },
  wealth: { money: "Paying for everyone but me", hours: "Worrying about money · fixing others' problems", you: "My confidence. My sleep." },
  self: { money: "Spending to cope", hours: "Scrolling · replaying conversations", you: "My energy. My patience." },
};
const NAMED_EXAMPLES = {
  avoiding: "A conversation · looking at the numbers",
  blaming: "My boss · the economy · someone at home",
  carrying: "Someone else's workload · everyone's worries",
  hoping: "More time · a raise · a big client · a lucky break",
};
function Chapter({ children }: { children: React.ReactNode }) {
  return <p className="rc-eyebrow">{children}</p>;
}
export function RealityCheckScreens({ state: s, update, phone = false, people = false, mirrorPaged = phone, onMirrorLayout }: Props & {
  people?: boolean; mirrorPaged?: boolean; onMirrorLayout: (paged: boolean) => void;
}) {
  const [person, setPerson] = useState<"A" | "B">("A");
  const mirrorRef = useMirrorLayout(s.step === 1, onMirrorLayout);
  const focus = s.focus ?? "self", area = RC_LABEL[focus], lower = area.toLowerCase();
  if (s.step === 0 && !people) return <div className="rc-scene rc-opening">
    <em className="rc-katherine">Katherine</em>
    <h2>Maybe the life you built no longer matches who you're becoming.</h2>
    <p>Most of us are a little of both: reacting to life some weeks, choosing it in others. Let's look honestly.</p>
  </div>;
  if (s.step === 0) return <div className="rc-scene rc-person-scene">
    <h2>Two people. Same week.</h2>
    <div className="rc-person-tabs" role="tablist" aria-label="Two ways to live">{(["A", "B"] as const).map(p => <button key={p} id={`rc-person-tab-${p}`} role="tab" aria-selected={person === p} aria-controls={`rc-person-${p}`} tabIndex={person === p ? 0 : -1} onClick={() => setPerson(p)} onKeyDown={e => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault(); const next = e.key === "Home" ? "A" : e.key === "End" ? "B" : p === "A" ? "B" : "A";
        setPerson(next); document.getElementById(`rc-person-tab-${next}`)?.focus();
      }
    }}>Person {p}</button>)}</div>
    <div className="rc-people">{(["A", "B"] as const).map(p => <section id={`rc-person-${p}`} key={p} role="tabpanel" aria-labelledby={`rc-person-tab-${p}`} tabIndex={0} className={`rc-person rc-person-${p} ${person === p ? "is-selected" : ""}`}>
      <h3>PERSON {p}</h3><p className="rc-person-headline">{p === "A" ? "Drifting, reacting to whatever life hands them." : "Knows where they're headed, and why."}</p><ul>{(p === "A" ? PERSON_A : PERSON_B).map(line => <li key={line}>{line}</li>)}</ul>
    </section>)}</div>
    <p className="rc-bronze"><em>If you're mostly Person B, good. This finds the one place you're still Person A.</em></p>
  </div>;
  if (s.step === 1) return <div ref={mirrorRef} className={`rc-scene rc-mirror-scene${mirrorPaged ? " is-paged" : ""}`} data-mirror-layout={mirrorPaged ? "six" : "twelve"}>
    <h2>Which of these have you heard yourself say?</h2>
    <p className="rc-instruction">Tap any that are true lately. At least three. <span aria-live="polite">{s.mirror.length} chosen</span></p>
    <div className="rc-mirror-grid">{RC_MIRROR.map((m, i) => <button hidden={mirrorPaged && Math.floor(i / 6) !== (s.phoneMirror?.set ?? 0)} className={`rc-quote${s.mirror.includes(m.id) ? " is-selected" : ""}`} key={m.id} data-mirror-id={m.id} aria-pressed={s.mirror.includes(m.id)} onClick={() => update(toggleMirror(s, m.id))}><span aria-hidden="true" className="rc-quote-mark">“</span>{m.text}{s.mirror.includes(m.id) && <span aria-hidden="true" className="rc-quote-check">✓</span>}</button>)}</div>
    {mirrorPaged && <div className="rc-mirror-pages">
      <button onClick={() => update({ ...s, phoneMirror: { set: s.phoneMirror?.set === 1 ? 0 : 1, viewedBoth: true } })}>{s.phoneMirror?.set === 1 ? "← First six" : "More sentences →"}</button>
      <span className="rc-mirror-dots" role="img" aria-label={`Set ${(s.phoneMirror?.set ?? 0) + 1} of 2`}>{[0, 1].map(n => <span key={n} aria-hidden="true" className={(s.phoneMirror?.set ?? 0) === n ? "is-current" : ""} />)}</span>
    </div>}
  </div>;
  if (s.step === 2) {
    const areas = topAreas(s), names = areas.map(a => RC_LABEL[a]);
    const headline = areas.length === 1 ? `It shows up most in ${names[0]}.` : areas.length === 2
      ? `It shows up equally in ${names.join(" and ")}.` : areas.length === 3
        ? "It shows up everywhere: Self, Time and Wealth." : "Choose at least three mirror sentences.";
    return <div className="rc-scene rc-reveal">
      <Chapter>WHAT YOU'RE SHOWING YOURSELF</Chapter><h2>{areas.length === 1 ? <>It shows up most in <span className="rc-area-word">{names[0]}</span>.</> : headline}</h2>
      {s.topDefaults.length > 0 && <section className="rc-default-reveal">
        {s.topDefaults.length > 2 ? <p>And you’ve been doing a little of everything: avoiding, blaming, carrying and hoping.</p> : <>
          {s.topDefaults.slice(0, 2).map((d, i) => <p key={d}>{i === 0 ? "And mostly, you've been " : "And "}<strong>{RC_DEFAULT_LABEL[d]}</strong>: {RC_DEFAULT_DEFINITION[d]}</p>)}
        </>}
      </section>}
      <div className="rc-area-options"><span className="rc-pick-label">Start somewhere else?</span><div className="rc-area-pills">{RC_AREAS.filter(a => a !== s.focus).map(a => <button key={a} onClick={() => update(chooseFocus(s, a))}>{RC_LABEL[a]}</button>)}</div></div>
    </div>;
  }
  if (s.step === 3) return <div className="rc-scene rc-tuesday">
    <h2>What does {lower} feel like on an ordinary Tuesday?</h2>
    <p>Not what you'd tell anyone else. What it actually feels like.</p>
    <label className="rc-tuesday-label"><span className="rc-sr-only">Your ordinary Tuesday · required</span>
      <textarea required aria-label="Your ordinary Tuesday" placeholder={TUESDAY[focus]} value={s.tuesday} onChange={e => update({ ...s, tuesday: e.target.value })} />
    </label>
    <div className="rc-naming">{s.topDefaults.length > 2 ? <label className="rc-naming-together">What are you avoiding, blaming, carrying or hoping for? <span className="rc-optional">Optional</span>
      <input aria-label="What are you avoiding, blaming, carrying or hoping for?" value={s.defaultsTogether ?? s.topDefaults.filter(d => s.defaultsNamed[d].trim()).map(d => `${RC_DEFAULT_LABEL[d]}: ${s.defaultsNamed[d]}`).join("; ")} onChange={e => update({ ...s, defaultsTogether: e.target.value })} />
    </label> : s.topDefaults.slice(0, 2).map(d => <label key={d}>{RC_DEFAULT_PROMPT[d]} <span className="rc-optional">Optional</span>
      <input value={s.defaultsNamed[d]} placeholder={NAMED_EXAMPLES[d]} onChange={e => update({ ...s, defaultsNamed: { ...s.defaultsNamed, [d]: e.target.value } })} />
    </label>)}</div>
  </div>;
  if (s.step === 4) {
    const setCost = (patch: Partial<RCState["cost"]>) => update({ ...s, cost: { ...s.cost, ...patch } });
    const number = (raw: string) => raw === "" ? null : Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;
    const summary = costSummary(s.cost), totals = annualAmounts(s), placeholder = PLACEHOLDERS[focus];
    return <div className="rc-scene rc-price">
      <h2>Where are you leaking power?</h2>
      <p>What is the way your {lower} runs costing you? Your best guess is fine.</p>
      <div className="rc-price-ledger">
        <div className="rc-ledger-head"><span /><span>How much</span><span>Where it goes</span></div>
        <section className="rc-ledger-row"><h3>IN MONEY</h3>
          <LedgerNumber money value={s.cost.monthly} onChange={monthly => setCost({ monthly })} />
          <label><span className="rc-sr-only">Where does it go?</span><PriceWhereField placeholder="Where does it go?" value={s.cost.moneyWhere} onChange={moneyWhere => setCost({ moneyWhere })} /></label>
        </section>
        <section className="rc-ledger-row"><h3>IN HOURS</h3>
          <LedgerNumber value={s.cost.hoursPerWeek} onChange={hoursPerWeek => setCost({ hoursPerWeek })} />
          <label><span className="rc-sr-only">Where do they go?</span><PriceWhereField placeholder="Where do they go?" value={s.cost.hoursWhere} onChange={hoursWhere => setCost({ hoursWhere })} /></label>
        </section>
        <section className="rc-ledger-row"><h3>IN YOU</h3><span className="rc-ledger-empty" />
          <label><span className="rc-sr-only">What is it costing you?</span><PriceWhereField placeholder="What is it costing you?" value={s.cost.you} onChange={you => setCost({ you })} /></label>
        </section>
      </div>
      <div className={`rc-summary ${summary ? "has-summary" : ""}`} aria-live="polite">{summary && <p>{totals.money || totals.hours ? <>Over a year, that's about {totals.money && <strong>{totals.money}</strong>}{totals.money && totals.hours && " and "}{totals.hours && <strong>{totals.hours}</strong>}. And you're paying too.</> : summary}</p>}<em>This isn't blame. It's the diagnosis. And it can change.</em></div>
    </div>;
  }
  return <div className="rc-scene rc-terminal"><Chapter>TWO FUTURES</Chapter><h2>Two futures · coming next</h2><p>Your Reality Check is saved. The next part of the journey is coming next.</p></div>;
}
