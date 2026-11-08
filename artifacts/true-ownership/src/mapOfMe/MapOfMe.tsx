import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { a1Sections, STAGES, type EditTarget, type MapSection, type MapSources } from "./model";
import "./map.css";
import { PictureMap, mapShareData } from "./PictureMap";
import { downloadMapCard } from "./share";

export type MapModel = { title: string; name?: string; sources: MapSources; sections?: MapSection[]; completed: Record<string, boolean> };
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
  const [busy, setBusy] = useState("");
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
    setBusy("pdf"); setError("");
    try { await download(model, sections); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your PDF could not be downloaded. Please try again."); }
    finally { setBusy(""); }
  };
  const exportCard = async () => {
    setBusy("share"); setError("");
    try { await downloadMapCard(mapShareData(model, sections)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Your card could not be downloaded. Please try again."); }
    finally { setBusy(""); }
  };
  return <div className="na1-root"><main className="mom-page mom-picture-page" aria-label="Map of Me" data-map-review-target={editing ? JSON.stringify(editing) : undefined}>
    <PictureMap model={model} sections={sections} onBack={onBack} backLabel={backLabel} busy={busy}
      download={download ? exportPDF : undefined} share={exportCard} open={card => {
        scroll.current = window.scrollY; returnFocus.current = document.activeElement as HTMLElement; setExpanded(card);
      }} />
    {error && <p role="alert">{error}</p>}
    {expanded && <AnswerPanel card={expanded} onClose={closeDetail} canEdit={canEdit} onEdit={beginEdit} />}
    {editing && renderEditor(editing, () => { setEditing(null); })}
  </main></div>;
}

export function ReviewFrame({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  const close = () => { window.dispatchEvent(new Event("map-review-flush")); onClose(); };
  const ref = useMapDialog(close);
  return createPortal(<div className="mom-review" ref={ref} role="dialog" aria-modal="true" aria-label={`Edit in ${title}`}>
    <header><div><p className="mom-eyebrow">FROM MY MAP OF ME · REVIEW</p><h1>{title}</h1></div>
      <button className="mom-close" onClick={close} aria-label="Close and return to Map of Me">×</button></header>
    <div className="mom-review-body na1-room-body">{children}</div>
    <footer><button className="mom-primary" onClick={close}>Done reviewing →</button></footer>
  </div>, document.body);
}

export function useMapDialog(close: () => void) {
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
  card: MapSection; onClose: () => void; onEdit: (target: EditTarget) => void; canEdit: (target: EditTarget) => boolean;
}) {
  const ref = useMapDialog(onClose);
  return createPortal(<div className="mom-scrim" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="mom-panel" role="dialog" aria-modal="true" aria-labelledby="mom-detail-title" ref={ref}>
      <header><h2 id="mom-detail-title">{card.title}</h2><button className="mom-close" aria-label="Close full answers" onClick={onClose}>×</button></header>
      <div className="mom-full-answers">{(card.children || [card]).map(section => <section className="mom-full-section" key={section.id}>
        {card.children && <h3>{section.title}</h3>}
        {section.answers.length ? section.answers.map((item, i) => <div key={i}><h3>{item.label}</h3><p>{item.text}</p></div>)
          : <p className="mom-empty">{section.empty}</p>}
        <button className="mom-primary" data-map-edit={section.id} disabled={!canEdit(section.target)}
          onClick={() => onEdit(section.target)}>Edit in {section.target.mirror} →</button>
        {!canEdit(section.target) && <small className="mom-editor-limit">{section.answers.length ? "This editor is not available under your current access."
          : "This section has no saved answers to review yet."}</small>}
      </section>)}</div>
    </div>
  </div>, document.body);
}
