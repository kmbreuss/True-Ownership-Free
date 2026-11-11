import { RC_AREAS, RC_INTRO_VIDEO_URL, type RCArea } from "../../../rcConstants";
import { AREA_COPY, pickArea } from "../courseState";
import { AreaIcon, Check, IconOwnsYou, IconYouOwnIt, PlayGlyph } from "../art";
import type { ScreenProps } from "../FreeCourse";

// FC-01 · Opening
export function Opening() {
  return <>
    {RC_INTRO_VIDEO_URL
      ? <video className="fc-video" controls src={RC_INTRO_VIDEO_URL} aria-label="Katherine's story" />
      : <div className="fc-video is-empty" role="img" aria-label="Katherine's story. Video coming soon.">
        <span className="fc-play" aria-hidden="true"><PlayGlyph /></span>
        <p className="fc-video-by">Katherine · video coming soon</p>
        <p className="fc-video-line">I was 35,000 feet in the air…</p>
      </div>}
    <h1 className="fc-h1">Do you own your life, <em>or does it own you?</em></h1>
    <p className="fc-body">When your life owns you, it doesn't happen all at once. You give it away a piece at a time.</p>
    <p className="fc-soft">Your work. Your wealth. Your time. Your family. You.</p>
    <p className="fc-meta">About 10 minutes · just you</p>
  </>;
}

// FC-02 · What owning your life means
export function Meaning() {
  return <>
    <p className="fc-eyebrow">First, what we mean</p>
    <h1 className="fc-h1">Owning your life isn't about control.</h1>
    <p className="fc-body">It's knowing who you are, and aligning your days, your money, your people and your boundaries to what you want and where you're going.</p>
    <div className="fc-pair">
      <section className="fc-card is-owned"><IconOwnsYou /><h2>When it owns you</h2><p>You react. You drift. You give it away a piece at a time.</p></section>
      <section className="fc-card is-own"><IconYouOwnIt /><h2>When you own it</h2><p>You choose how this part of your life goes. Your life fits you.</p></section>
    </div>
  </>;
}

// FC-03 · Where is your life owning you most right now?
export function Area({ state, update }: ScreenProps) {
  return <>
    <h1 className="fc-h1">Where is your life owning you most right now?</h1>
    <p className="fc-lead">Three parts of your life. Pick the one that's costing you most. The others will be waiting.</p>
    <div className="fc-areas" role="group" aria-label="Where is your life owning you most right now?">
      {RC_AREAS.map((area: RCArea) => <button key={area} className={`fc-area${state.focus === area ? " is-picked" : ""}`}
        aria-pressed={state.focus === area} onClick={() => update(pickArea(state, area))}>
        <span className="fc-area-icon"><AreaIcon area={area} /></span>
        <span className="fc-area-text">
          <span className="fc-area-title">{AREA_COPY[area].title}</span>
          <span className="fc-area-line">{AREA_COPY[area].line}</span>
          <span className="fc-area-covers">{AREA_COPY[area].covers}</span>
        </span>
        {state.focus === area && <span className="fc-tick"><Check /></span>}
      </button>)}
    </div>
  </>;
}
