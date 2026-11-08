import type { A2State } from "../a2Constants";
import type { A3State } from "../a3Constants";
import type { A4State } from "../a4Constants";
import type { A5State } from "../a5Constants";
import type { MirrorIllustrationId } from "./MirrorIllustration";

export type CardFinding = { id: MirrorIllustrationId; name: string; lead: string; answer: string };
const present = (value: string | null | undefined): value is string => typeof value === "string" && !!value.trim();
const join = (values: (string | null | undefined)[]) => values.filter(present).join(" · ");
const first = (values: (string | null | undefined)[]) => values.find(present) ?? "";

export function a2CardFindings(a2: A2State, explicitAlignment: string): CardFinding[] {
  return [
    { id: "a2-alignment-check", name: "Alignment Check", lead: "The gap to close:", answer: explicitAlignment },
    { id: "a2-time-audit", name: "Time Audit", lead: "Protecting:", answer: join(a2.m2.priorities) },
    { id: "a2-named-truth", name: "Named Truth", lead: "My move:",
      answer: first([a2.m3.moveText, ...a2.m3.priorityCommitments.map(item => item.activity)]) },
  ];
}

export function a3CardFindings(a3: A3State): CardFinding[] {
  const advocates = a3.m1.names.filter(name => a3.m1.ratings[name] === "advocate");
  const places = a3.m2.items.filter(item => item.rating === "advocate").map(item => item.name);
  const thoughts = a3.m3.thoughts.filter(thought => thought.verdict === "coach").map(thought => thought.text);
  return [
    { id: "a3-people", name: "People", lead: "My advocates:", answer: join(advocates) },
    { id: "a3-environment", name: "Environment", lead: "What helps me:", answer: first([a3.m2.takeaway, join(places)]) },
    { id: "a3-thoughts", name: "Thoughts", lead: "The voice I want:",
      answer: first([a3.m3.voiceWant, ...a3.m3.thoughts.map(thought => thought.reframe)]) },
    { id: "a3-energy-map", name: "Energy Map", lead: "What lifts me:", answer: join([...advocates, ...places, ...thoughts]) },
    { id: "a3-the-board", name: "The Board", lead: "At my table:",
      answer: join(a3.m5.seats.filter(seat => present(seat.name)).map(seat => join([seat.role, seat.name]))) },
    { id: "a3-the-move", name: "The Move", lead: "My one move:",
      answer: a3.m6.bottleneck ? a3.m6[a3.m6.bottleneck] ?? "" : "" },
  ];
}

export function a4CardFindings(a4: A4State): CardFinding[] {
  return (["self", "time", "wealth"] as const).map(key => ({
    id: `a4-${key}`, name: key[0].toUpperCase() + key.slice(1),
    // A member may type a full sentence into a fragment prompt. Never rewrite it
    // or double its existing "I will"; use the lead-in only when it is missing.
    lead: /^\s*i will\b/i.test(a4[key].will) ? "" : "I will",
    answer: a4[key].will,
  }));
}

export function a5CardFindings(a5: A5State): CardFinding[] {
  const keys = ["self", "time", "wealth"] as const;
  const latest = [...a5.checkins].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at))[0];
  const iso = latest?.date;
  // Date-only parsing in UTC avoids moving an ISO date to the previous day on
  // an American phone. Reject invalid calendar dates instead of inventing one.
  const date = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00Z`) : null;
  const shortDate = date && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date) : "";
  return [
    { id: "a5-commitment", name: "My Commitment", lead: "This week:", answer: join(keys.map(key => a5.plans[key].week)) },
    { id: "a5-weekly-check-in", name: "Weekly Check-In", lead: "Last check-in:", answer: shortDate },
    { id: "a5-90-day-look-back", name: "90-Day Look-Back", lead: "Next 90 days:",
      answer: a5.reset90 ? join(keys.filter(key => !!a5.reset90?.choices[key]).map(key => a5.plans[key].ninety)) : "" },
  ];
}
