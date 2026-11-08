import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { a1Sections, STAGES, type EditTarget, type MapSection, type MapSources } from "./model";
import "./map.css";

export type MapModel = { title: string; sources: MapSources; sections?: MapSection[]; completed: Record<string, boolean> };
/** Flush original debounced editors before returning, without waiting for their timer. */
export function useReviewFlush(flush: () => void, enabled = true) {
  const latest = useRef(flush); latest.current = flush;
  useEffect(() => {
    if (!enabled) return;
    const save = () => latest.current();
    window.addEventListener("map-review-flush", save);
    return () => window.removeEventListener("map-review-flush", save);
  }, [enabled]);
}
export function MapOfMe({ read, onBack, backLabel, canEdit, renderEditor, download }: {
  read: () => MapModel; onBack: () => void; backLabel: string;
  canEdit: (target: EditTarget) => boolean;
  renderEditor: (target: EditTarget, close: () => void) => React.ReactNode;
  download?: (model: MapModel, sections: MapSection[]) => Promise<void>;
}) {
  const [model, setModel] = useState(read);
  const [expanded, setExpanded] = useState<MapSection | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);
  const sections = model.sections || a1Sections(model.sources);
  useEffect(() => { if (!editing) setModel(read()); }, [editing, read]); // refresh after the original editor's unmount flush and cloud hydration
  useLayoutEffect(() => {
    if (!editing) window.scrollTo(0, scroll.current);
  }, [editing]);
  const beginEdit = (target: EditTarget) => {
    scroll.current = window.scrollY;
    setExpanded(null);
    setEditing(target);
  };
  const closeDetail = () => { setExpanded(null); returnFocus.current?.focus(); };
  const exportPDF = async () => {
    if (!download) return;
    setBusy(true); setError("");
    try { await download(model, sections); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your PDF could not be downloaded. Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="na1-root"><main className="mom-page" aria-label="Map of Me">
    <header className="mom-header">
      <button className="mom-back" onClick={onBack}>← Back to {backLabel}</button>
      <p className="mom-eyebrow">{model.title}</p>
      <h1>A living reflection of who you are — and what you're building.</h1>
      <p className="mom-intro">Not finished. Not meant to be. This grows as you do.</p>
      <div className="mom-tools">
        <span>As of {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        {download && <button className="mom-download" disabled={busy} onClick={exportPDF}>{busy ? "Preparing PDF…" : "Download PDF"}</button>}
      </div>
      {error && <p role="alert">{error}</p>}
    </header>
    {STAGES.map(stage => {
      const cards = sections.filter(row => row.stage === stage.id);
      return <section className="mom-stage" key={stage.id} aria-labelledby={`mom-stage-${stage.id}`}>
        <div className="mom-stage-head"><h2 id={`mom-stage-${stage.id}`}>{stage.title}</h2>
          {model.completed[stage.id] && <span className="mom-claimed">✓ {stage.id === "rc" ? "Complete" : "Claimed"}</span>}
        </div>
        {cards.length ? <div className="mom-grid">{cards.map(card =>
          <button key={card.id} className={`mom-card ${card.ranked ? "mom-values" : ""}`} data-map-section={card.id}
            aria-label={`Open ${card.title}`} onClick={event => {
              scroll.current = window.scrollY; returnFocus.current = event.currentTarget; setExpanded(card);
            }}>
            <span className="mom-card-title">{card.title}</span>
            {card.ranked?.length ? <>
              <ol className="mom-ranked">{card.ranked.slice(0, 3).map((name, i) =>
                <li key={i}><span>#{i + 1}</span> {name}</li>)}</ol>
              {card.ranked.length > 3 && <span className="mom-rank-rest">{card.ranked.slice(3).join(" · ")}</span>}
            </> : card.answers.length ? <div className="mom-preview">{card.answers.slice(0, 2).map((item, i) =>
              <p key={i}>{item.text}</p>)}</div> : <p className="mom-empty">{card.empty}</p>}
            <span className="mom-open">View full answers ↗</span>
          </button>)}</div> : <p className="mom-empty">Fills in after {stage.id.toUpperCase()}</p>}
      </section>;
    })}
    {expanded && <AnswerPanel card={expanded} onClose={closeDetail} canEdit={canEdit(expanded.target)}
      onEdit={() => beginEdit(expanded.target)} />}
    {editing && renderEditor(editing, () => { setEditing(null); })}
  </main></div>;
}

export function ReviewFrame({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  const close = () => { window.dispatchEvent(new Event("map-review-flush")); onClose(); };
  const ref = useDialog(close);
  return createPortal(<div className="mom-review" ref={ref} role="dialog" aria-modal="true" aria-label={`Edit in ${title}`}>
    <header><div><p className="mom-eyebrow">FROM MY MAP OF ME · REVIEW</p><h1>{title}</h1></div>
      <button className="mom-close" onClick={close} aria-label="Close and return to Map of Me">×</button></header>
    <div className="mom-review-body na1-room-body">{children}</div>
    <footer><button className="mom-primary" onClick={close}>Done reviewing →</button></footer>
  </div>, document.body);
}

function useDialog(close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close); closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    const root = ref.current!;
    root.querySelector<HTMLElement>("button,input,textarea,select")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const items = [...root.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')]
        .filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = old; document.removeEventListener("keydown", keydown); previous?.isConnected && previous.focus(); };
  }, []);
  return ref;
}
function AnswerPanel({ card, onClose, onEdit, canEdit }: {
  card: MapSection; onClose: () => void; onEdit: () => void; canEdit: boolean;
}) {
  const ref = useDialog(onClose);
  return createPortal(<div className="mom-scrim" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="mom-panel" role="dialog" aria-modal="true" aria-labelledby="mom-detail-title" ref={ref}>
      <header><h2 id="mom-detail-title">{card.title}</h2><button className="mom-close" aria-label="Close full answers" onClick={onClose}>×</button></header>
      <div className="mom-full-answers">{card.answers.length ? card.answers.map((item, i) =>
        <div key={i}><h3>{item.label}</h3><p>{item.text}</p></div>) : <p className="mom-empty">{card.empty}</p>}</div>
      <footer><button className="mom-primary" disabled={!canEdit} onClick={onEdit}>Edit in {card.target.mirror} →</button>
        {!canEdit && <small>{card.answers.length ? "This editor is not available under your current access."
          : "This section has no saved answers to review yet."}</small>}</footer>
    </div>
  </div>, document.body);
}
