import React from "react";
import {
  RC_AREAS, RC_LABEL, RC_INTRO_VIDEO_URL, RC_MIRROR, RC_DEFAULT_LABEL, RC_DEFAULT_DEFINITION,
  RC_DEFAULT_PROMPT, topAreas, toggleMirror, chooseFocus, costSummary, type RCState, type RCArea,
} from "../rcConstants";
import { annualAmounts } from "./rcJourney";

type Props = { state: RCState; update: (state: RCState) => void };
export function RCVideo() {
  return RC_INTRO_VIDEO_URL
    ? <video className="rc-video" controls src={RC_INTRO_VIDEO_URL} aria-label="Katherine introduces the Reality Check" />
    : <div className="rc-video rc-video-empty"><span>WATCH FIRST · KATHERINE</span><h3>Person A or Person B?</h3><p>Video coming soon. You can continue without watching.</p></div>;
}
const PERSON_A = ["Already behind. Already reacting.", "Says yes when they mean no.", "Waits for the perfect moment.", "Blames the boss or circumstances."];
const PERSON_B = ["Knows what matters today.", "Can say no without guilt.", "Owns their results. Owns their life.", "Looks in the mirror first."];
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
export function RealityCheckScreens({ state: s, update }: Props) {
  const focus = s.focus ?? "self", area = RC_LABEL[focus], lower = area.toLowerCase();
  if (s.step === 0) return <div className="rc-scene rc-opening">
    <em className="rc-katherine">Katherine</em>
    <h2>Maybe the life you built no longer matches who you're becoming.</h2>
    <p>Let's look honestly. Two people, same week. One is reacting to their life. One is choosing it. Most of us are a little of both.</p>
    <div className="rc-people">{(["A", "B"] as const).map(p => <section key={p} className={`rc-person rc-person-${p}`}>
      <h3>Person {p}</h3><ul>{(p === "A" ? PERSON_A : PERSON_B).map(line => <li key={line}>{line}</li>)}</ul>
    </section>)}</div>
    {RC_INTRO_VIDEO_URL && <RCVideo />}
    <p className="rc-helper">About 10 minutes · just you.</p>
  </div>;
  if (s.step === 1) return <div className="rc-scene rc-mirror-scene">
    <Chapter>CHAPTER 1 · THE MIRROR</Chapter>
    <h2>Which of these have you heard yourself say?</h2>
    <p className="rc-instruction">Tap at least three that are true lately. No right answers. <span aria-live="polite">{s.mirror.length < 3 ? `(${s.mirror.length} of 3)` : `(${s.mirror.length} selected)`}</span></p>
    <div className="rc-mirror-grid">{RC_MIRROR.map(m => <button key={m.id} data-mirror-id={m.id} aria-pressed={s.mirror.includes(m.id)} onClick={() => update(toggleMirror(s, m.id))}>“{m.text}”</button>)}</div>
    <p className="rc-reflection"><em>Life is a mirror. It isn't judging you. It's showing you.</em></p>
  </div>;
  if (s.step === 2) {
    const areas = topAreas(s), names = areas.map(a => RC_LABEL[a]);
    const headline = areas.length === 1 ? `It shows up most in ${names[0]}.` : areas.length === 2
      ? `It shows up equally in ${names.join(" and ")}.` : areas.length === 3
        ? "It shows up everywhere: Self, Time and Wealth." : "Choose at least three mirror sentences.";
    return <div className="rc-scene rc-reveal">
      <Chapter>CHAPTER 2 · WHAT YOU'RE SHOWING YOURSELF</Chapter><h2>{headline}</h2>
      <p>{areas.length === 1 ? "This is where we start. The others will be waiting." : "That's common. Pick the one that's costing you most right now. The others will be waiting."}</p>
      {s.topDefaults.length > 0 && <section className="rc-default-reveal">
        <h3>And mostly, you've been {s.topDefaults.map(d => RC_DEFAULT_LABEL[d]).join(" and ")}.</h3>
        {s.topDefaults.map(d => <p key={d}><strong>{RC_DEFAULT_LABEL[d][0].toUpperCase() + RC_DEFAULT_LABEL[d].slice(1)}:</strong> {RC_DEFAULT_DEFINITION[d]}</p>)}
      </section>}
      <p className="rc-pick-label">Feels right? Or start somewhere else:</p>
      <div className="rc-area-pills">{RC_AREAS.map(a => <button key={a} aria-pressed={s.focus === a} onClick={() => update(chooseFocus(s, a))}>{RC_LABEL[a]} · {s.areaCounts[a]}</button>)}</div>
      {s.focus && <p className="rc-bronze"><em>Let's look at <strong>{area}</strong> together.</em></p>}
    </div>;
  }
  if (s.step === 3) return <div className="rc-scene rc-tuesday">
    <Chapter>CHAPTER 3 · A TUESDAY</Chapter><h2>What does {lower} feel like on an ordinary Tuesday?</h2>
    <p>Not what you'd tell anyone else. What it actually feels like.</p>
    <label className="rc-tuesday-label"><span className="rc-sr-only">Your ordinary Tuesday · required</span>
      <textarea required aria-label="Your ordinary Tuesday" placeholder={TUESDAY[focus]} value={s.tuesday} onChange={e => update({ ...s, tuesday: e.target.value })} />
    </label>
    <div className="rc-naming">{s.topDefaults.map(d => <label key={d}>{RC_DEFAULT_PROMPT[d]} <span className="rc-optional">Optional</span>
      <input value={s.defaultsNamed[d]} placeholder={NAMED_EXAMPLES[d]} onChange={e => update({ ...s, defaultsNamed: { ...s.defaultsNamed, [d]: e.target.value } })} />
    </label>)}</div>
  </div>;
  if (s.step === 4) {
    const setCost = (patch: Partial<RCState["cost"]>) => update({ ...s, cost: { ...s.cost, ...patch } });
    const number = (raw: string) => raw === "" ? null : Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null;
    const summary = costSummary(s.cost), totals = annualAmounts(s), placeholder = PLACEHOLDERS[focus];
    return <div className="rc-scene rc-price">
      <Chapter>CHAPTER 4 · THE PRICE</Chapter><h2>Where are you leaking power?</h2>
      <p className="rc-bronze"><em>What is the way your {lower} runs costing you?</em></p>
      <p className="rc-instruction">Your best guess is fine. Add a number if you can.</p>
      <div className="rc-price-grid">
        <section className="rc-price-tile"><h3>IN MONEY</h3>
          <label className="rc-number-line"><span>About $</span><input aria-label="About dollars a month" type="number" inputMode="decimal" min="0" step="any" value={s.cost.monthly ?? ""} onChange={e => setCost({ monthly: number(e.target.value) })} /><span>a month</span></label>
          <label>Where does it go?<input placeholder={placeholder.money} value={s.cost.moneyWhere} onChange={e => setCost({ moneyWhere: e.target.value })} /></label>
        </section>
        <section className="rc-price-tile"><h3>IN HOURS</h3>
          <label className="rc-number-line"><span>About</span><input aria-label="About hours a week" type="number" inputMode="decimal" min="0" step="any" value={s.cost.hoursPerWeek ?? ""} onChange={e => setCost({ hoursPerWeek: number(e.target.value) })} /><span>hours a week</span></label>
          <label>Where do they go?<input placeholder={placeholder.hours} value={s.cost.hoursWhere} onChange={e => setCost({ hoursWhere: e.target.value })} /></label>
        </section>
        <section className="rc-price-tile"><h3>IN YOU</h3>
          <label>What is it costing you?<input placeholder={placeholder.you} value={s.cost.you} onChange={e => setCost({ you: e.target.value })} /></label>
          <label>Who else is paying for it?<input value={s.cost.whoElse} onChange={e => setCost({ whoElse: e.target.value })} /></label>
        </section>
      </div>
      <div className={`rc-summary ${summary ? "has-summary" : ""}`} aria-live="polite">{summary && <p>{totals.money || totals.hours ? <>Over a year, that's about {totals.money && <strong>{totals.money}</strong>}{totals.money && totals.hours && " and "}{totals.hours && <strong>{totals.hours}</strong>}. And you're paying too.</> : summary}</p>}<em>This isn't blame. It's the diagnosis. And it can change.</em></div>
    </div>;
  }
  return <div className="rc-scene rc-terminal"><Chapter>TWO FUTURES</Chapter><h2>Two futures · coming next</h2><p>Your Reality Check is saved. The next part of the journey is coming next.</p></div>;
}
