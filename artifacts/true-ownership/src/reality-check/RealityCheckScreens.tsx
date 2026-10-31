import React, { useState } from "react";
import {
  RC_AREAS, RC_LABEL, RC_DEFINITION, RC_INTRO_VIDEO_URL, RC_AREA_SYMPTOMS, RC_SYMPTOMS,
  focusOptions, scoreWords, toggleSymptom, withScore,
  type RCState, type RCArea, type RCDefault,
} from "../rcConstants";

type Props = { state: RCState; update: (state: RCState) => void };
export function RCVideo() {
  return RC_INTRO_VIDEO_URL
    ? <video className="rc-video" controls src={RC_INTRO_VIDEO_URL} aria-label="Person A or Person B?" />
    : <div className="rc-video rc-video-empty"><span>WATCH FIRST · KATHERINE · ABOUT 2 MIN</span><h3>Person A or Person B?</h3><p>Video coming soon. You can continue without watching.</p></div>;
}
export const DEFAULT_CARDS: { key: RCDefault; title: string; text: string; sounds: string; prompt: string }[] = [
  { key: "avoiding", title: "Avoiding", text: "Deciding it isn't important. Pushing through. Putting it off.", sounds: 'avoiding the hard conversation you know you need to have. Knowing what to do and putting it off. "I don\'t have time" is how avoiding sounds out loud.', prompt: "What are you avoiding?" },
  { key: "blaming", title: "Blaming", text: "The cause is out there: the boss, the market, the economy, someone else.", sounds: "blaming outside things for why it isn't working. Feeling resentful but saying nothing.", prompt: "Who or what have you been blaming?" },
  { key: "carrying", title: "Carrying", text: "Taking on things that aren't yours to carry. The fixer.", sounds: "taking on other people's problems as if they're your own. Stepping in to fix it before anyone else can. Saying yes when every part of you wants to say no.", prompt: "What are you carrying that isn’t yours?" },
  { key: "hoping", title: "Blindly hoping", text: "Waiting for it to change, or bringing someone in, and hoping it sorts itself out without anything changing on your side.", sounds: 'waiting for the "perfect" moment. Hoping someone will notice.', prompt: "What are you hoping will change on its own?" },
];
const PERSON_A = ["Wakes up and checks their phone. Already behind. Already reacting.", "Says yes when they mean no.", "Waits for permission, or the perfect moment.", "Blames the economy, the boss, the circumstances."];
const PERSON_B = ["Knows exactly what matters today.", "Can say no without guilt.", "Owns their results. Owns their life.", "When something goes wrong, looks in the mirror first."];
const DETAILS = {
  self: "How you speak to yourself, how you see yourself, your energy, whether you're still growing.",
  time: "Work, family, friends, rest and play, your health.",
  wealth: "Cash flow, what you're building for later, feeling secure.",
};
function Quote({ state }: { state: RCState }) {
  if (!state.focus) return null;
  const text = state.reality[state.focus].text;
  const first = text.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim() || text.split("\n")[0];
  return <div className="rc-quote"><span>{RC_LABEL[state.focus]} · </span><em>“{first}”</em></div>;
}
export function RealityCheckScreens({ state: s, update }: Props) {
  const [person, setPerson] = useState<"A" | "B">("A");
  const [phoneArea, setPhoneArea] = useState<RCArea>("self");
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  const focus = s.focus ?? "self";
  const setReality = (patch: Partial<RCState["reality"]["self"]>) =>
    update({ ...s, reality: { ...s.reality, [focus]: { ...s.reality[focus], ...patch } } });
  if (s.step === 1) return <>
    <p className="rc-eyebrow">LOOK · WATCH FIRST</p><h2>Person A or Person B?</h2>
    <div className="rc-opening">
      <div><RCVideo /><p>Katherine will ask you to close your eyes and picture twelve months from now, twice. Once if nothing changes. Once if you own it.</p></div>
      <div>
        <div className="rc-phone-tabs"><button aria-pressed={person === "A"} onClick={() => setPerson("A")}>Person A</button><button aria-pressed={person === "B"} onClick={() => setPerson("B")}>Person B</button></div>
        {(["A", "B"] as const).map(p => <section key={p} className={`rc-person rc-person-${p} ${person !== p ? "rc-phone-hidden" : ""}`}><h3>Person {p}</h3><ul>{(p === "A" ? PERSON_A : PERSON_B).map(line => <li key={line}>{line}</li>)}</ul></section>)}
      </div>
    </div>
  </>;
  if (s.step === 2) {
    const options = focusOptions(s.scores);
    return <>
      <p className="rc-eyebrow">LOOK · THE OWN IT SCALE</p><h2>Who's owning whom, right now?</h2>
      <p>Owning it means you're choosing how this part of your life goes, not just reacting to it. 1 is it owns me, 10 is I own it.</p>
      <div className="rc-phone-tabs">{RC_AREAS.map(a => <button key={a} aria-pressed={phoneArea === a} onClick={() => setPhoneArea(a)}>{RC_LABEL[a]}{s.scores[a] == null ? "" : ` · ${s.scores[a]}`}</button>)}</div>
      <div className="rc-columns">{RC_AREAS.map(area => {
        const n = s.scores[area];
        return <section key={area} className={`rc-panel ${phoneArea !== area ? "rc-phone-hidden" : ""}`}>
          <h3>{RC_LABEL[area]}</h3><p className="rc-card-description">{RC_DEFINITION[area]}</p>
          <details className="rc-scale-helper"><summary>What this includes</summary><p>{DETAILS[area]}</p></details>
          <div className={`rc-score rc-band-${n == null ? "unset" : n <= 4 ? "low" : n <= 6 ? "mid" : "high"}`} aria-live="polite">
            <strong>{n ?? "—"}</strong><span>{n == null ? "Choose your number" : scoreWords(n)}</span>
          </div>
          <input type="range" min={1} max={10} step={1} value={n ?? 5} className={`rc-slider rc-slider-${n == null ? "unset" : n <= 4 ? "low" : n <= 6 ? "mid" : "high"}${n == null ? " rc-unset" : ""}`}
            aria-label={`${RC_LABEL[area]} Own It scale`} aria-valuetext={n == null ? "Not scored. Use arrow keys to choose a number." : `${n}: ${scoreWords(n)}`}
            onPointerDown={e => { if (n == null) { const rect = e.currentTarget.getBoundingClientRect(); update(withScore(s, area, Math.max(1, Math.min(10, Math.round(1 + (e.clientX - rect.left) / rect.width * 9))))); } }}
            onKeyDown={e => { if (n == null && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) { e.preventDefault(); update(withScore(s, area, e.key === "End" ? 10 : e.key === "Home" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? 4 : 6)); } }}
            onChange={e => update(withScore(s, area, Number(e.target.value)))} />
          <div className="rc-scale-ends"><span>1 · It owns me</span><span>10 · I own it</span></div>
        </section>;
      })}</div>
      {options.kind !== "incomplete" && <div className="rc-suggest" aria-live="polite">
        <p>{options.kind === "high" ? "You're owning a lot. Which one would you most like to own more?"
          : options.kind === "tie" ? `${options.areas.map(a => RC_LABEL[a]).join(" and ")} are ${options.areas.length === 2 ? "both" : "all"} at ${s.scores[options.areas[0]]}. Which one first?`
          : <><strong>{RC_LABEL[options.areas[0]]}</strong> is owning you most right now, at {s.scores[options.areas[0]]}. Start there? The others will be waiting for you.</>}</p>
        <div className="rc-chips"><span>or choose</span>{RC_AREAS.map(area => <button key={area} aria-pressed={s.focus === area} onClick={() => update({ ...s, focus: area, focusChosenBy: "picked" })}>{RC_LABEL[area]} · {s.scores[area]}</button>)}</div>
      </div>}
    </>;
  }
  if (s.step === 3) return <>
    <p>{RC_LABEL[focus]} · <em>{RC_DEFINITION[focus]}</em></p>
    <h2>What isn't working {focus === "self" ? "in yourself" : focus === "wealth" ? "with money" : "in your time"} right now?</h2>
    <p>Not what you'd tell anyone else. What it actually feels like on a Tuesday.</p>
    <div className="rc-reality">
      <div>
        <label htmlFor="rc-reality-text">Your words</label>
        <textarea id="rc-reality-text" value={s.reality[focus].text} onChange={e => setReality({ text: e.target.value })} rows={4} />
        <p>How long has this been going on?</p>
        <div className="rc-chips">{([["weeks", "A few weeks"], ["months", "Months"], ["year", "About a year"], ["years", "Years"]] as const).map(([value, label]) =>
          <button key={value} aria-pressed={s.reality[focus].howLong === value} onClick={() => setReality({ howLong: value })}>{label}</button>)}</div>
      </div>
      <section className="rc-panel rc-symptoms">
        <h3>Signs your life is owning you</h3>
        <details className="rc-signs-helper"><summary>Not sure what to write?</summary><p>Tap any that sound like you. They'll be added to your words.</p></details>
        <button className="rc-phone-only" aria-expanded={symptomsOpen} onClick={() => setSymptomsOpen(!symptomsOpen)}>{symptomsOpen ? "Hide signs" : "Show signs"}</button>
        <div className={`rc-signs-grid${symptomsOpen ? "" : " rc-phone-hidden"}`}>{RC_AREA_SYMPTOMS[focus].map(index =>
          <button key={index} aria-pressed={s.reality[focus].symptoms.includes(index)} onClick={() => update(toggleSymptom(s, focus, index))}>{RC_SYMPTOMS[index]}</button>)}</div>
      </section>
    </div>
  </>;
  if (s.step === 4) return <>
    <Quote state={s} /><h2>What have you been doing about it?</h2><p>Tap every one that's true. Not one. All of them.</p>
    <div className="rc-default-grid">{DEFAULT_CARDS.map(card => {
      const selected = s.defaults[focus].includes(card.key);
      return <section className={`rc-default ${selected ? "is-selected" : ""}`} key={card.key}>
        <button className="rc-default-choice" aria-pressed={selected} onClick={() => update({ ...s,
          defaults: { ...s.defaults, [focus]: selected ? s.defaults[focus].filter(k => k !== card.key) : [...s.defaults[focus], card.key] },
          defaultsNone: { ...s.defaultsNone, [focus]: false },
        })}><h3>{card.title}<span aria-hidden>{selected ? "✓" : "+"}</span></h3><p>{card.text}</p></button>
        <details className="rc-sounds"><summary>Sounds like</summary><p>{card.sounds}</p></details>
        <p className="rc-sounds-desktop">Sounds like: {card.sounds}</p>
        {selected && <label className="rc-named">{card.prompt}<span className="rc-optional"> Optional</span>
          <input type="text" value={s.defaultsNamed[focus][card.key]} onChange={e => update({ ...s, defaultsNamed: { ...s.defaultsNamed, [focus]: { ...s.defaultsNamed[focus], [card.key]: e.target.value } } })} />
        </label>}
      </section>;
    })}</div>
    <div className="rc-default-bottom"><em>Life is a mirror. It isn't judging you. It's showing you.</em><button aria-pressed={s.defaultsNone[focus]} onClick={() => update({ ...s, defaults: { ...s.defaults, [focus]: [] }, defaultsNone: { ...s.defaultsNone, [focus]: !s.defaultsNone[focus] } })}>None of these</button></div>
  </>;
  if (s.step === 5) return <CostScreen state={s} update={update} />;
  return <div className="rc-terminal"><p className="rc-eyebrow">TWO FUTURES · NEXT</p><h2>Your Reality Check continues here.</h2><p>Two futures is coming in RC-2. Your answers so far are saved as you go.</p><p>This is not the end of your Reality Check, and it has not been marked complete.</p></div>;
}
const COST_CHIPS: Record<RCArea, string[]> = {
  wealth: ["Opportunities I missed waiting for certainty", "Playing small on price", "Revenue left on the table", "Spending to cope"],
  time: ["My evenings", "My weekends", "Time with people I love", "Rest", "My health"],
  self: ["My energy", "My sleep", "My patience", "My confidence", "Being present"],
};
function CostScreen({ state: s, update }: Props) {
  const [ownOpen, setOwnOpen] = useState<Record<RCArea, boolean>>({ wealth: !!s.cost.wealth.own, time: !!s.cost.time.own, self: !!s.cost.self.own });
  const [phoneArea, setPhoneArea] = useState<RCArea>("wealth");
  const setCost = (area: RCArea, patch: object) => update({ ...s, cost: { ...s.cost, [area]: { ...s.cost[area], ...patch } } });
  const number = (raw: string) => raw === "" ? null : Math.max(0, Number(raw));
  return <>
    <p className="rc-eyebrow">WHAT YOU SAID ISN'T WORKING</p><Quote state={s} />
    <h2>What is this costing you?</h2><p>Leaving it as it is feels safe. It's also the most expensive choice you'll make. Tap what's true. Add a number if you can.</p>
    <div className="rc-phone-tabs">{(["wealth", "time", "self"] as RCArea[]).map(a => <button key={a} aria-pressed={a === phoneArea} onClick={() => setPhoneArea(a)}>{RC_LABEL[a]}</button>)}</div>
    <div className="rc-columns">{(["wealth", "time", "self"] as RCArea[]).map(area => <section key={area} className={`rc-panel ${area !== phoneArea ? "rc-phone-hidden" : ""}`}>
      <h3>{RC_LABEL[area]} · {area === "wealth" ? "In money" : area === "time" ? "In hours" : "In you"}</h3>
      <div className="rc-chips rc-cost-chips">{COST_CHIPS[area].map(chip => <button key={chip} aria-pressed={s.cost[area].chips.includes(chip)} onClick={() => setCost(area, { chips: s.cost[area].chips.includes(chip) ? s.cost[area].chips.filter(c => c !== chip) : [...s.cost[area].chips, chip] })}>{chip}</button>)}
      <button aria-expanded={ownOpen[area]} onClick={() => setOwnOpen({ ...ownOpen, [area]: !ownOpen[area] })}>+ My own</button></div>
      {ownOpen[area] && <label>My own<input value={s.cost[area].own} onChange={e => setCost(area, { own: e.target.value })} /></label>}
      {area === "wealth" ? <label className="rc-number-label"><span className="rc-number-line"><span>About $</span><input aria-label="About dollars a month" type="number" min={0} step="any" inputMode="decimal" value={s.cost.wealth.monthly ?? ""} onChange={e => setCost(area, { monthly: number(e.target.value) })} /><span>a month</span></span><span className="rc-optional">Optional</span></label>
        : area === "time" ? <label className="rc-number-label"><span className="rc-number-line"><span>About</span><input aria-label="About hours a week" type="number" min={0} step="any" inputMode="decimal" value={s.cost.time.hoursPerWeek ?? ""} onChange={e => setCost(area, { hoursPerWeek: number(e.target.value) })} /><span>hours a week</span></span><span className="rc-optional">Optional</span></label>
        : <label>Who else is paying for it? <span className="rc-optional">Optional</span><input value={s.cost.self.whoElse} onChange={e => setCost(area, { whoElse: e.target.value })} /></label>}
    </section>)}</div>
  </>;
}
