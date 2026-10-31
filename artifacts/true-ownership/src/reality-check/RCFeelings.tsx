import React, { useState } from "react";
import { PriceWhereField } from "./PriceWhereField";

export function Feelings({ base, value, change, lowerCase = false }: {
  base: string[]; value: string[]; change: (v: string[]) => void; lowerCase?: boolean;
}) {
  const custom = value.find(v => !base.includes(v)) ?? "";
  const [own, setOwn] = useState(!!custom);
  const setCustom = (text: string) => change([...value.filter(v => base.includes(v)), ...(text ? [text] : [])]);
  return <div className="rc-feelings"><div className="rc-feeling-chips">{base.map(word => <button key={word} aria-pressed={value.includes(word)} onClick={() => change(value.includes(word) ? value.filter(v => v !== word) : [...value, word])}>{lowerCase ? word.toLowerCase() : word}</button>)}
    {!own && <button aria-expanded={false} onClick={() => setOwn(true)}>{lowerCase ? "+ my own" : "+ My own"}</button>}
    {own && <label className="rc-custom-feeling"><span className="rc-sr-only">My own feeling</span>{lowerCase
      ? <PriceWhereField softLimit={false} placeholder="My own feeling" value={custom} onChange={setCustom} />
      : <input aria-label="My own feeling" placeholder="My own feeling" value={custom} onChange={e => setCustom(e.target.value)} />}
      <button aria-label="Hide my own feeling" onClick={e => { e.preventDefault(); setOwn(false); }}>×</button></label>}</div>
  </div>;
}
