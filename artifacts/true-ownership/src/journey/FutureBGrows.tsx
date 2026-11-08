import { RC_LABEL } from "../rcConstants";
import type { JourneySnapshot } from "./progress";
import "./future-b.css";
import { usePractical } from "../a1End/usePractical";

export function FutureBGrows({ snapshot }: { snapshot: JourneySnapshot }) {
  const { rc, summary, claimed, lines, clarity } = snapshot;
  const { practical, error } = usePractical();
  const oneThing = practical.sharpenedOneThing?.trim() ? practical.sharpenedOneThing : rc.futureB1.oneThing;
  if (rc.choice !== "B") return null;
  const date = rc.completedAt ? new Date(rc.completedAt) : null;
  const dateText = date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const meta = [rc.focus ? RC_LABEL[rc.focus] : "", dateText ? `chosen ${dateText}` : "", `getting clearer, ${clarity} of 5`].filter(Boolean).join(" · ");
  const placeholders = {
    values: "What you stand for · after Values",
    identity: "Who you’ll be when you get there · after Identity",
    purpose: "Why it matters · after Purpose",
    vision: "Ten years out · after Vision",
  };
  return <aside className="jr-future-b" aria-label="Your Future B">
    <header><span className="jr-future-b-badge" aria-hidden="true">★</span>
      <div><h2>YOUR FUTURE B</h2><p>{meta}</p></div>
      <span className="jr-clarity" aria-label={`Getting clearer: ${clarity} of 5`}>
        <span aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < clarity ? "is-filled" : ""} />)}</span>{clarity} of 5
      </span>
    </header>
    {summary.futureB && <blockquote>“{summary.futureB}”</blockquote>}
    <div className="jr-growing-lines">{(["values", "identity", "purpose", "vision"] as const).map(key =>
      <div key={key} className={claimed[key] ? "is-claimed" : "is-waiting"} data-growing-mirror={key}>
        <span>{claimed[key] ? "★ " : ""}{key.toUpperCase()}</span>
        <p>{claimed[key] ? lines[key] : placeholders[key]}</p>
      </div>)}</div>
    {oneThing.trim() && <p className="jr-future-week">This week: {oneThing}</p>}
    {error && <p role="alert">{error}</p>}
    <p className="jr-future-close">This is what you chose. A1 is who you need to be to live it.</p>
  </aside>;
}
