import { m4IsClusterComplete, type Mirror4State } from "../mirror4Constants";
import { useRef, useState } from "react";
import { OneStepCloser } from "../journey/OneStepCloser";
import type { JourneySnapshot } from "../journey/progress";

export function rankedValues(state: Mirror4State) {
  const named = state.clusters.filter(m4IsClusterComplete);
  return (state.rank.length ? state.rank : named.map(c => c.id))
    .map(id => named.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
}

export function ValuesHubNames({ state }: { state: Mirror4State }) {
  const names = rankedValues(state);
  return <div className="vx-hub-values">
    <p>You stand for</p>
    <ol>{names.slice(0, 3).map((c, i) => <li key={c.id}><span>{i + 1}</span>{c.userName}</li>)}</ol>
    {names.length > 3 && <p>+ {names.slice(3).map(c => c.userName).join(" · ")}</p>}
  </div>;
}

export function ValuesClaim({ state, onClaim, onBack, onNext, onEdit, onAdvance, journey }: {
  state: Mirror4State; onClaim: () => void; onBack: () => void;
  onNext?: () => void; onEdit?: () => void;
  onAdvance?: () => void; journey?: JourneySnapshot;
}) {
  const reviewing = useRef(state.claimed).current;
  const [closer, setCloser] = useState(false);
  if (closer && journey && onAdvance) return <OneStepCloser snapshot={journey} onContinue={onAdvance} />;
  return <div className="vx-claim-layout">
    <section className="vx-claim-body">
      <div className="vx-seal-star" aria-hidden="true">★</div>
      <div className="vx-eyebrow">Values · {state.claimed ? "Claimed" : "Claim"}</div>
      <h2>This is what you stand for.</h2>
      <ol className="vx-ranked-names">{rankedValues(state).map((c, i) =>
        <li key={c.id} style={{ fontSize: `${Math.max(19, 28 - i * 2)}px` }}><span>{i + 1}</span>{c.userName}</li>)}</ol>
      <p className="vx-reflection">When two pull against each other, the higher one wins. That's how you'll know.</p>
      {state.claimed && <p className="vx-map-stamp">★ Placed on your Map of Me · 1 of 4 pieces in A1.</p>}
      {state.claimed && onEdit && <button className="vx-back-link" type="button" onClick={onEdit}>Edit my values →</button>}
    </section>
    <footer className="na1-m4-disc-foot">
      <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>
      {state.claimed && !reviewing && journey && onAdvance ? <button type="button" className="na1-m4-continue" onClick={() => setCloser(true)}>Continue to Identity →</button> :
        state.claimed && onNext ? <button type="button" className="na1-m4-continue" onClick={onNext}>Done reviewing →</button> :
        !state.claimed ? <button type="button" className="na1-m4-continue" disabled={!state.pressureTest.complete} onClick={onClaim}>Claim it · go to Map of Me →</button> :
        <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>}
    </footer>
  </div>;
}
