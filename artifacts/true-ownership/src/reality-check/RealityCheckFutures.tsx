import React, { useRef, useState } from "react";
import { RC_EYES_AUDIO_URL, RC_LABEL, RC_DEFAULT_LABEL, type RCState } from "../rcConstants";
import { annualAmounts, endClean, defaultList } from "./rcJourney";
import { summaryInYou } from "./summaryWords";
import { Feelings } from "./RCFeelings";
import { FutureABeats, CompoundTimeline, OctoberLetter } from "./RCFutureScenes";

type Props = {
  state: RCState; update: (s: RCState) => void;
  act: (s: RCState, complete?: boolean, burst?: boolean) => void;
  closeSaved: () => void;
  arriving?: boolean;
};
// Long answers remain available a short section at a time, not in a clipped block.
export function OwnWords({ text }: { text: string }) {
  const [page, setPage] = useState(0);
  const words = text.trim().split(/\s+/).filter(Boolean), pages = Math.max(1, Math.ceil(words.length / 34));
  const current = Math.min(page, pages - 1);
  return <div className="rc-own-words"><p><em>{words.slice(current * 34, (current + 1) * 34).join(" ")}</em></p>
    {pages > 1 && <nav aria-label="Read all my words"><button disabled={current === 0} onClick={() => setPage(current - 1)}>← Earlier words</button><span>{current + 1}/{pages}</span><button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>More of my words →</button></nav>}
  </div>;
}
function Chapter({ children }: { children: React.ReactNode }) { return <p className="rc-eyebrow">{children}</p>; }
export function RealityCheckFutures({ state: s, update, act, closeSaved, arriving }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const area = RC_LABEL[s.focus ?? "self"], lower = area.toLowerCase();
  const defaults = defaultList(s);
  const amounts = annualAmounts(s);
  if (s.step === 5) return <div className="rc-scene rc-eyes">
    <em className="rc-katherine">Katherine</em><h2>Now close your eyes.</h2>
    <p>It's twelve months from now. Nothing has changed. Same {lower}. Same Tuesdays. Breathe, and let yourself see it.</p>
    {RC_EYES_AUDIO_URL && <div className="rc-audio">
      <audio ref={audio} src={RC_EYES_AUDIO_URL} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setAudioError(true)} />
      <button className="rc-play" aria-label={playing ? "Pause Katherine's guidance" : "Play Katherine's guidance"} onClick={() => {
        if (!audio.current) return;
        if (playing) audio.current.pause(); else audio.current.play().catch(() => setAudioError(true));
      }}>{playing ? "Ⅱ" : "▶"}</button><p>0:45 · Katherine guides you</p>
      {audioError && <p role="alert">The audio could not load. You can continue without it.</p>}
    </div>}
  </div>;
  if (s.step === 6) return <FutureABeats state={s} update={update} arriving={arriving} />;
  if (s.step === 7) return <CompoundTimeline state={s} update={update} arriving={arriving} />;
  if (s.step === 8) {
    const five = annualAmounts(s, 5, "always");
    return <div className="rc-scene rc-future-b">
      <h2>Five years since you took it back.</h2>
      {(five.money || five.hours) && <div className="rc-back-grid">{five.money && <section className="rc-future-tile"><h3>BACK IN YOUR POCKET</h3><strong>{five.money}</strong></section>}{five.hours && <section className="rc-future-tile"><h3>BACK IN YOUR LIFE</h3><strong>{five.hours}</strong></section>}</div>}
      <label>How does it feel?</label><Feelings base={["Free", "Calm", "Proud", "Present", "Light"]} value={s.futureB5.feels} change={feels => update({ ...s, futureB5: { ...s.futureB5, feels } })} />
      <label>What does a Tuesday look like now? Write it as if it's already true.
        <textarea rows={3} required aria-label="My Future B Tuesday" value={s.futureB5.tuesday} onChange={e => update({ ...s, futureB5: { ...s.futureB5, tuesday: e.target.value } })} />
      </label>
    </div>;
  }
  if (s.step === 9) return <OctoberLetter state={s} update={update} />;
  if (s.step === 10) return <div className="rc-scene">
    <h2>Which future are you building?</h2><p>Both are real. Only one is yours to choose today.</p>
    <div className="rc-choice-grid">
      <button className="rc-future-choice rc-choose-a" onClick={() => act({ ...s, choice: "A", willing: null, step: 11 })}>
        <span>FUTURE A</span><h3>If nothing changes</h3><p><em>{s.tuesday.split(/\s+/).slice(0, 18).join(" ")}{s.tuesday.split(/\s+/).length > 18 ? "…" : ""}</em></p><strong>I'll keep things as they are</strong>
      </button>
      <button className="rc-future-choice rc-choose-b" onClick={() => act({ ...s, choice: "B", willing: null, step: 11 })}>
        <span>FUTURE B</span><h3>If you own it</h3><p><em>{s.futureB5.tuesday.split(/\s+/).slice(0, 18).join(" ")}{s.futureB5.tuesday.split(/\s+/).length > 18 ? "…" : ""}</em></p><strong>I choose this one →</strong>
      </button>
    </div>
  </div>;
  if (s.step === 11) return s.choice === "A" ? <div className="rc-scene rc-willing">
    <h2>That's an honest answer.</h2><p>Future A is a choice too. Nothing you wrote today is lost. It will be here, in your words, whenever you're ready to look again.</p>
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, step: 8 })}>Look at Future B again →</button><button onClick={closeSaved}>Save and come back later</button></div>
  </div> : <div className="rc-scene rc-willing">
    <em className="rc-katherine">Katherine</em><h2>Are you willing to do what it takes to own your {lower} back?</h2>
    <p>Choosing it is the easy part. Owning it means doing the one thing, even on the Tuesdays when it's hard.</p>
    {s.futureB1.oneThing && <OwnWords text={`“${s.futureB1.oneThing}”`} />}
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, willing: "yes", step: 12 }, true, true)}>Yes, I'm willing</button><button onClick={() => act({ ...s, willing: "not-yet", step: 12 })}>Not yet</button></div>
  </div>;
  if (s.step === 12) return s.willing === "yes" ? <div className="rc-scene rc-chosen">
    <Chapter>FUTURE B · CHOSEN ★</Chapter><h2>You're all in on your {lower}.</h2>
    <section className="rc-chosen-card"><h3>WHERE I AM NOW · WHERE I'M GOING</h3>
      <p className="rc-full-reflection"><em>{[
        `${area} is where it shows up.`, defaults ? `Mostly, I've been ${defaults}.` : "",
        [amounts.money, amounts.hours, s.cost.you.trim()].some(Boolean) ? `It's costing me ${[amounts.money, amounts.hours, summaryInYou(s.cost.you)].filter(Boolean).join(", ")}.` : "",
        "I choose Future B, and I'm willing to do what it takes.",
      ].filter(Boolean).join(" ")}</em></p>
      {s.futureB1.oneThing.trim() && <p className="rc-this-week"><em>This week: {endClean(s.futureB1.oneThing)}.</em></p>}
    </section>
  </div> : <div className="rc-scene rc-chosen rc-notyet">
    <h2>What would need to be true for you to say yes?</h2>
    <label><span className="rc-sr-only">What would help me say yes</span><textarea aria-label="What would help me say yes" value={s.notYetWhy} onChange={e => update({ ...s, notYetWhy: e.target.value })} /></label>
    <p>That's often the real work. A1 starts right there, and your Future B is saved for when you're ready.</p>
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, step: 13 }, true)}>What would help me get there →</button><button onClick={closeSaved}>Save and come back later</button></div>
  </div>;
  return <div className="rc-scene rc-willpower">
    <h2>You won't get there on willpower.</h2>
    <p>Everyone who builds Future B does five things.</p>
    <ol className="rc-five-path">{["Know who you are", "See where you're going", "Surround yourself", "Know your next move", "Trust yourself"].map((text, i) => <li key={text}><span>{i + 1}</span><p>{text}</p></li>)}</ol>
    <p className="rc-bronze"><em>Katherine is with you on every one.</em></p>
  </div>;
}
