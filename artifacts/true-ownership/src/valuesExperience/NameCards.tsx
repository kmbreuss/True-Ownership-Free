import { useState } from "react";
import { m4BehaviorTextById, type Mirror4State } from "../mirror4Constants";
import { NameCreate } from "./NameCreate";
import { behaviorCount, standardName } from "./nameData";

type Props = {
  state: Mirror4State;
  onCreate: (name: string) => void;
  onMove: (behaviorId: string, fromId: string, toId: string | "new") => void;
  onSendBack: (behaviorId: string, fromId: string) => void;
  onRemove: (clusterId: string) => void;
  onRename: (clusterId: string, name: string) => void;
  onStar: (clusterId: string, behaviorId: string) => void;
  onAdd: (clusterId: string, text: string) => void;
  onBack: () => void;
  onName: () => void;
  initialClusterId?: string;
  onMeaning?: (clusterId: string, value: string) => void;
};

export function NameCards({ state, onCreate, onMove, onSendBack, onRemove, onRename, onStar, onAdd, onBack, onName, initialClusterId, onMeaning }: Props) {
  const [openId, setOpenId] = useState<string | null>(initialClusterId || null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(() => Math.floor(Math.max(0, state.clusters.findIndex(c => c.id === initialClusterId)) / 5));
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [behaviorDraft, setBehaviorDraft] = useState("");
  // Five standards leave room for a two-row card back beside four fronts.
  const pages = Math.max(1, Math.ceil(state.clusters.length / 5));
  const currentPage = Math.min(page, pages - 1);
  const cards = state.clusters.slice(currentPage * 5, currentPage * 5 + 5);
  const placed = new Set(state.clusters.flatMap(c => c.behaviorIds)).size;
  const checked = state.clusters.filter(c => c.keystoneBehaviorId && c.behaviorIds.includes(c.keystoneBehaviorId)).length;
  const turn = (id: string | null) => {
    setOpenId(id); setMenuId(null); setRemovingId(null); setRenamingId(null); setAddingId(null);
  };
  return <div className="vxnc-layout vxnc-cards" data-name-moment="cards">
    <header className="vxnc-cards-heading">
      <div className="vx-eyebrow" aria-live="polite">ALL {placed} {placed === 1 ? "BEHAVIOR" : "BEHAVIORS"} SORTED · {checked} OF {state.clusters.length} CHECKED</div>
      <h2>Here’s how your behaviors group together.</h2>
      <p className="vxnc-cards-lead">Turn each card. Check the name fits, and star the one you’d defend first.</p>
    </header>
    {creating ? <div className="vxnc-create-area">
      <NameCreate onCancel={() => setCreating(false)} onCreate={name => {
        onCreate(name); setCreating(false);
      }} />
    </div> : null}
    <div className="vxnc-grid" style={{
      "--vxnc-desktop-rows": openId ? 2 : Math.max(1, Math.ceil(cards.length / 3)),
      "--vxnc-phone-rows": Math.max(1, Math.ceil(cards.length / 2)),
    } as React.CSSProperties}>
      {cards.map(cluster => <article key={cluster.id} data-standard-id={cluster.id}
        className={`vxnc-standard${openId === cluster.id ? " is-turned" : ""}`}>
        <div className="vxnc-flipper">
          <button type="button" className="vxnc-front" aria-expanded={openId === cluster.id}
            aria-label={`${standardName(state, cluster.id)}, ${behaviorCount(cluster.behaviorIds.length)} · tap to turn`}
            aria-hidden={openId === cluster.id} tabIndex={openId === cluster.id ? -1 : 0}
            onClick={() => turn(cluster.id)}>
            <span className="vxnc-star" aria-hidden>★</span>
            <strong>{standardName(state, cluster.id)}</strong>
            <small>{cluster.keystoneBehaviorId && cluster.behaviorIds.includes(cluster.keystoneBehaviorId)
              ? `✓ ★ ${m4BehaviorTextById(state, cluster.keystoneBehaviorId) ?? ""}`
              : `${behaviorCount(cluster.behaviorIds.length)} · tap to turn`}</small>
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
            {renamingId === cluster.id ? <form className="vxnc-rename" onSubmit={event => {
              event.preventDefault();
              if (!nameDraft.trim()) return;
              onRename(cluster.id, nameDraft.trim()); setRenamingId(null);
            }}>
              <label>A WORD OR TWO<input autoFocus aria-label="Standard name" value={nameDraft}
                onChange={event => setNameDraft(event.target.value)} /></label>
              <div><button type="submit" disabled={!nameDraft.trim()}>Save</button>
                <button type="button" onClick={() => setRenamingId(null)}>Cancel</button></div>
            </form> : <>
              <header><h3>{standardName(state, cluster.id)}</h3>
                <button type="button" onClick={() => turn(null)}>↺ turn back</button></header>
              <button type="button" className="vxnc-edit-link" onClick={() => {
                setNameDraft(standardName(state, cluster.id)); setRenamingId(cluster.id);
              }}>Change the name</button>
              {onMeaning && <label className="mom-meaning">What it means to me
                <textarea aria-label="What this standard means to me" value={cluster.userDefinition || ""}
                  onChange={event => onMeaning(cluster.id, event.target.value)} rows={3} />
              </label>}
            </>}
            <p className="vxnc-star-instruction">Tap ☆ on the one you’d defend first.</p>
            <div className="vxnc-card-list">
              {cluster.behaviorIds.map(id => <div className={`vxnc-card-row${cluster.keystoneBehaviorId === id ? " is-starred" : ""}`} key={id}>
                <div className="vxnc-evidence-line">
                <button type="button" className="vxnc-evidence-star" aria-pressed={cluster.keystoneBehaviorId === id}
                  aria-label={`Star ${m4BehaviorTextById(state, id) ?? "behavior"}`}
                  onClick={() => onStar(cluster.id, id)}>{cluster.keystoneBehaviorId === id ? "★" : "☆"}</button>
                <button type="button" className="vxnc-behavior-row" aria-expanded={menuId === id}
                  onClick={() => setMenuId(menuId === id ? null : id)}>
                  {state.admire.find(b => b.id === id)?.text || state.irks.find(b => b.id === id)?.text || ""}
                </button>
                </div>
                {menuId === id && <div className="vxnc-move-menu" aria-label="Move this behavior">
                  <span>Place in…</span>
                  {state.clusters.filter(c => c.id !== cluster.id).map(target => <button type="button" key={target.id}
                    onClick={() => { onMove(id, cluster.id, target.id); setMenuId(null); }}>
                    {standardName(state, target.id)}
                  </button>)}
                  <button type="button" onClick={() => { onMove(id, cluster.id, "new"); setMenuId(null); }}>+ New standard</button>
                  <button type="button" onClick={() => onSendBack(id, cluster.id)}>↩ Send back</button>
                  <button type="button" onClick={() => onSendBack(id, cluster.id)}>Remove</button>
                </div>}
              </div>)}
              {cluster.behaviorIds.length === 0 && <p className="vxnc-empty">Nothing placed yet.</p>}
              {addingId === cluster.id ? <form className="vxnc-add" onSubmit={event => {
                event.preventDefault();
                if (!behaviorDraft.trim()) return;
                onAdd(cluster.id, behaviorDraft.trim()); setAddingId(null); setBehaviorDraft("");
              }}>
                <input autoFocus aria-label="Add a behavior" placeholder="A few words…" value={behaviorDraft}
                  onChange={event => setBehaviorDraft(event.target.value)} />
                <button type="submit" disabled={!behaviorDraft.trim()}>Add</button>
                <button type="button" onClick={() => setAddingId(null)}>Cancel</button>
              </form> : <button type="button" className="vxnc-edit-link vxnc-add-link" onClick={() => {
                setBehaviorDraft(""); setAddingId(cluster.id);
              }}>+ Add a behavior</button>}
              <button type="button" className="vxnc-remove-link" onClick={() => setRemovingId(cluster.id)}>Remove this standard</button>
            </div>
            <p className="vxnc-card-hint">Tap a behavior’s words to move it or send it back.</p>
            </>}
          </section>
        </div>
      </article>)}
    </div>
    <div className="vxnc-new-below"><button type="button" onClick={() => setCreating(true)}>+ New standard</button></div>
    {pages > 1 && <nav className="vxnc-card-pages" aria-label="Standard cards">
      <button type="button" aria-label="Previous cards" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); turn(null); }}>‹</button>
      <span aria-live="polite">{currentPage + 1} of {pages}</span>
      <button type="button" aria-label="Next cards" disabled={currentPage + 1 === pages} onClick={() => { setPage(currentPage + 1); turn(null); }}>›</button>
    </nav>}
    <footer className="na1-m4-disc-foot">
      <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>
      <button type="button" className="na1-m4-continue" onClick={onName}>{state.claimed ? "Next →" : "Next: the standards you hold →"}</button>
    </footer>
  </div>;
}
