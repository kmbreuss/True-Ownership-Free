import type { Mirror4State } from "../mirror4Constants";
import { standardName } from "./nameData";

export function NameSummary({ state, onBack, onNext, reviewing }: {
  state: Mirror4State; onBack: () => void; onNext: () => void; reviewing: boolean;
}) {
  return <div className="vxnc-layout vxnc-summary" data-name-moment="summary">
    <div className="vxnc-summary-body">
      <h2>These are the standards you hold.</h2>
      <dl>{state.clusters.map(cluster => <div key={cluster.id}>
        <dt>{standardName(state, cluster.id)}</dt>
        {cluster.userDefinition.trim() && <dd>{cluster.userDefinition}</dd>}
      </div>)}</dl>
    </div>
    <footer className="na1-m4-disc-foot">
      <button type="button" className="na1-m4-back" onClick={onBack}>← Back</button>
      <button type="button" className="na1-m4-continue" onClick={onNext}>
        {reviewing ? "Next →" : "Next: which one wins →"}
      </button>
    </footer>
  </div>;
}
