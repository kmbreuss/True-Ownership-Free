import { useState } from "react";

export function NameCreate({ onCreate, onCancel }: { onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return <form className="vxnc-create" onSubmit={event => {
    event.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }}>
    <input autoFocus aria-label="Name your standard" placeholder="Name your standard…" value={name}
      onChange={event => setName(event.target.value)} onKeyDown={event => {
        if (event.key === "Escape") { event.stopPropagation(); onCancel(); }
      }} />
    <button type="submit" disabled={!name.trim()}>Create standard →</button>
    <button type="button" onClick={onCancel}>Cancel</button>
  </form>;
}
