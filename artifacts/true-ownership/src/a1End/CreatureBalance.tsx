import type { Mirror3State } from "../mirror3Constants";
import { balancePair, practicalCreatures, resolveTry, type Balance } from "./practical";
import { usePractical } from "./usePractical";
import "./practical.css";

export function CreatureBalance({ identity, reviewing, onBack, onContinue }: {
  identity: Mirror3State; reviewing: boolean; onBack: () => void; onContinue: () => void;
}) {
  const { practical: p, error, update } = usePractical();
  const creatures = practicalCreatures(identity), { lot, behind } = balancePair(p, creatures);
  const intent = lot && behind && p.balanceIntent?.lotCreatureId === lot.id && p.balanceIntent.behindCreatureId === behind.id
    ? p.balanceIntent.answer : null;
  const choose = (id: string, level: Balance) => update(current => {
    const next = { ...current, balanceByCreatureId: { ...current.balanceByCreatureId, [id]: level } };
    const selected = resolveTry(next, creatures);
    return { balanceByCreatureId: next.balanceByCreatureId,
      tryCreatureId: selected.creature?.id || null, trySelectionSource: selected.creature ? selected.source : null };
  });
  return <section className="a1-practical balance-screen" aria-label="Your creatures, lately">
    <div className="practical-parts" aria-label="Identity parts">
      {["Gifts", "Superpowers", "Under Pressure", "Own It"].map((part, i) =>
        <span key={part} className={i === 3 ? "is-current" : ""} aria-current={i === 3 ? "step" : undefined}>{part}</span>)}
    </div>
    <div className="balance-scroll">
      <p className="practical-label">IDENTITY · PUT THEM TO WORK</p>
      <h2>Your creatures, lately.</h2>
      <p className="practical-lead">Lately, how much are you leaning on each one? There's no right answer.</p>
      <div className="balance-rows">
        {creatures.map(c => <div className="balance-row" key={c.id} data-creature={c.id}>
          <h3><span aria-hidden="true">{c.emoji}</span> {c.name}</h3>
          <div className="balance-pills" role="group" aria-label={`${c.name} lately`}>
            {([["lot", "Leaning on it a lot"], ["right", "About right"], ["behind", "Left behind"]] as const).map(([level, label]) =>
              <button type="button" key={level} className={`balance-pill is-${level}`}
                aria-pressed={p.balanceByCreatureId[c.id] === level} disabled={!!error} onClick={() => choose(c.id, level)}>{label}</button>)}
          </div>
        </div>)}
      </div>
      {lot && behind && <aside className="balance-question">
        <p>Your {lot.name} is doing most of the work, and your {behind.name} is waiting. Is that on purpose?</p>
        <div className="balance-intent" role="group" aria-label="Is that on purpose?">
          {([["yes", "Yes, for now"], ["no", "Not really"]] as const).map(([answer, label]) =>
            <button type="button" key={answer} aria-pressed={intent === answer} disabled={!!error}
              onClick={() => update({ balanceIntent: { lotCreatureId: lot.id, behindCreatureId: behind.id, answer } })}>{label}</button>)}
        </div>
        {intent && <div className="balance-suggestion"><span className="practical-label">THIS WEEK</span>
          <p>{intent === "yes" ? `Call on your ${behind.name} on purpose, once this week.`
            : `Call on your ${behind.name} once, where you'd usually send the ${lot.name}.`}</p></div>}
      </aside>}
      <p className="balance-shadow">An overused gift is where the shadow starts.</p>
      {error && <p role="alert" className="practical-error">{error}</p>}
    </div>
    <footer className="balance-footer">
      <button type="button" className="na1-btn-ghost" onClick={onBack}>← Back</button>
      <button type="button" className="na1-btn-gold" onClick={onContinue}>{reviewing ? "Done reviewing →" : "Continue →"}</button>
    </footer>
  </section>;
}
