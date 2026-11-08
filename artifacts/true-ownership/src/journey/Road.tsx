import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { groupForView, readJourney, ROAD_GROUPS, type JourneySnapshot, type ReadProgress } from "./progress";
import { RoadBar } from "./RoadBar";
import { StepMoment, useStepMoments } from "./StepMoment";
import type { RoadNavigationItem } from "./navigation";
import { DesktopPageLinks, PhoneMenu, menuViews, useFullScreenOverlay } from "../components/PageNavigation";
import { AppearanceOptions } from "../appearance/Appearance";
import "./journey.css";

const point = (t: number) => ({ x: 145 + 57 * Math.sin(t * Math.PI * 5), y: 515 - t * 460 });
type NavigationProps = { navigation: RoadNavigationItem[]; onNavigate: (destination: string) => void };
export function Road({ snapshot, current, newest, onOpen, navigation, onNavigate }: NavigationProps & {
  snapshot: JourneySnapshot; current: string; newest?: string; onOpen?: () => void;
}) {
  const latest = newest ?? snapshot.bricks.findLast(b => b.done)?.id;
  const path = Array.from({ length: 121 }, (_, i) => {
    const p = point(i / 120); return `${i ? "L" : "M"}${p.x},${p.y}`;
  }).join(" ");
  let offset = 0;
  return <div className="jr-road">
    <button type="button" className="jr-road-open" onClick={onOpen}
      aria-label={`Open your road: ${snapshot.count} of ${snapshot.bricks.length} steps finished`} />
    <svg viewBox="0 0 290 570">
      <defs><radialGradient id="jr-star-glow"><stop stopColor="#E2C27E" stopOpacity=".65" /><stop offset="1" stopColor="#E2C27E" stopOpacity="0" /></radialGradient></defs>
      <circle cx="145" cy="29" r={22 + 30 * snapshot.count / snapshot.bricks.length} fill="url(#jr-star-glow)" />
      <text className="jr-star-title" x="145" y="8" textAnchor="middle">FUTURE B</text>
      <circle cx="145" cy="31" r="15" fill="#FFFDF7" stroke="#A5875E" />
      <text className="jr-star" x="145" y="36" textAnchor="middle">★</text>
      <path d={path} fill="none" stroke="#A5875E" strokeOpacity=".13" strokeWidth="8" />
      {snapshot.bricks.map((brick, i) => {
        const p = point(i / (snapshot.bricks.length - 1)), q = point(Math.min(1, (i + .2) / (snapshot.bricks.length - 1)));
        const angle = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI + 90;
        return <g key={brick.id} data-brick={brick.id} data-finished={brick.done || undefined}
          className={brick.id === latest ? "jr-latest" : undefined}
          role={brick.id === latest ? "img" : undefined} aria-label={brick.id === latest ? "Latest step" : undefined}
          onClick={brick.id === latest ? onOpen : undefined}>
          {brick.id === latest && <title>Latest step</title>}
          <rect className={`jr-brick ${brick.done ? "is-done" : ""} ${brick.id === latest ? "is-newest" : ""}`}
            x={p.x - 4} y={p.y - 2.4} width="8" height="4.8" rx="1" transform={`rotate(${angle} ${p.x} ${p.y})`} />
          {brick.id === latest && <circle className="jr-latest-ring" cx={p.x} cy={p.y} r="10" />}
        </g>;
      })}
      {ROAD_GROUPS.map(group => {
        const index = offset + group.total / 2; offset += group.total;
        const p = point(index / snapshot.bricks.length), right = p.x < 145;
        const item = navigation.find(item => item.id === group.id)!;
        return <foreignObject key={group.id} x={right ? 184 : 5} y={p.y - 16} width="101" height="54">
          <button type="button" className={`jr-road-stop ${item.isCurrent ? "is-current" : ""}`}
            data-road-destination={group.id} disabled={!item.destination} aria-label={item.accessibleLabel}
            aria-current={item.isCurrent ? "page" : undefined}
            onClick={e => { e.stopPropagation(); if (item.destination) onNavigate(item.destination); }}>
            <span>{item.isCurrent ? "● " : ""}{item.label}</span>{item.status && <small>{item.status}</small>}
          </button>
        </foreignObject>;
      })}
      <text className="jr-road-label" x="100" y="537">START</text>
      <text className="jr-road-caption" x="145" y="557" textAnchor="middle">{snapshot.count} steps on your road</text>
    </svg>
    <span className="jr-tap-hint">Tap to see every step</span>
  </div>;
}

export function RoadSheet({ snapshot, current, onClose, navigation, onNavigate }: NavigationProps & { snapshot: JourneySnapshot; current: string; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input[type="radio"]:checked,[tabindex="0"]');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [onClose]);
  return createPortal(<div className="jr-sheet-shade" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="jr-sheet" role="dialog" aria-modal="true" aria-labelledby="jr-sheet-title" ref={dialog}>
      <header><h2 id="jr-sheet-title">Your road to Future B</h2><button type="button" onClick={onClose} aria-label="Close your road">×</button></header>
      <div className="jr-sheet-body">
        <nav className="jr-phone-stage-nav" aria-label="Journey stages">
          {navigation.map(item => {
            const locked = !item.destination || item.status === "Unlocks when you join";
            return <button type="button" key={item.id} data-phone-stage={item.id}
              className={`jr-phone-stage ${item.isCurrent ? "is-current" : ""}`}
              disabled={locked} aria-label={item.accessibleLabel}
              aria-current={item.isCurrent ? "page" : undefined}
              onClick={() => { if (!locked && item.destination) onNavigate(item.destination); }}>
              <span>{item.label}</span>
              <span className="jr-phone-stage-end">
                {item.status && <small>{item.status}</small>}
                <span aria-hidden="true">{locked ? "🔒" : "→"}</span>
              </span>
            </button>;
          })}
        </nav>
        <Road snapshot={snapshot} current={current} navigation={navigation} onNavigate={onNavigate}
        onOpen={() => dialog.current?.querySelector<HTMLElement>(".jr-history")?.focus()} />
        <section className="jr-history" tabIndex={0} aria-label="Your finished steps">
          <p className="jr-eyebrow">{snapshot.count} steps on your road</p>
          {!snapshot.count && <p>Your road begins with the Reality Check.</p>}
          {ROAD_GROUPS.map(group => {
            const finished = snapshot.bricks.filter(b => b.group === group.id && b.done);
            return finished.length ? <section key={group.id}><h3>{group.label}</h3><ol>{finished.map(b =>
              <li key={b.id}><span className="jr-history-check">✓</span><div><strong>{b.mirror} · {b.label}</strong>{b.detail && <p>{b.detail}</p>}</div></li>)}</ol></section> : null;
          })}
        </section>
      </div>
      <AppearanceOptions />
    </div>
  </div>, document.body);
}

/** Mounted only once, after the app router has finished cloud hydration. */
export function JourneyRoad({ view, read, navigation, onNavigate, hideMenu = false, canMap = true }: NavigationProps & {
  view: string; read: ReadProgress; hideMenu?: boolean; canMap?: boolean;
}) {
  const [snapshot, setSnapshot] = useState(() => readJourney(read));
  const [open, setOpen] = useState(false);
  const [reviewStage, setReviewStage] = useState<string | null>(null);
  useEffect(() => {
    const receive = (event: Event) => {
      const stage = (event as CustomEvent<string | null>).detail;
      setReviewStage(ROAD_GROUPS.some(group => group.id === stage) ? stage : null);
    };
    window.addEventListener("to-map-review-stage", receive);
    return () => window.removeEventListener("to-map-review-stage", receive);
  }, []);
  const overlayPresent = useFullScreenOverlay();
  const { active, newest } = useStepMoments(snapshot);
  useEffect(() => {
    document.body.classList.add("journey-on");
    const refresh = () => setSnapshot(old => {
      const next = readJourney(read);
      return JSON.stringify(old) === JSON.stringify(next) ? old : next;
    });
    refresh();
    const timer = window.setInterval(refresh, 250);
    window.addEventListener("storage", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", refresh); document.body.classList.remove("journey-on"); };
  }, [read]);
  const current = reviewStage || groupForView(view);
  const activeNavigation = reviewStage ? navigation.map(item => {
    const complete = snapshot.bricks.filter(brick => brick.group === item.id).every(brick => brick.done);
    return { ...item, isCurrent: item.id === current, status: item.id === current ? "You are here"
      : item.status === "You are here" ? complete ? item.id === "rc" ? "Complete" : "Claimed" : "" : item.status };
  }) : navigation;
  return <>
    <aside className="jr-desktop"><Road snapshot={snapshot} current={current} newest={newest}
      navigation={activeNavigation} onNavigate={onNavigate} onOpen={() => setOpen(true)} />
      <DesktopPageLinks view={view} canMap={canMap} onNavigate={onNavigate} />
    </aside>
    <RoadBar snapshot={snapshot} current={current} newestGroup={newest?.split(":")[0]} onOpen={() => setOpen(true)} />
    <PhoneMenu view={view} visible={menuViews.has(view) && !hideMenu && !open && !overlayPresent}
      canMap={canMap} onNavigate={onNavigate} onRoad={() => setOpen(true)} />
    <StepMoment notice={active} />
    {open && <RoadSheet snapshot={snapshot} current={current} navigation={activeNavigation}
      onNavigate={destination => { setOpen(false); onNavigate(destination); }} onClose={() => setOpen(false)} />}
  </>;
}
