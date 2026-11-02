import { useState } from "react";
import type { Mirror4State } from "../mirror4Constants";
import { NameCreate } from "./NameCreate";
import { behaviorCount, standardName } from "./nameData";

type Props = {
  state: Mirror4State;
  onCreate: (name: string) => void;
  onMove: (behaviorId: string, fromId: string, toId: string | "new") => void;
  onSendBack: (behaviorId: string, fromId: string) => void;
  onRemove: (clusterId: string) => void;
  onBack: () => void;
  onName: () => void;
};

export function NameCards({ state, onCreate, onMove, onSendBack, onRemove, onBack, onName }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  // Six cards per page avoid nesting a scrolling grid around scrolling card backs.
  const count = state.clusters.length + 1;
  const pages = Math.ceil(count / 6);
  const currentPage = Math.min(page, pages - 1);
  const cards = [...state.clusters, null].slice(currentPage * 6, currentPage * 6 + 6);
  const placed = new Set(state.clusters.flatMap(c => c.behaviorIds)).size;
  const turn = (id: string | null) => { setOpenId(id); setMenuId(null); setEditing(false); setRemovingId(null); };
  return <div className="vxnc-layout vxnc-cards" data-name-moment="cards">
    <header className="vxnc-cards-heading">
      <div className="vx-eyebrow">ALL {placed} {placed === 1 ? "BEHAVIOR" : "BEHAVIORS"} SORTED</div>
      <h2>Here’s how your behaviors group together.</h2>
      <p className="vxnc-cards-lead">Turn a card to check what’s in it. Next, you’ll name each one.</p>
    </header>
    {creating ? <div className="vxnc-create-area">
      <NameCreate onCancel={() => setCreating(false)} onCreate={name => {
        onCreate(name); setCreating(false);
      }} />
    </div> : null}
    <div className="vxnc-grid" style={{
      "--vxnc-desktop-rows": Math.ceil(cards.length / 3),
      "--vxnc-phone-rows": Math.ceil(cards.length / 2),
    } as React.CSSProperties}>
      {cards.map(cluster => cluster ? <article key={cluster.id} data-standard-id={cluster.id}
        className={`vxnc-standard${openId === cluster.id ? " is-turned" : ""}`}>
        <div className="vxnc-flipper">
          <button type="button" className="vxnc-front" aria-expanded={openId === cluster.id}
            aria-label={`${standardName(state, cluster.id)}, ${behaviorCount(cluster.behaviorIds.length)} · tap to turn`}
            aria-hidden={openId === cluster.id} tabIndex={openId === cluster.id ? -1 : 0}
            onClick={() => turn(cluster.id)}>
            <span className="vxnc-star" aria-hidden>★</span>
            <strong>{standardName(state, cluster.id)}</strong>
            <small>{behaviorCount(cluster.behaviorIds.length)} · tap to turn</small>
          </button>
          <section className="vxnc-back" aria-label={`${standardName(state, cluster.id)} ${behaviorCount(cluster.behaviorIds.length)}`}
            aria-hidden={openId !== cluster.id} inert={openId !== cluster.id}>
            {removingId === cluster.id ? <div className="vxnc-remove-confirm">
              <p>Remove {standardName(state, cluster.id)}? Its behaviors go back to be sorted again.</p>
              <div>
                <button type="button" onClick={() => { setRemovingId(null); onRemove(cluster.id); }}>Remove</button>
                <button type="button" onClick={() => setRemovingId(null)}>Keep it</button>
              </div>
            </div> : <>
            <header><h3>{standardName(state, cluster.id)}</h3>
              <button type="button" onClick={() => turn(null)}>↺ turn back</button></header>
            <div className="vxnc-card-list">
              {cluster.behaviorIds.map(id => <div className="vxnc-card-row" key={id}>
                <button type="button" className="vxnc-behavior-row" aria-expanded={menuId === id}
                  onClick={() => { setEditing(true); setMenuId(menuId === id ? null : id); }}>
                  {state.admire.find(b => b.id === id)?.text || state.irks.find(b => b.id === id)?.text || ""}
                </button>
                {editing && menuId === id && <div className="vxnc-move-menu" aria-label="Move this behavior">
                  <span>Place in…</span>
                  {state.clusters.filter(c => c.id !== cluster.id).map(target => <button type="button" key={target.id}
                    onClick={() => { onMove(id, cluster.id, target.id); setMenuId(null); }}>
                    {standardName(state, target.id)}
                  </button>)}
                  <button type="button" onClick={() => { onMove(id, cluster.id, "new"); setMenuId(null); }}>+ New standard</button>
                  <button type="button" onClick={() => onSendBack(id, cluster.id)}>↩ Send back</button>
                </div>}
              </div>)}
              {cluster.behaviorIds.length === 0 && <p className="vxnc-empty">Nothing placed yet.</p>}
              <button type="button" className="vxnc-remove-link" onClick={() => setRemovingId(cluster.id)}>Remove this standard</button>
            </div>
            <button type="button" className="vxnc-edit-link" aria-pressed={editing} onClick={() => {
              setEditing(!editing); setMenuId(editing ? null : cluster.behaviorIds[0] ?? null);
            }}>Edit · move a behavior</button>
            </>}
          </section>
        </div>
      </article> : <button type="button" key="new" className="vxnc-new vxnc-new-card" onClick={() => setCreating(true)}>
        + New standard
      </button>)}
    </div>
    {pages > 1 && <nav className="vxnc-card-pages" aria-label="Standard cards">
      <button type="button" aria-label="Previous cards" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); turn(null); }}>‹</button>
      <span aria-live="polite">{currentPage + 1} of {pages}</span>
      <button type="button" aria-label="Next cards" disabled={currentPage + 1 === pages} onClick={() => { setPage(currentPage + 1); turn(null); }}>›</button>
    </nav>}
    <footer className="na1-m4-disc-foot">
      <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>
      <button type="button" className="na1-m4-continue" disabled={!state.clusters.length} onClick={onName}>{state.claimed ? "Next →" : "Name them →"}</button>
    </footer>
  </div>;
}
