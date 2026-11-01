import React, { useState } from "react";
import { loadNotice, saveNotice } from "./notice";

export function WeeklyNotice({ value, onDone }: { value?: string; onDone: () => void }) {
  const [initial] = useState(() => {
    try { return { notice: loadNotice(), error: "" }; }
    catch (error) { return { notice: null, error: error instanceof Error ? error.message : "Your weekly notice could not be read." }; }
  });
  const [lived, setLived] = useState(initial.notice?.lived || "");
  const [didnt, setDidnt] = useState(initial.notice?.didnt || "");
  const [error, setError] = useState(initial.error);
  const top = value || "your top value";
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (initial.error) return;
    try { saveNotice({ value: top, lived, didnt }); onDone(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your notice could not be saved. Please try again."); }
  };
  return <form id="a1-weekly-notice" onSubmit={save}>
    <h1 className="a1-end-title">One thing to notice this week.</h1>
    <p className="a1-end-notice-lead">Notice one moment you lived <strong>{top}</strong>, and one moment you didn't. No fixing yet. Just notice.</p>
    <label className="a1-end-field"><span className="a1-end-label">A MOMENT I LIVED IT</span>
      <textarea value={lived} onChange={event => setLived(event.target.value)} rows={2} placeholder="When it happens, a few words…" />
    </label>
    <label className="a1-end-field is-didnt"><span className="a1-end-label">A MOMENT I DIDN'T</span>
      <textarea value={didnt} onChange={event => setDidnt(event.target.value)} rows={2} placeholder="What happened instead…" />
    </label>
    <p className="a1-end-helper">Optional. Come back to this any time this week.</p>
    {error && <p role="alert" className="a1-end-error">{error}</p>}
    <button type="submit" hidden disabled={!!initial.error}>Save →</button>
  </form>;
}
