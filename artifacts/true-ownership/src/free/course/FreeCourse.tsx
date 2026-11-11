import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RCCourseContext } from "../../reality-check/RealityCheck";
import { RealityCheckScreens } from "../../reality-check/RealityCheckScreens";
import { RealityCheckFutures } from "../../reality-check/RealityCheckFutures";
import type { RCState } from "../../rcConstants";
import { freeRequest, type Account } from "../api";
import { flushNewFlowForSignOut, resumeNewFlowAfterSignOutFailure } from "../../newFlowSync";
import { MOVEMENT_LABELS, SCREENS, SCREEN_COUNT, courseReady, goTo, movementOf, screenIndex, sceneAnswered, type CourseScreen } from "./courseState";
import { SCENE_STEPS } from "./tiles";
import { Area, Meaning, Opening } from "./screens/Intro";
import { Price } from "./screens/Price";
import { Mirror, Statements, Lean } from "./screens/Mirror";
import { OneThing, Underneath, Protecting, Beyond, PartIOwn, Eyes, Letter } from "./screens/Ask";
import { FutureA, Turn, FutureB, Scene, YourB, Take, PosterButton } from "./screens/Futures";
import { Bridge, Road, Get } from "./screens/Act";
import "./course.css";

const NOT_YET_LINE = "That's often the real work. Your Future B is saved for when you're ready.";

export interface ScreenProps { state: RCState; update: (next: RCState) => boolean; go: (screen: number) => void; account?: Account }

// Each screen's primary button, as written in the mockups.
const FORWARD: Partial<Record<CourseScreen, string>> = {
  opening: "I'm ready →", meaning: "Show me where →", area: "This one →", tuesday: "Show me the price →", price: "Keep going →",
  mirror: "Show me mine →", statements: "Show me what I see →", lean: "Look underneath →", oneThing: "That's it →",
  underneath: "Keep going →", protecting: "Look beyond it →", beyond: "Ask it →", partIOwn: "See where it leads →", eyes: "Show me →",
  futureA: "Now turn around →", turn: "Show me →", futureB: "Picture it →", yourB: "Choose my future →", letter: "Choose my future →", take: "Where to next →",
  bridge: "Show me the five →", road: "What I get →", get: "Join the waitlist →",
};
// Deep Spruce screens (full-bleed, cream text).
const DEEP: CourseScreen[] = ["beyond", "eyes", "turn"];
const tone = (id: CourseScreen) => DEEP.includes(id) ? " is-deep" : id === "futureA" ? " is-grey" : id === "futureB" ? " is-warm" : "";

export function FreeCourse({ ctx, account, onAccount, onJoined }: { ctx: RCCourseContext; account?: Account; onAccount?: (a: Account) => void; onJoined?: () => void }) {
  const { state, update } = ctx;
  const i = Math.max(0, Math.min(SCREEN_COUNT - 1, state.fcScreen ?? 0));
  const id = SCREENS[i];
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [i]);
  const [sceneStep, setSceneStep] = useState(0);
  const [joining, setJoining] = useState(false), [joinError, setJoinError] = useState("");
  // Entering FC-16 going forward starts at Morning; coming back to it from FC-17 lands on its last step.
  const go = (n: number) => { if (SCREENS[n] === "scene") setSceneStep(n > i ? 0 : SCENE_STEPS.length - 1); update(goTo(state, n)); };
  const props: ScreenProps = { state, update, go, account };
  const current = movementOf(i);
  const keepScreen = (next: RCState) => {
    // The letter's "one thing" is also the first step on FC-18, so keep them the same.
    const synced = id === "letter" && next.futureB1.oneThing !== state.futureB1.oneThing ? { ...next, firstStep: next.futureB1.oneThing } : next;
    update({ ...synced, step: state.step, fcScreen: i });
  };
  // The original Choose / Willing scenes steer by legacy step numbers. Map each to the course screen.
  const courseAct = (next: RCState, complete = false, celebrate = false) => {
    const target = next.step === 8 ? screenIndex("yourB") : next.step === 11 ? screenIndex("willing")
      : next.step === 12 && next.willing === "yes" ? screenIndex("take") : next.step === 13 ? screenIndex("bridge") : i;
    ctx.act(goTo(next, target), complete, celebrate);
  };
  // Free course only: the original Not yet reflection line is replaced here, so the shared scene stays untouched.
  const notYetRef = (node: HTMLDivElement | null) => {
    const p = node?.querySelector(".rc-notyet > p");
    if (p && p.textContent !== NOT_YET_LINE) p.textContent = NOT_YET_LINE;
  };
  const legacy = (step: number, cls = "") => <div ref={step === 12 ? notYetRef : undefined} className={`rc-room ${cls} fc-legacy`} data-step={step}><div className="rc-screen">
    <RealityCheckFutures state={{ ...state, step }} update={keepScreen} act={courseAct} closeSaved={ctx.closeSaved} />
  </div></div>;
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
    case "eyes": content = <Eyes {...props} />; break;
    case "futureA": content = <FutureA {...props} />; break;
    case "turn": content = <Turn />; break;
    case "futureB": content = <FutureB {...props} />; break;
    case "scene": content = <Scene {...props} step={sceneStep} setStep={setSceneStep} />; break;
    case "yourB": content = <YourB {...props} />; break;
    case "letter": content = <Letter {...props} />; break;
    case "choose": content = legacy(10); break;
    case "willing": // Not yet: the original reflection, with the poster offered under it.
      content = <>{legacy(state.willing === "not-yet" ? 12 : 11)}{state.willing === "not-yet" && <PosterButton state={state} account={account} />}</>; break;
    case "bridge": content = <Bridge />; break;
    case "road": content = <Road />; break;
    case "get": content = <Get error={joinError} />; break;
    case "ending": content = ctx.ending ? ctx.ending(state) : null; break;
    case "take": content = <Take {...props} />; break;
    default: content = <div className="fc-stub"><p className="fc-eyebrow">Not built yet</p><h1 className="fc-h1">{id}</h1><p className="fc-body">This screen arrives in a later part of the build.</p></div>;
  }
  const onScene = id === "scene";
  const forward = onScene ? (sceneStep < SCENE_STEPS.length - 1 ? `Next · ${SCENE_STEPS[sceneStep + 1].short} →` : "Show me →") : FORWARD[id];
  const ready = onScene ? sceneAnswered(state, SCENE_STEPS[sceneStep].key) : courseReady(state, i);
  // FC-21 joins the waitlist (answers saved first), then shows the existing ending. Already on the list: straight to it.
  async function join() {
    if (account?.waitlistedAt) { go(i + 1); return; }
    setJoining(true); setJoinError("");
    try {
      await flushNewFlowForSignOut();
      onAccount?.(await freeRequest<Account>("/free/waitlist")); onJoined?.(); go(i + 1);
    } catch (err) { setJoinError(err instanceof Error ? err.message : "Could not save. Please try again."); }
    finally { resumeNewFlowAfterSignOutFailure(); setJoining(false); }
  }
  const forwardClick = () => { if (id === "get") void join(); else if (onScene && sceneStep < SCENE_STEPS.length - 1) setSceneStep(sceneStep + 1); else go(i + 1); };
  const backClick = () => { if (onScene && sceneStep > 0) setSceneStep(sceneStep - 1); else go(i - 1); };
  return <div className={`fc-root${tone(id)}`}>
    <header className="fc-head"><span>The Reality Check</span></header>
    <button className="na1-room-close" ref={ctx.closeRef} aria-label="Close Reality Check" onClick={ctx.close}>×</button>
    <nav className="fc-bar" aria-label="Reality Check movements">
      <ol>{MOVEMENT_LABELS.map((label, n) => <li key={label} className={n < current ? "is-done" : n === current ? "is-current" : ""} aria-current={n === current ? "step" : undefined}><span className="fc-sr">{label}</span></li>)}</ol>
      <p>{MOVEMENT_LABELS[current]}</p>
    </nav>
    <div className="fc-scroll" ref={body} tabIndex={0} role="region" aria-label="Reality Check content"><div className="fc-screen" key={i}>{content}</div></div>
    <footer className="fc-foot">
      {i > 0 ? <button className="fc-back" onClick={backClick}>← Back</button> : <span />}
      {forward && <button className="na1-btn-gold fc-next" disabled={!ready || joining} onClick={forwardClick}>{id === "get" && joining ? "Saving…" : id === "get" && account?.waitlistedAt ? "Your Future B →" : forward}</button>}
    </footer>
  </div>;
}
