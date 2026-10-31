import React, { type CSSProperties } from "react";
import { type RCState } from "../rcConstants";
import { annualAmounts, endClean, journeyMonth, reflectionClause } from "./rcJourney";
import { Feelings } from "./RCFeelings";
import { InlineAnswer } from "./RCAnswerFields";
import { SoftAnswerCounter } from "./SoftAnswerCounter";

type Props = { state: RCState; update: (s: RCState) => void; arriving?: boolean };
const lowerStart = (value: string) => {
  const text = reflectionClause(value);
  return text.charAt(0).toLocaleLowerCase("en-US") + text.slice(1);
};
const delay = (ms: number) => ({ "--beat-delay": `${ms}ms` }) as CSSProperties;

export function FutureABeats({ state: s, arriving }: Props) {
  const amounts = annualAmounts(s), month = journeyMonth(s);
  const beats: React.ReactNode[] = [];
  if (s.tuesday.trim()) beats.push(<blockquote className="rc-tuesday-quote">“{endClean(s.tuesday)}.”</blockquote>);
  // A combined answer must never be reassigned to an individual default.
  if (!(s.topDefaults.length > 2 && s.defaultsTogether !== undefined)) {
    s.topDefaults.filter(d => s.defaultsNamed[d].trim()).slice(0, 2).forEach(d => {
      const prefix = { avoiding: "You're still avoiding", blaming: "Still blaming", carrying: "You're still carrying", hoping: "You're still hoping for" }[d];
      const clause = lowerStart(s.defaultsNamed[d]).replace(new RegExp(`^${d === "hoping" ? "hoping(?: for)?" : d}\\s+`, "i"), "");
      beats.push(<p className="rc-still-line"><span>{prefix} </span><em>{clause}.</em></p>);
    });
  }
  if (amounts.money || amounts.hours) beats.push(<div className="rc-cost-moment">
    {amounts.money && <strong>{amounts.money}</strong>}
    {amounts.money && amounts.hours && <span>and</span>}
    {amounts.hours && <strong>{amounts.hours}</strong>}
    <span className="rc-gone">gone. Again.</span>
  </div>);
  if (s.cost.hoursWhere.trim()) beats.push(<p className="rc-still-line"><span>Still going into </span><em>{lowerStart(s.cost.hoursWhere)}.</em></p>);
  return <div className={`rc-scene rc-future-a-beats${arriving ? " rc-arriving" : ""}`}>
    <div><p className="rc-eyebrow">ONE YEAR FROM NOW</p><h2>It's next {month}.</h2></div>
    {beats.map((beat, i) => <div className="rc-beat" data-beat key={i} style={delay(400 + i * 900)}>{beat}</div>)}
    <p className="rc-small">Every line here is yours, from the last few minutes.</p>
  </div>;
}

export function CompoundTimeline({ state: s, update, arriving }: Props) {
  const amounts = annualAmounts(s);
  return <div className={`rc-scene rc-compound rc-compound-story${arriving ? " rc-arriving" : ""}`}>
    <div><p className="rc-eyebrow">AND IT DOESN'T STOP THERE</p><h2>Keep going. Year after year, it adds up.</h2></div>
    {(amounts.money || amounts.hours) && <div className="rc-timeline" aria-label="The cost over one, three and five years">
      {[1, 3, 5].map((years, i) => {
        const total = annualAmounts(s, years, "threshold");
        return <section className="rc-timeline-point" data-beat key={years} style={delay(400 + i * 600)}>
          <h3>{years} {years === 1 ? "YEAR" : "YEARS"}</h3>
          {total.money && <strong>{total.money}</strong>}
          {total.hours && <span className="rc-timeline-hours">{total.hours} gone</span>}
        </section>;
      })}
    </div>}
    <div className="rc-feeling-sentence"><span>By year five, I feel</span><Feelings lowerCase
      base={["Heavier", "Resentful", "Numb", "Exhausted", "Stuck"]} value={s.compound.feels}
      change={feels => update({ ...s, compound: { ...s.compound, feels } })} /></div>
    <div className="rc-cost-sentence"><span>And it's cost me </span><InlineAnswer label="What has it cost you by then?" value={s.compound.results} onChange={results => update({ ...s, compound: { ...s.compound, results } })} /></div>
  </div>;
}

export function OctoberLetter({ state: s, update }: Props) {
  const started = s.startedAt ? new Date(s.startedAt) : new Date();
  const year = (Number.isNaN(started.getTime()) ? new Date() : started).getFullYear() + 1;
  const month = journeyMonth(s);
  return <div className="rc-scene rc-october-letter">
    <h2>A note from next {month}.</h2>
    <section className="rc-letter-card" aria-label="A letter to myself">
      <div className="rc-letter-stamp"><span>{month}</span><strong>{year}</strong></div>
      <p className="rc-letter-dear">Dear me,</p>
      <p>A year on, I'm <InlineAnswer lowerStart label={`What will you be doing by next ${month}?`} value={s.futureB1.doing} onChange={doing => update({ ...s, futureB1: { ...s.futureB1, doing } })} />{/[.!?…]$/.test(s.futureB1.doing.trim()) ? "" : "."}<SoftAnswerCounter value={s.futureB1.doing} /></p>
      <p>It started the week I chose to <InlineAnswer lowerStart required label="My one thing this week" value={s.futureB1.oneThing} onChange={oneThing => update({ ...s, futureB1: { ...s.futureB1, oneThing } })} />{/[.!?…]$/.test(s.futureB1.oneThing.trim()) ? "" : "."}<SoftAnswerCounter value={s.futureB1.oneThing} /></p>
      <p className="rc-letter-signature">— me</p>
    </section>
    <p className="rc-letter-promise"><span aria-hidden="true">★</span> The thing you chose to start becomes the first promise waiting for you in A4.</p>
  </div>;
}
