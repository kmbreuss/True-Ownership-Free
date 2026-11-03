import React from "react";
import type { RCState } from "../rcConstants";
import "./a1-future-b.css";

const ORDER = [3, 2, 0, 1];
const MIRRORS = ["purpose", "vision", "identity", "values"];
/** Reorder the existing cards themselves: same markup, correct tab/reader order. */
export function A1MirrorOrder({ children, grid = true, presentation }: { children: React.ReactNode; grid?: boolean; presentation?: React.ReactNode }) {
  const cards = React.Children.toArray(children);
  const ordered = ORDER.map(index => React.isValidElement(cards[index])
    ? React.cloneElement(cards[index] as React.ReactElement<Record<string, unknown>>, { "data-a1-mirror": MIRRORS[index] })
    : cards[index]).concat(cards.slice(4));
  return grid ? <div className="na1-mirror-grid">{presentation ?? ordered}</div> : <>{presentation ?? ordered}</>;
}

const THREAD = {
  values: "Which of your values does Future B honour?",
  identity: "Who in you gets you there?",
  purpose: "Why does Future B matter to you?",
  vision: "Your five years becomes ten.",
};
export function A1FutureBThread({ rc, mirror, claimed = false }: { rc: RCState; mirror: keyof typeof THREAD; claimed?: boolean }) {
  return rc.choice === "B" && !claimed ? <p className="a1-future-b-thread"><span>★ FUTURE B</span>
    <em>{THREAD[mirror]}</em></p> : null;
}

export function A1FutureBCard({ rc }: { rc: RCState }) {
  if (rc.choice !== "B") return null;
  const date = rc.completedAt ? new Date(rc.completedAt) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  return <aside className="a1-future-b-card" aria-label="Your Future B">
    <div className="a1-future-b-head">
      <span>YOUR FUTURE B{rc.focus ? ` · ${rc.focus.toUpperCase()}` : ""} · FROM YOUR REALITY CHECK</span>
      {dateLabel && <span>Chosen {dateLabel} ★</span>}
    </div>
    {rc.futureB5.tuesday.trim() && <blockquote>“{rc.futureB5.tuesday}”</blockquote>}
    {rc.futureB1.oneThing.trim() && <p className="a1-future-b-week">This week: {rc.futureB1.oneThing}</p>}
    <p className="a1-future-b-close">This is what you chose. A1 is who you need to be to live it.</p>
  </aside>;
}
