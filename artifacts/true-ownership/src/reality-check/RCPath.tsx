import React from "react";
import { rcMoney, rcNumber, type RCState } from "../rcConstants";
import "./rc-path.css";

const PATH = [
  ["Know who you are.", "No more second-guessing. Every yes and no gets easier."],
  ["See where your time and money really go.", "The hours and dollars start coming back to what matters."],
  ["Surround yourself with what lifts you.", "The people, places and thoughts around you pull you forward, not back."],
  ["Know your next move.", "One clear step at a time. The overwhelm goes quiet."],
  ["Trust yourself again.", "You do what you said you’d do. And you start to believe you can."],
];

export function RCPath({ state }: { state: RCState }) {
  const { hoursPerWeek, monthly } = state.cost;
  const amounts = [
    hoursPerWeek !== null ? `${rcNumber(hoursPerWeek)} hours a week` : "",
    monthly !== null ? `${rcMoney(monthly)} a month` : "",
  ].filter(Boolean);
  const tuesday = state.futureB5.tuesday.trim();
  return <div className="rc-scene rc-path-final">
    <h2>Willpower won’t get you there. This will.</h2>
    <ol className="rc-path-rows">{PATH.map(([title, result], i) =>
      <li key={title}>
        <span className="rc-path-number" aria-hidden="true">{i + 1}</span>
        <div><h3>{title}</h3><p>{result}</p></div>
      </li>
    )}</ol>
    {(amounts.length > 0 || tuesday) && <section className="rc-path-waiting" aria-label="What’s waiting for you">
      <h3>WHAT’S WAITING FOR YOU</h3>
      <p>{amounts.length > 0 && <>About {amounts.join(" and ")} back.</>}
        {tuesday && <>{amounts.length > 0 ? " And a Tuesday where " : "A Tuesday where "}<em>“{tuesday}”</em></>}
      </p>
    </section>}
  </div>;
}
