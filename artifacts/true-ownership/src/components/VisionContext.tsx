import type { RCState } from "../rcConstants";
import { visionRCContext } from "../visionContext";
import "./vision-context.css";

export function VisionRoomOpening({ area, rc, title, subtitle }: {
  area: "time" | "wealth" | "self"; rc: RCState; title: string; subtitle: string;
}) {
  const context = visionRCContext(area, rc);
  return <>
    {context?.matching && <div className="vision-rc-strip">
      <div className="vision-rc-label">IN YOUR REALITY CHECK, FIVE YEARS OUT, YOU WROTE</div>
      <blockquote>“{context.words}”</blockquote>
    </div>}
    <h2 className="na1-room-title">{context?.matching
      ? `Now look out ten. What does your ${area} look like?` : title}</h2>
    <p className="na2-prose-subtitle">{!context ? subtitle : context.matching
      ? "Your Future B words are already here. Stretch them to ten years, or change anything."
      : `Your Reality Check focused on ${context.focusLabel}. Now look at ${area} too.`}</p>
  </>;
}
