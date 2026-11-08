import type { Mirror3State } from "../mirror3Constants";
import { practicalCreatures, weeklyProjection } from "./practical";
import { usePractical } from "./usePractical";
import "./practical.css";

/** A small read-only addition; A5's existing This week module stays intact. */
export function PracticalHome({ identity, original, value }: { identity?: Mirror3State; original: string; value: string }) {
  const { practical, error } = usePractical();
  if (error) return <p role="alert" className="practical-error">{error}</p>;
  if (!practical.weekReviewedAt) return null;
  const week = weeklyProjection(practical, practicalCreatures(identity), original, value);
  return <section className="a1-practical practical-home" aria-label="Your A1 week">
    <h2>This week, just three things.</h2>
    <ol>{[
      { title: "DO", text: week.do },
      { title: `TRY${week.creature ? ` · ${week.creature.emoji} ${week.creature.name}` : ""}`, text: week.try },
      { title: `NOTICE${value ? ` · ${value}` : ""}`, text: week.notice },
    ].map((item, i) => <li key={i}><span className="practical-number" aria-hidden="true">{i + 1}</span>
      <div><span className="practical-label">{item.title}</span><p>{item.text || "Optional · not chosen yet."}</p></div></li>)}</ol>
  </section>;
}
