import {
  addBehaviorToCluster, createCluster, removeBehaviorFromCluster, updateCluster,
  type Mirror4State,
} from "../mirror4Constants";
import { NameCards } from "./NameCards";
import { NameSort } from "./NameSort";
import { unplacedNameBehaviors } from "./nameData";
import "./name-cards.css";

export function NameBoard({ state, mutate, onBack, onName }: {
  state: Mirror4State;
  mutate: (fn: (state: Mirror4State) => Mirror4State) => void;
  onBack: () => void;
  onName: () => void;
}) {
  const create = (name: string, behaviorId?: string) => mutate(before => {
    const result = createCluster(before, { proposal: "", proposedNames: [], behaviorIds: [] });
    const named = updateCluster(result.state, result.cluster.id, c => ({ ...c, userName: name }));
    return behaviorId ? addBehaviorToCluster(named, result.cluster.id, behaviorId) : named;
  });
  if (unplacedNameBehaviors(state).length) return <NameSort state={state} onBack={onBack}
    onCreate={create} onPlace={(behaviorId, clusterId) => mutate(s => addBehaviorToCluster(s, clusterId, behaviorId))} />;
  return <NameCards state={state} onBack={onBack} onName={onName} onCreate={create}
    onRemove={clusterId => mutate(before => {
      const cluster = before.clusters.find(c => c.id === clusterId);
      if (!cluster) return before;
      const unplaced = cluster.behaviorIds.reduce(
        (next, behaviorId) => removeBehaviorFromCluster(next, clusterId, behaviorId), before);
      return { ...unplaced, clusters: unplaced.clusters.filter(c => c.id !== clusterId),
        rank: unplaced.rank.filter(id => id !== clusterId) };
    })}
    onMove={(behaviorId, fromId, toId) => mutate(s => {
      const stripped = removeBehaviorFromCluster(s, fromId, behaviorId);
      if (toId !== "new") return addBehaviorToCluster(stripped, toId, behaviorId);
      const result = createCluster(stripped, { proposal: "", proposedNames: [], behaviorIds: [] });
      return addBehaviorToCluster(result.state, result.cluster.id, behaviorId);
    })}
    onSendBack={(behaviorId, fromId) => mutate(s => removeBehaviorFromCluster(s, fromId, behaviorId))} />;
}
