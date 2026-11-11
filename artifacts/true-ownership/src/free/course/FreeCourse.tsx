import { useEffect, useRef, type ReactNode } from "react";
import type { RCCourseContext } from "../../reality-check/RealityCheck";
import { RealityCheckScreens } from "../../reality-check/RealityCheckScreens";
import { RealityCheckFutures } from "../../reality-check/RealityCheckFutures";
import type { RCState } from "../../rcConstants";
import { MOVEMENT_LABELS, SCREENS, SCREEN_COUNT, courseReady, goTo, movementOf, type CourseScreen } from "./courseState";
import { Area, Meaning, Opening } from "./screens/Intro";
import { Price } from "./screens/Price";
import { Mirror, Statements, Lean } from "./screens/Mirror";
import { OneThing, Underneath, Protecting, Beyond, PartIOwn } from "./screens/Ask";
import "./course.css";

export interface ScreenProps { state: RCState; update: (next: RCState) => boolean; go: (screen: number) => void }

// Each screen's primary button, as written in the mockups.
const FORWARD: Partial<Record<CourseScreen, string>> = {
  opening: "I'm ready →", meaning: "Show me where →", area: "This one →", tuesday: "Show me the price →", price: "Keep going →",
  mirror: "Show me mine →", statements: "Show me what I see →", lean: "Look underneath →", oneThing: "That's it →",
  underneath: "Keep going →", protecting: "Look beyond it →", beyond: "Ask it →", partIOwn: "See where it leads →", eyes: "Show me →",
};
// Deep Spruce screens (full-bleed, cream text).
const DEEP: CourseScreen[] = ["beyond", "eyes"];

export function FreeCourse({ ctx }: { ctx: RCCourseContext }) {
  const { state, update } = ctx;
  const i = Math.max(0, Math.min(SCREEN_COUNT - 1, state.fcScreen ?? 0));
  const id = SCREENS[i];
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [i]);
  const go = (n: number) => { update(goTo(state, n)); };
  const props: ScreenProps = { state, update, go };
  const current = movementOf(i);
  const keepScreen = (next: RCState) => { update({ ...next, step: state.step, fcScreen: i }); };
  let content: ReactNode;
  switch (id) {
    case "opening": content = <Opening />; break;
    case "meaning": content = <Meaning />; break;
    case "area": content = <Area {...props} />; break;
    case "tuesday": // The original scene, unchanged. It keeps its own look inside this wrapper.
      content = <div className="rc-room fc-legacy" data-step="3"><div className="rc-screen">
        <RealityCheckScreens state={{ ...state, step: 3 }} phone={false} people={false} mirrorPaged={false} onMirrorLayout={() => {}} update={keepScreen} />
      </div></div>; break;
    case "price": content = <Price {...props} />; break;
    case "mirror": content = <Mirror />; break;
    case "statements": content = <Statements {...props} />; break;
    case "lean": content = <Lean {...props} />; break;
    case "oneThing": content = <OneThing {...props} />; break;
    case "underneath": content = <Underneath {...props} />; break;
    case "protecting": content = <Protecting {...props} />; break;
    case "beyond": content = <Beyond />; break;
    case "partIOwn": content = <PartIOwn {...props} />; break;
    case "eyes": // Close your eyes: the original scene, unchanged.
      content = <div className="rc-room rc-deepwater fc-legacy" data-step="5"><div className="rc-screen">
        <RealityCheckFutures state={{ ...state, step: 5 }} update={keepScreen} act={() => {}} closeSaved={ctx.closeSaved} />
      </div></div>; break;
    default: content = <div className="fc-stub"><p className="fc-eyebrow">Not built yet</p><h1 className="fc-h1">{id}</h1><p className="fc-body">This screen arrives in a later part of the build.</p></div>;
  }
  const forward = FORWARD[id];
  return <div className={`fc-root${DEEP.includes(id) ? " is-deep" : ""}`}>
    <header className="fc-head"><span>The Reality Check</span></header>
    <button className="na1-room-close" ref={ctx.closeRef} aria-label="Close Reality Check" onClick={ctx.close}>×</button>
    <nav className="fc-bar" aria-label="Reality Check movements">
      <ol>{MOVEMENT_LABELS.map((label, n) => <li key={label} className={n < current ? "is-done" : n === current ? "is-current" : ""} aria-current={n === current ? "step" : undefined}><span className="fc-sr">{label}</span></li>)}</ol>
      <p>{MOVEMENT_LABELS[current]}</p>
    </nav>
    <div className="fc-scroll" ref={body} tabIndex={0} role="region" aria-label="Reality Check content"><div className="fc-screen" key={i}>{content}</div></div>
    <footer className="fc-foot">
      {i > 0 ? <button className="fc-back" onClick={() => go(i - 1)}>← Back</button> : <span />}
      {forward && <button className="na1-btn-gold fc-next" disabled={!courseReady(state, i)} onClick={() => go(i + 1)}>{forward}</button>}
    </footer>
  </div>;
}
