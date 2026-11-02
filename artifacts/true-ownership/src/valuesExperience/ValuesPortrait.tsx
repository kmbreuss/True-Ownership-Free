import type { Mirror4State } from "../mirror4Constants";

export function ValuesPortrait({ state, onEdit }: { state: Mirror4State; onEdit: () => void }) {
  const groups = [
    { title: "★ WHAT LIGHTS YOU UP", rows: state.admire.filter(b => b.tier === "lights"), tone: "gold" },
    { title: "✕ WHAT YOU CAN'T STAND", rows: state.irks.filter(b => b.tier === "turns"), tone: "burgundy" },
  ];
  return <section className="vx-portrait">
    <div className="vx-eyebrow">Your portrait</div>
    <h2 className="na1-m4-step-title">Here's what you're showing yourself.</h2>
    <div className="vx-portrait-grid">{groups.map(g => <div key={g.tone} className={`vx-portrait-block ${g.tone}`}>
      <h3>{g.title}</h3>
      {g.rows.slice(0, 5).map(b => <p key={b.id}>{b.text}</p>)}
      {g.rows.length > 5 && <p>+{g.rows.length - 5} more</p>}
    </div>)}</div>
    <p className="vx-reflection">They're two sides of the same thing. Underneath every one of these is a standard you already hold.</p>
    <button type="button" className="vx-back-link" onClick={onEdit}>Edit portrait</button>
  </section>;
}
