import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { MirrorIllustration } from "./MirrorIllustration";
import type { CardFinding } from "./findings";
import "../journey/mirror-cards.css";

type PresentationProps = { className?: string; children?: ReactNode };

/**
 * Presentation adapter for the existing hub cards. The original card remains
 * responsible for gates, pips, routes and handlers. No action is added or
 * enabled here, including the recurring A5 actions.
 */
export function IllustratedMirrorGrid({ cards, children }: { cards: CardFinding[]; children: ReactNode }) {
  let index = 0;
  return <div className="na1-mirror-grid mi-grid">{Children.map(children, child => {
    if (!isValidElement<PresentationProps>(child) || child.type !== "article") return child;
    const card = cards[index++];
    if (!card) return child;
    const originalClass = child.props.className ?? "";
    const state = originalClass.includes("is-complete") ? "claimed"
      : originalClass.includes("is-current") ? "next" : "later";
    const claimed = state === "claimed";
    const finding = claimed && card.answer.trim() ? <p key={`${card.id}-finding`} className="mi-finding" data-finding={card.id}>
      {card.lead && <span className="mi-finding-lead">{card.lead}</span>}<span>{card.answer}</span>
    </p> : null;
    const decorate = (nodes: ReactNode): ReactNode => Children.map(nodes, node => {
      if (!isValidElement<PresentationProps>(node)) return node;
      const cls = node.props.className ?? "";
      if (cls.includes("na1-mirror-card-status")) return cloneElement(node, {},
        claimed ? "★ CLAIMED" : state === "next" ? "UP NEXT" : "LATER");
      if (claimed && cls.includes("na1-mirror-card-sub")) return null;
      if (claimed && cls.includes("na1-mirror-card-empty") && node.props.children === "Claimed.") return null;
      if (claimed && node.type === "button") return cloneElement(node, {}, `Revisit ${card.name}`);
      const decorated = cloneElement(node, {}, decorate(node.props.children));
      return node.type === "h2" ? [cloneElement(decorated, { key: `${card.id}-title` }), finding] : decorated;
    });
    return cloneElement(child, {
      className: `${originalClass} jr-mirror-card jr-mirror-${state}`,
    }, <MirrorIllustration id={card.id} state={state}/>, decorate(child.props.children));
  })}</div>;
}
