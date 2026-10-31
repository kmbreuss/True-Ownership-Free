import type { ReactNode } from "react";
import type { RCState } from "../rcConstants";
import { purposeNamedContext, shortFutureWords } from "../purposeContext";
import "./purpose-context.css";

export function PurposeContextFrame({ kind, values, identity, rc, children }: {
  kind: string; values: unknown; identity: unknown; rc: RCState; children: ReactNode;
}) {
  if (kind !== "peel" && kind !== "declare") return <>{children}</>;
  const { ranked, creatures } = purposeNamedContext(values, identity);
  const hasContext = ranked.length > 0 || creatures.length > 0;
  return <div className="purpose-context-frame">
    {kind === "peel" && rc.choice === "B" && rc.futureB5.tuesday.trim() &&
      <p className="purpose-future-prompt">Start from your Future B: why does{" "}
        <em>"{shortFutureWords(rc.futureB5.tuesday)}"</em> matter to you?</p>}
    <div className={hasContext ? "purpose-context-layout" : undefined}>
      {hasContext && <aside className="purpose-named-context" aria-label="What you've already named">
        {ranked.length > 0 && <div><span>What you stand for:</span><p>{ranked.join(", ")}</p></div>}
        {creatures.length > 0 && <div><span>What you carry:</span><p>{creatures.join(", ")}</p></div>}
      </aside>}
      <div className="purpose-context-main">
        {children}
      </div>
    </div>
  </div>;
}
