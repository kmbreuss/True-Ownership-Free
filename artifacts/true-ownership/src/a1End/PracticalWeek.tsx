import { useState } from "react";
import type { Mirror3State } from "../mirror3Constants";
import { loadNotice, saveNotice } from "./notice";
import { balancePair, practicalCreatures, resolveTry, weeklyProjection } from "./practical";
import { usePractical } from "./usePractical";
import "./practical.css";

export function PracticalWeek({ identity, original, value, onDone, reviewFromMap = false }: {
  identity?: Mirror3State; original: string; value?: string; onDone: () => void;
  reviewFromMap?: boolean;
}) {
  const { practical: p, error: practicalError, update } = usePractical();
  const [initial] = useState(() => {
    try { return { notice: loadNotice(), error: "" }; }
    catch (e) { return { notice: null, error: e instanceof Error ? e.message : "Your weekly notice could not be read." }; }
  });
  const [lived, setLived] = useState(initial.notice?.lived || "");
  const [didnt, setDidnt] = useState(initial.notice?.didnt || "");
  const [error, setError] = useState(initial.error);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const creatures = practicalCreatures(identity), selected = resolveTry(p, creatures), creature = selected.creature;
  const { lot } = balancePair(p, creatures), top = value || "your top value";
  const doLine = weeklyProjection(p, creatures, original, top).do;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (initial.error || practicalError) return;
    try {
      if (lived !== (initial.notice?.lived || "") || didnt !== (initial.notice?.didnt || "")) saveNotice({ value: top, lived, didnt });
      const patch = { tryCreatureId: creature?.id || null, trySelectionSource: creature ? selected.source : null,
        ...(editing ? { sharpenedOneThing: draft } : {}),
        weekReviewedAt: reviewFromMap ? p.weekReviewedAt : p.weekReviewedAt || new Date().toISOString() };
      const changed = Object.entries(patch).some(([key, next]) => p[key as keyof typeof p] !== next);
      if ((!reviewFromMap || changed) && !update(patch)) return;
      onDone();
    } catch (e) { setError(e instanceof Error ? e.message : "Your notice could not be saved. Please try again."); }
  };
  return <form id="a1-practical-week" className="a1-practical practical-week" onSubmit={submit}>
    <h1 className="a1-end-title">This week, just three things.</h1>
    <section className="practical-block"><span className="practical-number" aria-hidden="true">1</span>
      <div><h2 className="practical-label">DO · YOUR ONE THING</h2>
        {original.trim() ? <>
          <p>In your Reality Check you said you'd start with: “{original}”. Does it still fit?</p>
          {p.sharpenedOneThing?.trim() && !editing && <p className="practical-do">This week: {doLine}</p>}
          {!editing && <div className="practical-actions">
            <button type="button" className="practical-choice" onClick={() => update({ sharpenedOneThing: null })}>Keep it</button>
            <button type="button" className="practical-choice" onClick={() => { setDraft(p.sharpenedOneThing ?? original); setEditing(true); }}>Sharpen it</button>
          </div>}
          {editing && <div className="practical-edit">
            <input aria-label="Sharpen your one thing" value={draft} onChange={e => setDraft(e.target.value)} />
            <div className="practical-actions"><button type="button" className="practical-choice" onClick={() => { if (update({ sharpenedOneThing: draft })) setEditing(false); }}>Save</button>
              <button type="button" className="practical-choice" onClick={() => setEditing(false)}>Cancel</button></div>
          </div>}
        </> : <label className="practical-field"><span>What's one thing you'll start with this week?</span>
          <input value={p.sharpenedOneThing || ""} onChange={e => update({ sharpenedOneThing: e.target.value })} /></label>}
      </div>
    </section>
    <section className="practical-block"><span className="practical-number" aria-hidden="true">2</span>
      <div><h2 className="practical-label">{creature && p.balanceByCreatureId[creature.id] === "behind"
        ? "BE · THE CREATURE YOU'VE LEFT BEHIND" : "BE · BRING A CREATURE FORWARD"}</h2>
        {creature ? <>
          <p>{lot && lot.id !== creature.id ? `Your ${creature.name} has been waiting while the ${lot.name} does the work.`
            : `This week, bring your ${creature.name} forward.`}</p>
          <div className="practical-creature"><span className="practical-emoji" aria-hidden="true">{creature.emoji}</span>
            <div><h3>{creature.name}</h3>{creature.power && <p>{creature.power}</p>}
              <div className="practical-gifts">{creature.gifts.map((gift, i) => <span key={`${i}-${gift}`}>{gift}</span>)}</div></div>
          </div>
          <label className="practical-field"><span>How could your {creature.name} show up more this week?</span>
            <input value={p.tryAnswersByCreatureId[creature.id] || ""}
              placeholder="e.g. open Thursday's team meeting with a win, not the problems"
              onChange={e => { const text = e.target.value; update(current => ({
                tryCreatureId: creature.id, trySelectionSource: selected.source,
                tryAnswersByCreatureId: { ...current.tryAnswersByCreatureId, [creature.id]: text },
              })); }} /></label>
        </> : <><p>Which creature would you like to bring forward this week?</p>
          <div className="practical-actions">{creatures.map(c => <button key={c.id} type="button" className="practical-choice"
            onClick={() => update({ tryCreatureId: c.id, trySelectionSource: "chosen" })}>{c.emoji} {c.name}</button>)}</div></>}
      </div>
    </section>
    <section className="practical-block"><span className="practical-number" aria-hidden="true">3</span>
      <div><h2 className="practical-label">LIVE · YOUR #1 VALUE</h2>
        <p>One moment {top} showed up this week. And one moment it didn't.</p>
        <div className="practical-notice">
          <label className="practical-field"><span>A MOMENT I LIVED IT</span>
            <textarea rows={2} value={lived} disabled={!!initial.error} onChange={e => setLived(e.target.value)} placeholder="When it happens, a few words…" /></label>
          <label className="practical-field is-didnt"><span>A MOMENT I DIDN'T</span>
            <textarea rows={2} value={didnt} disabled={!!initial.error} onChange={e => setDidnt(e.target.value)} placeholder="What happened instead…" /></label>
        </div>
      </div>
    </section>
    <p className="practical-aside">✦ Everything else is set aside, not lost. In A4 you'll sort it. For now, just this.</p>
    {(error || practicalError) && <p role="alert" className="practical-error">{error || practicalError}</p>}
  </form>;
}
