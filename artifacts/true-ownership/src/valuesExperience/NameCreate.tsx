import { useState } from "react";

export function NameCreate({ onCreate, onCancel, suggestions = [] }: {
  onCreate: (name: string) => void; onCancel: () => void; suggestions?: string[];
}) {
  const [name, setName] = useState("");
  return <form className="vxnc-create" onSubmit={event => {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }}>
    <label className="vxnc-create-label">What does it point to? A word or two
    <input autoFocus aria-label="Name your standard" placeholder="A word or two…" value={name}
      onChange={event => setName(event.target.value)} onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); onCancel(); }
      }} /></label>
    {suggestions.length > 0 && <div className="vxnc-create-suggestions">
      Katherine hears: {suggestions.map(word => <button type="button" key={word} onClick={() => setName(word)}>{word}</button>)}
    </div>}
    <small className="vxnc-rename-note">you can rename it later</small>
    <button type="submit" disabled={!name.trim()}>Start this standard →</button>
    <button type="button" onClick={onCancel}>Cancel</button>
  </form>;
}
