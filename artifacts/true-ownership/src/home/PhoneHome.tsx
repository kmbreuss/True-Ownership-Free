import { useState, type ReactNode } from "react";
import { isDevPreview } from "../devPreview";
import { MirrorIllustration, type MirrorIllustrationId } from "../mirrorIllustrations/MirrorIllustration";
import { availableRecordings } from "../components/AudioPage";
import { practicalCreatures, weeklyProjection } from "../a1End/practical";
import { usePractical } from "../a1End/usePractical";
import type { Mirror3State } from "../mirror3Constants";
import type { VideoSurface } from "../videoConstants";
import type { homeProjection, HomeStep } from "./model";
import "./home.css";

type Tab = "today" | "week" | "future";
const tabs: { id: Tab; name: string }[] = [{id:"today",name:"Today"},{id:"week",name:"This week"},{id:"future",name:"Future B"}];
function initialTab(): Tab {
  if (isDevPreview()) return "today";
  try { const v=localStorage.getItem("to_home_tab_v1"); return v==="week" || v==="future" ? v : "today"; } catch { return "today"; }
}
export function PhoneHome({ name, model, identity, original, value, reviewed = false, onContinue, onMap, onWeek,
  onRC, renderPlayer, future, reminders, commitments, controls, children }: {
  name?: string; model: ReturnType<typeof homeProjection>; identity: Mirror3State; original: string; value: string; reviewed?: boolean;
  onContinue: (step: HomeStep) => void; onMap: () => void; onWeek: () => void; onRC?: () => void;
  renderPlayer: (surface: VideoSurface) => ReactNode; future: ReactNode; reminders: ReactNode; commitments: ReactNode;
  controls: ReactNode; children: ReactNode;
}) {
  const [tab,setTab]=useState<Tab>(initialTab);
  const { practical,error }=usePractical();
  const week=weeklyProjection(practical,practicalCreatures(identity),original,value);
  const recordings=availableRecordings(surface=>model.availableSurfaces.has(surface));
  const recording=recordings.find(r=>r.surface===model.next?.surface) || recordings.find(r=>r.surface==="entry-hall");
  const select=(next:Tab) => {
    setTab(next);
    if (!isDevPreview()) try { localStorage.setItem("to_home_tab_v1",next); } catch { /* optional browser preference */ }
  };
  const firstName=name?.trim().split(/\s+/)[0];
  const futureCard=model.rcComplete ? future : <section className="ph-card ph-placeholder">
    <p>Your Future B appears after the Reality Check.</p>
    {onRC && <button className="ph-action" onClick={onRC}>Start the Reality Check →</button>}
  </section>;
  return <div className="phone-home">
    <header className="ph-greeting">
      <h1>{firstName ? `Hi, ${firstName}` : "Hi there"}</h1>
      <p>{model.latestClaim ? `Last time you claimed your ${model.latestClaim}.` : "Welcome back."}</p>
    </header>
    <div className="ph-tabs" role="tablist" aria-label="Home">
      {tabs.map((t,i)=><button key={t.id} id={`home-tab-${t.id}`} role="tab" aria-selected={tab===t.id}
        aria-controls={`home-panel-${t.id}`} tabIndex={tab===t.id ? 0 : -1} onClick={()=>select(t.id)}
        onKeyDown={e=>{
          const next=e.key==="ArrowRight" ? (i+1)%3 : e.key==="ArrowLeft" ? (i+2)%3 : e.key==="Home" ? 0 : e.key==="End" ? 2 : -1;
          if(next>=0){e.preventDefault();select(tabs[next].id);document.getElementById(`home-tab-${tabs[next].id}`)?.focus();}
        }}>{t.name}</button>)}
    </div>
    <div id={`home-panel-${tab}`} role="tabpanel" aria-labelledby={`home-tab-${tab}`} className={`ph-panel ph-${tab}`}>
      {tab==="today" ? <>
        <div className="ph-main">
          <section className="ph-card ph-next">
            {model.next ? <>
              {model.next.id!=="rc" && model.next.id!=="a4-promises" && <MirrorIllustration id={model.next.id as MirrorIllustrationId} state="next"/>}
              {model.next.id==="rc" && <div className="ph-rc-art" aria-hidden="true">◯ <span>→</span> ★</div>}
              <p className="ph-eyebrow">YOUR NEXT STEP{model.next.minutes ? ` · ABOUT ${model.next.minutes} MIN` : ""}</p>
              <h2>{model.next.title}</h2><p>{model.next.description}</p>
              <button className="ph-action" onClick={()=>onContinue(model.next!)}>Continue →</button>
            </> : model.finished ? <>
              <p className="ph-eyebrow">YOUR ROAD</p><h2>You&apos;ve walked the whole road.</h2>
              <button className="ph-action" onClick={onMap}>See your Map of Me →</button>
            </> : <><h2>Your next step</h2><p>Unlocks when you join</p>{onRC && <button className="ph-action" onClick={onRC}>Review the Reality Check →</button>}</>}
          </section>
          {reminders}
        </div>
        <aside className="ph-aside">
          {recording && <section className="ph-audio" aria-label="Katherine’s recording">{renderPlayer(recording.surface)}</section>}
          <div className="ph-desktop-future">{futureCard}</div>
        </aside>
      </> : tab==="week" ? <div className="ph-week-content">
        {error ? <p role="alert">{error}</p> : practical.weekReviewedAt || model.a1Complete && reviewed ? <>
          <ol className="ph-week-cards">{[
            {label:"DO",text:week.do},
            {label:`TRY${week.creature ? ` · ${week.creature.emoji} ${week.creature.name}` : ""}`,text:week.try},
            {label:`NOTICE${value ? ` · ${value}` : ""}`,text:week.notice},
          ].map((item,i)=><li key={i}><button className="ph-card" onClick={onWeek} aria-label={`Review ${item.label}`}>
            <span className="ph-number">{i+1}</span><span><span className="ph-eyebrow">{item.label}</span>
            <span className="ph-week-answer">{item.text || "Optional · not chosen yet."}</span></span>
          </button></li>)}</ol>
          <p className="ph-set-aside">Everything else is set aside, not lost.</p>
        </> : <section className="ph-card"><p>Your week fills in at the end of A1.</p>{original && <p>For now: “{original}”</p>}</section>}
        {commitments}
      </div> : <div className="ph-future-content">{futureCard}</div>}
    </div>
    <nav className="ph-links" aria-label="Getting started">{controls}</nav>
    <details className="ph-introduction"><summary>Before you start</summary>{children}</details>
  </div>;
}
