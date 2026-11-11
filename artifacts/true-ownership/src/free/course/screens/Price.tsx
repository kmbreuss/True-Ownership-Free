import { useLayoutEffect, useRef, useState } from "react";
import { RC_LABEL, rcMoney, rcNumber, type RCArea, type RCState } from "../../../rcConstants";
import type { ScreenProps } from "../FreeCourse";

const MONEY = [100, 500, 1000];
const HOURS = [2, 5, 10];
// Existing placeholder examples from the original price scene.
const PLACEHOLDERS: Record<RCArea, { money: string; hours: string; you: string }> = {
  time: { money: "Opportunities I keep missing", hours: "My evenings · my weekends", you: "My patience. My sleep." },
  wealth: { money: "Paying for everyone but me", hours: "Worrying about money · fixing others' problems", you: "My confidence. My sleep." },
  self: { money: "Spending to cope", hours: "Scrolling · replaying conversations", you: "My energy. My patience." },
};
// A one-line field that grows with what is written, so nothing is clipped.
function Grow({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, [value]);
  return <textarea ref={ref} rows={1} className="fc-grow" aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value.replace(/\n/g, " "))} />;
}
const clip = (text: string, max = 110) => { const t = text.trim(); return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t; };

// FC-04 · What is {Area} owning you costing you?
export function Price({ state: s, update }: ScreenProps) {
  const area = s.focus ?? "self", name = RC_LABEL[area], ph = PLACEHOLDERS[area];
  const [moreMoney, setMoreMoney] = useState(() => s.cost.monthly !== null && !MONEY.includes(s.cost.monthly));
  const [moreHours, setMoreHours] = useState(() => s.cost.hoursPerWeek !== null && s.cost.hoursPerWeek >= 15);
  const cost = (patch: Partial<RCState["cost"]>) => update({ ...s, cost: { ...s.cost, ...patch } });
  const yearMoney = s.cost.monthly !== null ? rcMoney(s.cost.monthly * 12) : "";
  const yearHours = s.cost.hoursPerWeek !== null ? rcNumber(s.cost.hoursPerWeek * 52) : "";
  const moneyShown = moreMoney || (s.cost.monthly !== null && !MONEY.includes(s.cost.monthly));
  const hoursShown = moreHours || (s.cost.hoursPerWeek !== null && s.cost.hoursPerWeek >= 15);
  const num = (value: string) => value.trim() === "" ? null : Math.max(0, Number(value));
  return <>
    {s.tuesday.trim() && <p className="fc-chip-quote"><span>{name} · </span>“{clip(s.tuesday)}”</p>}
    <h1 className="fc-h1">What is <em>{name}</em> owning you costing you?</h1>
    <div className="fc-cost-grid">
    <section className="fc-cost">
      <h2 className="fc-eyebrow is-gold">In money</h2>
      <div className="fc-chips" role="group" aria-label="In money, a month">
        {MONEY.map(v => <button key={v} className="fc-chip is-cost" aria-pressed={s.cost.monthly === v && !moneyShown}
          onClick={() => { setMoreMoney(false); cost({ monthly: s.cost.monthly === v ? null : v }); }}>{rcMoney(v)}</button>)}
        <button className="fc-chip is-cost" aria-pressed={moneyShown} onClick={() => {
          if (moneyShown) { setMoreMoney(false); cost({ monthly: null }); } else setMoreMoney(true);
        }}>more</button>
      </div>
      {moneyShown && <label className="fc-amount"><span>$</span><input type="number" inputMode="decimal" min={0} aria-label="About dollars a month"
        value={s.cost.monthly ?? ""} onChange={e => cost({ monthly: num(e.target.value) })} /><span>a month</span></label>}
      <label className="fc-where"><span>a month · </span><Grow label="Where does the money go?" placeholder={ph.money} value={s.cost.moneyWhere} onChange={moneyWhere => cost({ moneyWhere })} /></label>
    </section>
    <section className="fc-cost">
      <h2 className="fc-eyebrow is-gold">In hours</h2>
      <div className="fc-chips" role="group" aria-label="In hours, a week">
        {HOURS.map(v => <button key={v} className="fc-chip is-cost" aria-pressed={s.cost.hoursPerWeek === v && !hoursShown}
          onClick={() => { setMoreHours(false); cost({ hoursPerWeek: s.cost.hoursPerWeek === v ? null : v }); }}>{v}</button>)}
        <button className="fc-chip is-cost" aria-pressed={hoursShown} onClick={() => {
          if (hoursShown) { setMoreHours(false); cost({ hoursPerWeek: null }); } else { setMoreHours(true); cost({ hoursPerWeek: 15 }); }
        }}>15+</button>
      </div>
      {hoursShown && <label className="fc-amount"><input type="number" inputMode="decimal" min={0} aria-label="About hours a week"
        value={s.cost.hoursPerWeek ?? ""} onChange={e => cost({ hoursPerWeek: num(e.target.value) })} /><span>hours a week</span></label>}
      <label className="fc-where"><span>a week · </span><Grow label="Where do the hours go?" placeholder={ph.hours} value={s.cost.hoursWhere} onChange={hoursWhere => cost({ hoursWhere })} /></label>
    </section>
    <section className="fc-cost">
      <h2 className="fc-eyebrow is-gold">In you</h2>
      <label className="fc-where is-you"><Grow label="What is it costing you?" placeholder={`“${ph.you}”`} value={s.cost.you} onChange={you => cost({ you })} /></label>
    </section>
    </div>
    {(yearMoney || yearHours) && <div className="fc-totals" aria-live="polite">
      {yearMoney && <div><strong>{yearMoney}</strong><span>a year</span></div>}
      {yearHours && <div><strong>{yearHours}</strong><span>hours a year</span></div>}
    </div>}
    <p className="fc-soft is-center">This isn't blame. It's the diagnosis. And it can change.</p>
  </>;
}
