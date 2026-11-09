import type { ReactNode } from "react";
import type { MapModel } from "./MapOfMe";
import { STAGES, type MapSection } from "./model";
import { MirrorIllustration, type MirrorIllustrationId } from "../mirrorIllustrations/MirrorIllustration";
import { a2CardFindings, a3CardFindings, a4CardFindings, a5CardFindings, type CardFinding } from "../mirrorIllustrations/findings";
import { normalizePractical, practicalCreatures, weeklyProjection } from "../a1End/practical";
import "./picture-map.css";

export type ShareCardData = { name: string; future: string; values: string[]; creatures: string[]; why: string };
const words = (section?: MapSection) => section?.answers[0]?.text || "";
export function mapShareData(model: MapModel, sections: MapSection[]): ShareCardData {
  return { name: model.name || model.title.replace(/['’]s Map of Me.*$/i, ""), future: model.sources.rc?.futureB5?.tuesday || "",
    values: sections.find(s => s.id === "values-rank")?.ranked?.slice(0, 3) || [],
    creatures: practicalCreatures(model.sources.map?.mirror3).map(c => `${c.emoji} ${c.name}`),
    why: words(sections.find(s => s.id === "purpose")) };
}
function group(id: string, title: string, children: MapSection[]): MapSection {
  const first = children[0];
  return { id, title, stage: first?.stage || "a1", target: first?.target || { stage: "a1", mirror: title, kind: "none" },
    empty: first?.empty || "Fills in as you follow your road", answers: children.flatMap(s => s.answers), children };
}
function members(card: MapSection) { return (card.children || [card]).map(s => s.id).join(" "); }
function PictureCard({ card, illustration, label, open, children, className = "", edit }: {
  card: MapSection; illustration: MirrorIllustrationId; label: string; open: (card: MapSection) => void;
  children: ReactNode; className?: string; edit?: string;
}) {
  return <button type="button" className={`mom-picture ${className}`} data-map-section={card.id} data-map-members={members(card)}
    aria-label={`Open ${label}`} onClick={() => open(card)}>
    <span className="mom-picture-heading"><MirrorIllustration id={illustration} state={card.answers.length ? "claimed" : "later"} />
      <span>{label}</span><span className="mom-picture-chevron" aria-hidden="true">›</span></span>
    {children}
    {edit && <span className="mom-picture-edit">Edit in {edit} →</span>}
  </button>;
}
export function PictureMap({ model, sections, open, onBack, backLabel, download, share, busy }: {
  model: MapModel; sections: MapSection[]; open: (card: MapSection) => void; onBack: () => void;
  backLabel: string; download?: () => void; share: () => void; busy: string;
}) {
  const src = model.sources, get = (id: string) => sections.find(row => row.id === id);
  const values = get("values-rank")?.ranked || [], creatures = practicalCreatures(src.map?.mirror3);
  const shareData = mapShareData(model, sections);
  const valuesCard = group("values-rank", "What I stand for", sections.filter(s => s.id === "values-rank" || s.id.startsWith("value-")));
  const purposeCard = group("purpose", "My why", sections.filter(s => ["purpose", "holdback"].includes(s.id)));
  const identityCard = group("identity", "Who I am", sections.filter(s => s.target.mirror === "Identity"));
  const visionCard = group("vision", "Where I'm going · 10 years", sections.filter(s => s.target.kind === "vision"));
  const was = group("where-i-was", "Where I was", sections.filter(s => s.stage === "rc"));
  const focus = get("rc-focus"), focusLabel = focus?.answers.find(a => a.label === "My focus")?.text || "";
  const defaults = focus?.answers.filter(a => a.label === "My default").map(a => a.text).join(" · ") || src.rc?.tuesday || "";
  const area = src.rc?.focus === "time" ? "time" : ["wealth", "money"].includes(src.rc?.focus) ? "wealth" : "self";
  const going = get(`vision-${area}`), practical = normalizePractical(src.practical);
  const week = weeklyProjection(practical, creatures, src.rc?.futureB1?.oneThing || "", values[0] || "");
  const hasWeek = !!practical.weekReviewedAt || !!src.notice?.lived?.trim() || !!src.notice?.didnt?.trim();
  const findings: Record<string, CardFinding[]> = {
    a2: src.a2 ? a2CardFindings(src.a2, get("alignment-gap")?.answers.find(a => /gap|misalignment/i.test(a.label))?.text || "") : [],
    a3: src.a3 ? a3CardFindings(src.a3) : [], a4: src.a4 ? a4CardFindings(src.a4) : [], a5: src.a5 ? a5CardFindings(src.a5) : [],
  };
  const exports = <div className="mom-picture-exports">
    {download && <button className="mom-export-primary" onClick={download} disabled={!!busy}>{busy === "pdf" ? "Preparing PDF…" : "Download PDF"}</button>}
    <button className="mom-export-secondary" onClick={share} disabled={!!busy}>{busy === "share" ? "Preparing card…" : "Share as a card"}</button>
    <small>As of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
  </div>;
  return <>
    <button className="mom-back mom-picture-back" onClick={onBack}>← Back to {backLabel}</button>
    <div className="mom-picture-layout">
      <aside className="mom-picture-sidebar">
        <section className="mom-title-card" aria-label="My Map of Me">
          <p className="mom-picture-eyebrow">MAP OF ME™</p><h1>{shareData.name || "Map of Me"}</h1><hr />
          <button className="mom-future-quote" onClick={() => open(get("rc-future-b") || was)} data-map-members="rc-future-b">
            {shareData.future ? <q>{shareData.future}</q> : <span>Fills in after Reality Check</span>}
          </button><p className="mom-picture-eyebrow">MY FUTURE B</p>
          <div className="mom-stage-pills">{STAGES.map(stage => <span key={stage.id} className={model.completed[stage.id] ? "is-done" : ""}
            aria-label={`${stage.title}${model.completed[stage.id] ? ", complete" : ""}`}>{stage.id.toUpperCase()}{model.completed[stage.id] ? " ✓" : ""}</span>)}</div>
        </section>
        <div className="mom-then-now">
          <button className="mom-then" onClick={() => open(was)} data-map-members={members(was)}><span>WHERE I WAS</span>
            <p>{defaults || get("rc-focus")?.empty || "Fills in after Reality Check"}</p>{focusLabel && <small>{focusLabel}</small>}</button>
          <button className="mom-now" onClick={() => going && open(going)} data-map-members={going?.id}><span>WHERE I'M GOING</span>
            <p>{words(going) || going?.empty || "Fills in after Vision"}</p><small>In 10 years</small></button>
        </div>
        {hasWeek && get("notice") && <button className="mom-this-week" onClick={() => open(get("notice")!)} data-map-section="notice" data-map-members="notice">
          <span>THIS WEEK</span><p>{week.do && <>Do: {week.do} </>}{week.try && <>Be: {week.creature?.emoji} {week.try} </>}
            {(values[0] || src.notice?.value) && <>Live: {src.notice?.value || values[0]}</>}</p></button>}
        <div className="mom-desktop-exports">{exports}</div>
      </aside>
      <div className="mom-picture-main">
        <p className="mom-section-label">A1 · ALL IN</p>
        <div className="mom-a1-pictures">
          <PictureCard card={valuesCard} illustration="a1-values" label="WHAT I STAND FOR" open={open} className="mom-picture-values" edit="Values">
            {values.length ? <><ol className="mom-ranked">{values.slice(0, 3).map((name, i) => <li key={i}><span aria-hidden="true">{i + 1}</span>{name}</li>)}</ol>
              {values.length > 3 && <span className="mom-rank-rest">and {values.slice(3).join(" · ")}</span>}</> : <p className="mom-empty">Fills in after Values</p>}
          </PictureCard>
          <section className="mom-picture mom-picture-identity">
            <div className="mom-picture-heading"><MirrorIllustration id="a1-identity" state={creatures.length ? "claimed" : "later"}
              creatures={src.map?.mirror3?.clusters || []} /><span>WHO I AM</span><span className="mom-swipe">swipe →</span></div>
            {creatures.length ? <div className="mom-creature-track" tabIndex={0} aria-label="My creatures; swipe for more">
              {creatures.map(creature => {
                const power = get(`creature-${creature.id}`), pressure = get(`pressure-${creature.id}`);
                const card = group(`creature-${creature.id}`, creature.name, [power, pressure].filter((s): s is MapSection => !!s));
                return <button className="mom-creature" key={creature.id} data-map-members={members(card)} data-map-section={card.id} onClick={() => open(card)}>
                  <span className="mom-creature-gold"><strong><span aria-hidden="true">{creature.emoji}</span> {creature.name}</strong>
                    <em>{power?.answers.find(a => /superpower/i.test(a.label))?.text || power?.empty}</em></span>
                  <span className="mom-creature-shadow"><span>UNDER PRESSURE</span><p>{words(pressure) || pressure?.empty}</p></span>
                </button>;
              })}
            </div> : <p className="mom-empty">Fills in after Identity</p>}
            <button className="mom-picture-edit" data-map-members={members(identityCard)} onClick={() => open(identityCard)}>Edit in Identity →</button>
          </section>
          <PictureCard card={purposeCard} illustration="a1-purpose" label="MY WHY" open={open} className="mom-picture-purpose" edit="Purpose">
            <p className={shareData.why ? "mom-why" : "mom-empty"}>{shareData.why || "Fills in after Purpose"}</p>
          </PictureCard>
          <PictureCard card={visionCard} illustration="a1-vision" label="WHERE I'M GOING · 10 YEARS" open={open} className="mom-picture-vision" edit="Vision">
            <span className="mom-vision-rows">{(["time", "wealth", "self"] as const).map(lens => <span key={lens}>
              <small>{lens.toUpperCase()}</small><span>{words(get(`vision-${lens}`)) || "Fills in after Vision"}</span></span>)}</span>
          </PictureCard>
        </div>
        <p className="mom-section-label">THE REST OF YOUR ROAD</p>
        <div className="mom-rest-grid">{STAGES.filter(stage => !["rc", "a1"].includes(stage.id)).map(stage => {
          const children = sections.filter(s => s.stage === stage.id), card = group(`rest-${stage.id}`, stage.title, children);
          const lines = (findings[stage.id] || []).filter(f => f.answer.trim()), empty = !children.some(s => s.answers.length);
          const illustration = (stage.id === "a2" ? "a2-time-audit" : findings[stage.id]?.[0]?.id || "a2-time-audit") as MirrorIllustrationId;
          return <button key={stage.id} className={`mom-rest-card ${empty ? "is-empty" : ""}`} data-map-section={card.id}
            data-map-members={members(card)} aria-label={`Open ${stage.title}`} onClick={() => open(card)}>
            <span className="mom-picture-heading"><MirrorIllustration id={illustration} state={model.completed[stage.id] ? "claimed" : "later"} />
              <span>{stage.title.toUpperCase()}</span>{!empty && <span className="mom-picture-chevron" aria-hidden="true">›</span>}</span>
            {empty ? <p className="mom-empty">Fills in after {stage.id.toUpperCase()}</p> : lines.length
              ? lines.map(line => <p key={line.id}>{line.lead} {line.answer}</p>)
              : <p>{children.flatMap(s => s.answers).slice(0, 2).map(a => a.text).join(" · ")}</p>}
          </button>;
        })}</div>
        <div className="mom-phone-exports">{exports}</div>
      </div>
    </div>
  </>;
}
