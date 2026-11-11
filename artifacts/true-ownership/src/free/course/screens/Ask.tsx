import { useRef, useState } from "react";
import { PATTERNS, FEELINGS, feelingWord, setOneThing } from "../courseState";
import { FeelingIcon, PencilIcon, ShieldIcon } from "../art";
import { RC_EYES_AUDIO_URL, RC_LABEL, type RCUnderneath } from "../../../rcConstants";
import type { ScreenProps } from "../FreeCourse";

const patternOf = (s: ScreenProps["state"]) => PATTERNS[s.pattern ?? "carrying"];
const clip = (text: string, max = 100) => { const t = text.trim(); return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t; };

// FC-08 · The one thing
export function OneThing({ state: s, update }: ScreenProps) {
  const p = patternOf(s);
  return <>
    <p className="fc-chip-quote is-plain">You lean toward · {p.name}</p>
    <h1 className="fc-h1">What's the one thing you've been <em>{p.verb}</em>?</h1>
    <p className="fc-lead">For months. Maybe years. The thing that still doesn't fit.</p>
    <textarea className="fc-field" aria-label={`The one thing I've been ${p.verb}`} value={s.oneThing ?? ""} onChange={e => update(setOneThing(s, e.target.value))} />
    <p className="fc-soft">Don't say it out loud. Just find it.</p>
  </>;
}

// FC-09 · What's underneath it?
export function Underneath({ state: s, update }: ScreenProps) {
  const [other, setOther] = useState(s.underneath === "other");
  const pick = (u: RCUnderneath) => { setOther(u === "other"); update({ ...s, underneath: u }); };
  return <>
    <p className="fc-chip-quote">{patternOf(s).name} · “{clip(s.oneThing ?? "")}”</p>
    <h1 className="fc-h1">What's underneath it?</h1>
    <p className="fc-lead">It's usually fear, guilt, shame or loss. Tap the one that feels true.</p>
    <div className="fc-feelings" role="group" aria-label="What's underneath it?">
      {FEELINGS.map(f => <button key={f.id} className={`fc-feeling${s.underneath === f.id ? " is-picked" : ""}`} aria-pressed={s.underneath === f.id} onClick={() => pick(f.id)}>
        <FeelingIcon feeling={f.id} /><span>{f.name}</span></button>)}
    </div>
    <button className={`fc-else${s.underneath === "other" ? " is-picked" : ""}`} aria-pressed={s.underneath === "other"} onClick={() => pick("other")}>
      <PencilIcon /><span>Something else <em>· name it in your words</em></span></button>
    {(other || s.underneath === "other") && <input className="fc-line-input" aria-label="Name it in your words" placeholder="Name it in your words" maxLength={60}
      value={s.underneathOther ?? ""} onChange={e => update({ ...s, underneath: "other", underneathOther: e.target.value })} />}
    <p className="fc-soft is-center">Answering it means feeling it. That's how you know you're close.</p>
  </>;
}

// FC-10 · It's protecting you
export function Protecting({ state: s }: ScreenProps) {
  const word = feelingWord(s), p = patternOf(s);
  return <>
    <div className="fc-glow"><ShieldIcon /></div>
    <div className="fc-center">
      <p className="fc-eyebrow is-gold">You said · {word}</p>
      <h1 className="fc-h1">{word} has been protecting you.</h1>
      <p className="fc-body">Fear, guilt, shame and loss show up to keep us safe. They got you through. But they don't serve you in the long run. They keep you {p.keep}.</p>
    </div>
    <div className="fc-pair is-today">
      <div className="fc-today"><strong>Today</strong><em>It protects you.</em></div>
      <div className="fc-over"><strong>Over time</strong><em>It costs you.</em></div>
    </div>
  </>;
}

// FC-11 · Look beyond it (deep Spruce)
export function Beyond() {
  return <div className="fc-beyond">
    <p className="fc-eyebrow">Katherine</p>
    <h1 className="fc-h1 is-big">It's time to look beyond it.</h1>
    <p className="fc-bright">Get curious.<br />Give yourself grace.</p>
    <p className="fc-body">You did what you knew to do. Now you get to ask a braver question.</p>
  </div>;
}

// FC-12 · What part of this do I own?
export function PartIOwn({ state: s, update }: ScreenProps) {
  return <>
    <p className="fc-eyebrow">The question</p>
    <h1 className="fc-h1">What part of this do I own?</h1>
    <p className="fc-body">Not to blame. To change.<br />Not what you caused. What you can change.</p>
    <label className="fc-stem"><span className="fc-eyebrow is-gold">The part I own is…</span>
      <textarea className="fc-field" aria-label="The part I own is" value={s.partIOwn ?? ""} onChange={e => update({ ...s, partIOwn: e.target.value })} /></label>
    <p className="fc-rule">If I own everything, I own nothing.</p>
  </>;
}

// Close your eyes. The original scene, with one change for the free course only:
// "Imagine nothing changes." replaces "It's twelve months from now. Nothing has changed."
export function Eyes({ state: s }: ScreenProps) {
  const audio = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false), [playing, setPlaying] = useState(false);
  const lower = RC_LABEL[s.focus ?? "self"].toLowerCase();
  return <div className="rc-room rc-deepwater fc-legacy" data-step="5"><div className="rc-screen"><div className="rc-scene rc-eyes">
    <em className="rc-katherine">Katherine</em><h2>Now close your eyes.</h2>
    <p>Imagine nothing changes. Same {lower}. Same Tuesdays. Breathe, and let yourself see it.</p>
    {RC_EYES_AUDIO_URL && <div className="rc-audio">
      <audio ref={audio} src={RC_EYES_AUDIO_URL} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setAudioError(true)} />
      <button className="rc-play" aria-label={playing ? "Pause Katherine's guidance" : "Play Katherine's guidance"} onClick={() => {
        if (!audio.current) return;
        if (playing) audio.current.pause(); else audio.current.play().catch(() => setAudioError(true));
      }}>{playing ? "Ⅱ" : "▶"}</button><p>0:45 · Katherine guides you</p>
      {audioError && <p role="alert">The audio could not load. You can continue without it.</p>}
    </div>}
  </div></div></div>;
}
