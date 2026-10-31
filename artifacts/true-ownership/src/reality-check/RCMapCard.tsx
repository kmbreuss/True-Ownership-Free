import React from "react";
import { loadRCState, rcEnabled, RC_LABEL, RC_DEFAULT_LABEL } from "../rcConstants";
import { annualAmounts, lastCompletedRC } from "./rcJourney";

export function RCMapCard() {
  if (!rcEnabled()) return null;
  const round = lastCompletedRC(loadRCState());
  if (!round || !round.focus) return null;
  const cost = annualAmounts(round);
  return <section className="rc-map-card" aria-label="Where I am now · Reality Check">
    <p className="rc-eyebrow">WHERE I AM NOW · FROM MY REALITY CHECK</p>
    <h2>{RC_LABEL[round.focus]} · {round.topDefaults.map(d => RC_DEFAULT_LABEL[d]).join(" and ")}</h2>
    {(cost.money || cost.hours) && <p>Per year: <strong>{[cost.money, cost.hours].filter(Boolean).join(" · ")}</strong></p>}
    {round.futureB5.tuesday && <p><em>“{round.futureB5.tuesday}”</em></p>}
    {round.futureB1.oneThing && <p>This week: <em>{round.futureB1.oneThing}</em></p>}
    {round.completedAt && <small>Chosen {new Date(round.completedAt).toLocaleDateString("en-US")}</small>}
  </section>;
}
