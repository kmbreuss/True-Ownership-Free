import React, { useRef, useState } from "react";
import { RC_EYES_AUDIO_URL, RC_LABEL, RC_DEFAULT_LABEL, type RCState } from "../rcConstants";
import { annualAmounts, futureAReadback, journeyMonth } from "./rcJourney";

type Props = {
  state: RCState; update: (s: RCState) => void;
  act: (s: RCState, complete?: boolean, burst?: boolean) => void;
  closeSaved: () => void;
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
function Feelings({ base, value, change }: { base: string[]; value: string[]; change: (v: string[]) => void }) {
  const custom = value.find(v => !base.includes(v)) ?? "";
  const [own, setOwn] = useState(!!custom);
  return <div className="rc-feelings"><div className="rc-feeling-chips">{base.map(word => <button key={word} aria-pressed={value.includes(word)} onClick={() => change(value.includes(word) ? value.filter(v => v !== word) : [...value, word])}>{word}</button>)}
    {!own && <button aria-expanded={false} onClick={() => setOwn(true)}>+ My own</button>}
    {own && <label className="rc-custom-feeling"><span className="rc-sr-only">My own feeling</span><input aria-label="My own feeling" placeholder="My own feeling" value={custom} onChange={e => change([...value.filter(v => base.includes(v)), ...(e.target.value ? [e.target.value] : [])])} /><button aria-label="Hide my own feeling" onClick={e => { e.preventDefault(); setOwn(false); }}>×</button></label>}</div>
  </div>;
}
function Chapter({ children }: { children: React.ReactNode }) { return <p className="rc-eyebrow">{children}</p>; }
export function RealityCheckFutures({ state: s, update, act, closeSaved }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const area = RC_LABEL[s.focus ?? "self"], lower = area.toLowerCase(), month = journeyMonth(s);
  const defaults = s.topDefaults.map(d => RC_DEFAULT_LABEL[d]).join(" and ");
  const amounts = annualAmounts(s);
  const aText = futureAReadback(s);
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
  if (s.step === 6) return <div className="rc-scene">
    <Chapter>ONE YEAR FROM NOW</Chapter><h2>It's next {month}.</h2>
    {aText && <OwnWords text={aText} />}
    <p className="rc-small">Every line here is yours, from the last few minutes.</p>
    <label>One more thing you see in that future <span className="rc-optional">Optional</span>
      <input value={s.futureA.extra} onChange={e => update({ ...s, futureA: { extra: e.target.value } })} />
    </label>
  </div>;
  if (s.step === 7) return <div className="rc-scene rc-compound">
    <Chapter>IT DOESN'T STAY THE SAME</Chapter><h2>It compounds.</h2>
    {(amounts.money || amounts.hours) && <div className="rc-compound-grid">{[1, 3, 5].map(years => {
      const total = annualAmounts(s, years, "threshold");
      return <section className="rc-future-tile" key={years}><h3>{years} {years === 1 ? "YEAR" : "YEARS"}</h3><strong>{[total.money, total.hours].filter(Boolean).join(" · ")}</strong></section>;
    })}</div>}
    <label>By then, how does it feel?</label>
    <Feelings base={["Heavier", "Resentful", "Numb", "Exhausted", "Stuck"]} value={s.compound.feels} change={feels => update({ ...s, compound: { ...s.compound, feels } })} />
    <label>What results has it created by then?<input placeholder={s.focus === "time" ? "More missed moments · the work that never gets done" : s.focus === "wealth" ? "The things I keep putting off · what I can't afford" : "The way I treat myself · what I no longer do"} value={s.compound.results} onChange={e => update({ ...s, compound: { ...s.compound, results: e.target.value } })} /></label>
    <label>Who else is feeling it by then?<input value={s.compound.whoElse} onChange={e => update({ ...s, compound: { ...s.compound, whoElse: e.target.value } })} /></label>
  </div>;
  if (s.step === 8) {
    const five = annualAmounts(s, 5, "always");
    return <div className="rc-scene rc-future-b">
      <Chapter>FIVE YEARS FROM NOW</Chapter><h2>Five years on. You took it back.</h2>
      {(five.money || five.hours) && <div className="rc-back-grid">{five.money && <section className="rc-future-tile"><h3>BACK IN YOUR POCKET</h3><strong>{five.money}</strong></section>}{five.hours && <section className="rc-future-tile"><h3>BACK IN YOUR LIFE</h3><strong>{five.hours}</strong></section>}</div>}
      <label>How does it feel?</label><Feelings base={["Free", "Calm", "Proud", "Present", "Light"]} value={s.futureB5.feels} change={feels => update({ ...s, futureB5: { ...s.futureB5, feels } })} />
      <label>What does a Tuesday look like now? Write it as if it's already true.
        <textarea rows={3} required aria-label="My Future B Tuesday" value={s.futureB5.tuesday} onChange={e => update({ ...s, futureB5: { ...s.futureB5, tuesday: e.target.value } })} />
      </label>
      <label>Who notices the difference?<input value={s.futureB5.whoNotices} onChange={e => update({ ...s, futureB5: { ...s.futureB5, whoNotices: e.target.value } })} /></label>
    </div>;
  }
  if (s.step === 9) return <div className="rc-scene">
    <Chapter>BRING IT BACK TO ONE YEAR</Chapter><h2>Next {month}. You're on your way.</h2><p>Five years starts with this one.</p>
    <label>What will you be doing by next {month}?<textarea rows={3} value={s.futureB1.doing} onChange={e => update({ ...s, futureB1: { ...s.futureB1, doing: e.target.value } })} /></label>
    <label>What is the one thing you'd need to do differently, starting this week?
      <textarea rows={3} required aria-label="My one thing this week" value={s.futureB1.oneThing} onChange={e => update({ ...s, futureB1: { ...s.futureB1, oneThing: e.target.value } })} />
    </label>
    <p className="rc-support-note">→ This becomes the first promise waiting for you in A4. You won't have to start from a blank page.</p>
  </div>;
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
  if (s.step === 11) return s.choice === "A" ? <div className="rc-scene">
    <h2>That's an honest answer.</h2><p>Future A is a choice too. Nothing you wrote today is lost. It will be here, in your words, whenever you're ready to look again.</p>
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, step: 8 })}>Look at Future B again →</button><button onClick={closeSaved}>Save and come back later</button></div>
  </div> : <div className="rc-scene">
    <em className="rc-katherine">Katherine</em><h2>Are you willing to do what it takes to own your {lower} back?</h2>
    <p>Choosing it is the easy part. Owning it means doing the one thing, even on the Tuesdays when it's hard.</p>
    {s.futureB1.oneThing && <OwnWords text={`“${s.futureB1.oneThing}”`} />}
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, willing: "yes", step: 12 }, true, true)}>Yes, I'm willing</button><button onClick={() => act({ ...s, willing: "not-yet", step: 12 })}>Not yet</button></div>
  </div>;
  if (s.step === 12) return s.willing === "yes" ? <div className="rc-scene rc-chosen">
    <Chapter>FUTURE B · CHOSEN ★</Chapter><h2>You're all in on your {lower}.</h2>
    <section className="rc-chosen-card"><h3>WHERE I AM NOW · WHERE I'M GOING</h3>
      <OwnWords text={[
        `${area} is where it shows up.`, defaults ? `Mostly, I've been ${defaults}.` : "",
        [amounts.money, amounts.hours, s.cost.you].some(Boolean) ? `It's costing me ${[amounts.money, amounts.hours, s.cost.you].filter(Boolean).join(", ")}.` : "",
        "I choose Future B, and I'm willing to do what it takes.", s.futureB1.oneThing ? `This week: ${s.futureB1.oneThing}` : "",
      ].filter(Boolean).join(" ")} />
    </section>
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, step: 13 })}>What will get me there →</button></div>
  </div> : <div className="rc-scene">
    <h2>What would need to be true for you to say yes?</h2>
    <label><span className="rc-sr-only">What would help me say yes</span><textarea aria-label="What would help me say yes" value={s.notYetWhy} onChange={e => update({ ...s, notYetWhy: e.target.value })} /></label>
    <p>That's often the real work. A1 starts right there, and your Future B is saved for when you're ready.</p>
    <div className="rc-scene-actions"><button className="na1-btn-gold" onClick={() => act({ ...s, step: 13 }, true)}>What would help me get there →</button><button onClick={closeSaved}>Save and come back later</button></div>
  </div>;
  return <div className="rc-scene rc-willpower">
    <Chapter>THE TRUTH ABOUT FUTURE B</Chapter><h2>You won't get there on willpower.</h2>
    <p>{defaults ? <>{defaults[0].toUpperCase() + defaults.slice(1)} {s.topDefaults.length > 1 ? "are habits" : "is a habit"}, not {s.topDefaults.length > 1 ? "flaws" : "a flaw"}. By Tuesday, {s.topDefaults.length > 1 ? "they pull" : "it pulls"} you back. </> : null}Everyone who builds Future B has the same three things holding them.</p>
    <div className="rc-support-grid">
      <section className="rc-future-tile"><h3>CLARITY</h3><p>Know who you are and what matters, so every no gets easier.</p></section>
      <section className="rc-future-tile"><h3>A PLAN THAT'S SORTED FOR YOU</h3><p>One next move at a time. Never a blank page.</p></section>
      <section className="rc-future-tile"><h3>SOMEONE IN YOUR CORNER</h3><p>Katherine guiding every step, and a weekly check-in that holds you to it.</p></section>
    </div>
    <p className="rc-support-note">What you're really building isn't a plan. It's the ability to trust yourself again. That's what the next five steps are: your Future B, built one A at a time.</p>
  </div>;
}
