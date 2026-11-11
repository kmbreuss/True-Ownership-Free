import { useState } from "react";
import { journeyMonth } from "../../../reality-check/rcJourney";
import { rcMoney, rcNumber } from "../../../rcConstants";
import { flushNewFlowForSignOut, resumeNewFlowAfterSignOutFailure } from "../../../newFlowSync";
import { saveFutureB } from "../../poster";
import { PATTERNS, STOPS, ownThingClause, sceneAnswered, setFirstStep, setOwnLine, setPath, setScene, stopCost } from "../courseState";
import { RoadFuture, SCENE_STEPS, TileArt, labelOf, tileById, type SceneKey } from "../tiles";
import { Check } from "../art";
import { Grow } from "./fields";
import type { ScreenProps } from "../FreeCourse";

// FC-13 · Future A · the same path
export function FutureA({ state: s, update }: ScreenProps) {
  const p = PATTERNS[s.pattern ?? "carrying"];
  return <>
    <RoadFuture kind="a" />
    <div><p className="fc-eyebrow is-grey">Future A · the same path</p>
      <h1 className="fc-h1 is-grey">If you keep <em>{p.lead}</em> {ownThingClause(s)}…</h1></div>
    <ol className="fc-stops is-a">{STOPS.map(stop => <li key={stop.key}>
      <span className="fc-stop-dot" aria-hidden="true" />
      <p className="fc-eyebrow is-grey">{stop.label}{stop.required ? "" : " · optional"}</p>
      <Grow label={`What's still the same ${stop.label.toLowerCase()}?`} placeholder="What's still the same?" value={s.futureAPath?.[stop.key] ?? ""} onChange={t => update(setPath(s, "futureAPath", stop.key, t))} />
      {stopCost(s, stop.months, "−") && <p className="fc-stop-cost is-cost">{stopCost(s, stop.months, "−")}</p>}
    </li>)}</ol>
    <p className="fc-soft is-center">Nothing changed. That's what it costs.</p>
  </>;
}

// FC-14 · Turn around (deep Spruce, accentuated)
export function Turn() {
  return <div className="fc-turn">
    <p className="fc-eyebrow">Future B</p>
    <div className="fc-turn-pair">
      <div className="fc-away"><span aria-hidden="true">←</span>Running away from Future A</div>
      <div className="fc-toward"><span aria-hidden="true">→</span>Moving toward your life</div>
    </div>
    <h1 className="fc-h1 is-big">Future B isn't escaping something.</h1>
    <p className="fc-bright">It's moving toward the life that fits you.</p>
  </div>;
}

// FC-15 · Future B · moving toward
export function FutureB({ state: s, update }: ScreenProps) {
  return <>
    <RoadFuture kind="b" />
    <div><p className="fc-eyebrow">Future B · moving toward</p><h1 className="fc-h1">If you own your part… what are you doing instead?</h1></div>
    <ol className="fc-stops is-b">{STOPS.map(stop => <li key={stop.key}>
      <span className="fc-stop-dot" aria-hidden="true" />
      <p className="fc-eyebrow">{stop.label}{stop.required ? "" : " · optional"}</p>
      <Grow label={`What are you doing instead ${stop.label.toLowerCase()}?`} placeholder="What are you doing instead?" value={s.futureBPath?.[stop.key] ?? ""} onChange={t => update(setPath(s, "futureBPath", stop.key, t))} />
      {stopCost(s, stop.months, "+") && <p className="fc-stop-cost is-gain">{stopCost(s, stop.months, "+")}</p>}
    </li>)}</ol>
  </>;
}

// FC-16 · Picture your Tuesday (six steps, four tiles each, or your own words)
export function Scene({ state: s, update, step, setStep }: ScreenProps & { step: number; setStep: (n: number) => void }) {
  const cur = SCENE_STEPS[step], scene = s.futureBScene;
  const value = scene ? (cur.key === "feels" ? "" : scene[cur.key]) : "";
  const feels = scene?.feels ?? [];
  const isTile = (v: string) => !!tileById(v);
  const own = cur.key === "feels" ? feels.find(f => !isTile(f)) ?? "" : (value && !isTile(value) ? value : "");
  const picked = (id: string) => cur.key === "feels" ? feels.includes(id) : value === id;
  const choose = (id: string) => {
    if (cur.key !== "feels") { update(setScene(s, cur.key as Exclude<SceneKey, "feels">, value === id ? "" : id)); return; }
    const next = feels.includes(id) ? feels.filter(f => f !== id) : feels.length < 3 ? [...feels, id] : feels;
    update(setScene(s, "feels", next));
  };
  const typeOwn = (text: string) => {
    if (cur.key !== "feels") { update(setScene(s, cur.key, text)); return; }
    const tiles = feels.filter(isTile);
    update(setScene(s, "feels", text.trim() && tiles.length < 3 ? [...tiles, text] : tiles));
  };
  return <>
    <div><p className="fc-eyebrow">Future B · if you own your part</p><h1 className="fc-h1">Picture an ordinary Tuesday, a year from now.</h1></div>
    <ol className="fc-stepchips" aria-label="Steps of your Tuesday">{SCENE_STEPS.map((st, n) => <li key={st.key}>
      <button className={`fc-stepchip${n === step ? " is-current" : ""}${sceneAnswered(s, st.key) && n !== step ? " is-done" : ""}`} aria-current={n === step ? "step" : undefined}
        disabled={n > step && !SCENE_STEPS.slice(0, n).every(x => sceneAnswered(s, x.key))} onClick={() => setStep(n)}>{st.short}</button></li>)}</ol>
    <p className="fc-lead">{cur.prompt}</p>
    <div className="fc-tiles" role="group" aria-label={cur.name}>{cur.tiles.map(t => <button key={t.id} className={`fc-tile${picked(t.id) ? " is-picked" : ""}`} aria-pressed={picked(t.id)} onClick={() => choose(t.id)}>
      <TileArt id={t.id} bg={t.bg} /><span className="fc-tile-label">{t.label}</span>{picked(t.id) && <span className="fc-tick is-gold"><Check /></span>}</button>)}</div>
    <label className="fc-where"><span>Or in your words: </span><Grow label={`${cur.name}, in your own words`} placeholder="…" value={own} onChange={typeOwn} /></label>
  </>;
}

// FC-17 · Your Future B
export function YourB({ state: s, update }: ScreenProps) {
  const sc = s.futureBScene, month = journeyMonth(s).toUpperCase();
  const back = [s.cost.monthly !== null ? rcMoney(s.cost.monthly * 12) : "", s.cost.hoursPerWeek !== null ? `${rcNumber(s.cost.hoursPerWeek * 52)} hours` : ""].filter(Boolean).join(" and ");
  return <>
    <section className="fc-scenecard" aria-label="My Future B">
      <div className="fc-scenepics">{(["morning", "work", "family", "people"] as const).map(k => {
        const v = sc?.[k] ?? "";
        return tileById(v) ? <div key={k} className="fc-scenepic"><TileArt id={v} /></div>
          : <div key={k} className="fc-scenepic is-words"><span>{v.trim() || "—"}</span></div>;
      })}</div>
      <p className="fc-eyebrow is-gold">My Future B · next {month}</p>
      <Grow className="fc-grow is-on-deep" label="My Future B, in my words" placeholder="My Future B in my words" value={sc?.ownWords ?? ""} onChange={t => update(setOwnLine(s, t))} />
      {!!sc?.feels.length && <ul className="fc-feelchips">{sc.feels.map(f => <li key={f}>{labelOf(f)}</li>)}</ul>}
      {back && <p className="fc-back-line">★ {back} back</p>}
    </section>
    <p className="fc-soft is-center">This is what owning your part looks like.</p>
  </>;
}

// FC-18 · Take this with you
export function Take({ state: s, update, account }: ScreenProps) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const first = s.firstStep ?? s.futureB1.oneThing;
  async function poster() {
    setBusy(true); setError("");
    try { await flushNewFlowForSignOut(); await saveFutureB(s, account?.firstName ?? ""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save. Please try again."); }
    finally { resumeNewFlowAfterSignOutFailure(); setBusy(false); }
  }
  return <>
    <div><p className="fc-eyebrow">Take this with you</p><h1 className="fc-h1">You're moving toward something now.</h1></div>
    <section className="fc-take">
      <p className="fc-eyebrow is-gold">I'm moving toward</p>
      <p className="fc-take-line">{s.futureBScene?.ownWords}</p>
      <p className="fc-eyebrow is-gold">My first step this week</p>
      <Grow className="fc-grow is-step" label="My first step this week" placeholder="One small step" value={first} onChange={t => update(setFirstStep(s, t))} />
      <p className="fc-stepdone">★ Step one is done.</p>
    </section>
    <div className="fc-center"><button className="fc-poster" disabled={busy} onClick={() => void poster()}>Save my Future B</button>
      {busy && <p role="status" className="fc-meta">Saving…</p>}{error && <p role="alert" className="fc-error">{error}</p>}</div>
  </>;
}
