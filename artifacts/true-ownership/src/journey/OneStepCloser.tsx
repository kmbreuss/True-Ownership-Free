import { joinNames, type JourneySnapshot } from "./progress";

export function OneStepCloser({ snapshot, onContinue }: { snapshot: JourneySnapshot; onContinue: () => void }) {
  const names = joinNames(snapshot.summary.names.slice(0, 3));
  return <section className="jr-closer" aria-label="One step closer">
    <div className="jr-closer-body">
      <p className="jr-eyebrow">VALUES · CLAIMED</p>
      <h2>One step closer.</h2>
      <div className="jr-path-strip" aria-label="Values claimed on your road to Future B">
        <span><i className="is-filled" />START</span>
        <span className="is-current"><span className="jr-mirror-dots">{Object.entries(snapshot.claimed).map(([key, claimed]) =>
          <i key={key} className={`${claimed ? "is-filled" : ""} ${key === "values" ? "is-glowing" : ""}`} />)}</span>A1 · ALL IN</span>
        {["A2", "A3", "A4", "A5"].map(a => <span key={a}><i className="jr-path-line" />{a}</span>)}
        <span><i className="jr-path-star">★</i>FUTURE B</span>
      </div>
      <p className="jr-closer-personal">You know what you won’t trade now.{names ? <> <strong>{names}.</strong></> : null} Future B needed that.</p>
      <div className="jr-closer-boxes">
        <section><h3>WHAT YOU HAVE NOW</h3><p>A way to decide. When two things pull at you, the higher value wins.</p></section>
        <section><h3>NEXT STEP</h3><p>Identity: the gifts in you that get you there.</p></section>
      </div>
      <p className="jr-placed">★ Placed on your Map of Me</p>
    </div>
    <footer className="na1-m4-disc-foot jr-closer-footer">
      {snapshot.summary.futureB && <p>Your Future B: “{snapshot.summary.futureB}”</p>}
      <button type="button" className="na1-m4-continue" onClick={onContinue}>Continue to Identity →</button>
    </footer>
  </section>;
}
