import { A1FutureBThread } from "../components/A1FutureB";
import { shortLine } from "../a1End/summary";
import type { JourneySnapshot } from "./progress";
import "./mirror-cards.css";

type Mirror = "values" | "identity" | "purpose" | "vision";
type Flags = Record<Mirror, boolean>;
export function MirrorCards({ snapshot, complete, enabled, open }: {
  snapshot: JourneySnapshot; complete: Flags; enabled: Flags; open: Record<Mirror, (() => void) | undefined>;
}) {
  const titles = { values: "What you stand for", identity: "Who you are", purpose: "Your why", vision: "Where you’re going" };
  const discoveries = {
    values: "The 3–5 things you won’t trade. About 20 minutes.",
    identity: "Find the gifts you carry, and the creatures that carry them.",
    purpose: "Why Future B matters to you.",
    vision: "Your five years becomes ten.",
  };
  const findings = {
    identity: snapshot.summary.creatures.length ? `You lead with ${snapshot.summary.creatures.join(" · ")}` : "",
    purpose: snapshot.summary.purpose,
    vision: shortLine(snapshot.summary.vision.map(v => v.words).join(" · ")),
  };
  const previous = { values: "the Reality Check", identity: "Values", purpose: "Identity", vision: "Purpose" };
  return <>{(["values", "identity", "purpose", "vision"] as const).map((mirror, i) => {
    const label = mirror[0].toUpperCase() + mirror.slice(1), claimed = complete[mirror];
    const available = enabled[mirror] && !!open[mirror];
    return <article key={mirror} data-a1-mirror={mirror}
      role={available ? "button" : undefined} tabIndex={available ? 0 : undefined}
      onClick={available ? open[mirror] : undefined}
      onKeyDown={e => { if (available && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open[mirror]?.(); } }}
      className={`na1-mirror-card jr-mirror-card ${claimed ? "jr-mirror-claimed" : available ? "jr-mirror-next" : "jr-mirror-later"}`}>
      <header><span>{String(i + 1).padStart(2, "0")} · {label.toUpperCase()}</span>
        <span className="jr-mirror-status">{claimed ? "★ CLAIMED" : available ? "UP NEXT" : "LATER"}</span></header>
      <h2>{titles[mirror]}</h2>
      {claimed && mirror === "values" ? <div className="jr-values-found">
        <p>You stand for</p><ol>{snapshot.summary.names.slice(0, 3).map((name, index) =>
          <li key={`${index}:${name}`} style={{ fontSize: [20, 18, 17][index] }}><span>{index + 1}</span>{name}</li>)}</ol>
        {snapshot.summary.names.length > 3 && <p className="jr-values-rest">{snapshot.summary.names.slice(3).join(" · ")}</p>}
      </div> : <p className={`jr-mirror-body ${claimed ? "is-finding" : ""}`}>
        {claimed ? findings[mirror as keyof typeof findings] : discoveries[mirror]}</p>}
      <A1FutureBThread rc={snapshot.rc} mirror={mirror} claimed={claimed} />
      <button className="jr-mirror-button" type="button" disabled={!available} onClick={e => { e.stopPropagation(); open[mirror]?.(); }}>
        {claimed ? `Revisit ${label}` : available ? `Begin ${label} →` : `Opens after ${previous[mirror]}`}
      </button>
    </article>;
  })}</>;
}
