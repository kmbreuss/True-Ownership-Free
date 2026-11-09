/** Decision answers are independent of journey completion. */
export type Response = "yes" | "not-really" | "not-sure" | "doesnt-apply";
export type Call = "yes" | "no" | "not-yet" | "on-my-terms";
export type ContextRow = { id: string; label: string; question: string; words: string; general?: boolean };
export type DecisionRecord = {
  id: string; createdAt: number; updatedAt: number; decision: string;
  kind: "situation" | "choice"; depth: "quick" | "deep"; call: Call;
  answers: {
    look: string; notice: string; upstream: string;
    ownershipItems: { id: string; text: string; ownership: "mine" | "not-mine" | null }[];
    responses: Record<string, Response>;
    preferredCreature: string;
    timeFrom: string;
    advocate: Record<string, { text: string; judgment?: "advocate" | "anchor" }>;
    act: { step: string; date: string };
    accountability: { person: string; date: string };
  };
  contextSnapshot: { rows: ContextRow[]; creatures: { id: string; name: string }[] };
  leaks: string[];
  followUp: null | { result: "worked" | "partly" | "not-yet"; note: string; savedAt: number };
};
export type DecisionStore = { version: 1; items: DecisionRecord[] };
export const EMPTY_DECISIONS: DecisionStore = { version: 1, items: [] };
export const QUICK = ["Start", "Look", "Notice", "All In", "Align", "Advocate", "Act", "Accountability", "Ending"];
export const DEEP = [...QUICK.slice(0,3), "Go upstream", "Sort it to own it", ...QUICK.slice(3)];
export function validDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function findings(record: Pick<DecisionRecord,"answers">) {
  const leaks = Object.entries(record.answers.responses).filter(([,v])=>v==="not-really").map(([id])=>id);
  const unsure = Object.entries(record.answers.responses).filter(([,v])=>v==="not-sure").map(([id])=>id);
  for (const [id,v] of Object.entries(record.answers.advocate)) if (v.judgment==="anchor") leaks.push(`advocate.${id}`);
  return { leaks, unsure };
}
export function rowLabel(id: string, rows: ContextRow[]): string {
  return rows.find(row=>row.id===id)?.label || ({
    align:"Align To It", "advocate.self":"Advocate · Myself", "advocate.people":"Advocate · People",
    "advocate.environment":"Advocate · Environment", "advocate.thoughts":"Advocate · Thoughts",
    act:"Act On It", accountability:"Accountability To It",
  } as Record<string,string>)[id] || id;
}
export function normalizeDecisions(value: unknown): DecisionStore {
  if (!value || typeof value!=="object" || (value as DecisionStore).version!==1 || !Array.isArray((value as DecisionStore).items)) return EMPTY_DECISIONS;
  const items=(value as DecisionStore).items;
  const string=(v:unknown)=>typeof v==="string" && v.length<=20000;
  const object=(v:unknown):v is Record<string,unknown>=>!!v && typeof v==="object" && !Array.isArray(v);
  return {version:1,items:items.filter(r=>r && typeof r.id==="string" && /^[a-zA-Z0-9_-]{1,100}$/.test(r.id) && string(r.decision) &&
    r.decision.trim() && ["yes","no","not-yet","on-my-terms"].includes(r.call) &&
    ["situation","choice"].includes(r.kind) && ["quick","deep"].includes(r.depth) &&
    r.answers && object(r.answers.responses) && object(r.answers.advocate) && r.answers.act && r.answers.accountability &&
    Object.entries(r.answers.responses).every(([id,v])=>/^(allIn\.(values|identity|purpose|vision|general)|align|advocate\.self|act|accountability)$/.test(id) &&
      ["yes","not-really","not-sure","doesnt-apply"].includes(v)) &&
    ["look","notice","upstream","preferredCreature","timeFrom"].every(k=>string(r.answers[k as keyof typeof r.answers])) &&
    ["people","environment","thoughts"].every(k=>object(r.answers.advocate[k]) && string(r.answers.advocate[k].text) &&
      (!r.answers.advocate[k].judgment || ["advocate","anchor"].includes(r.answers.advocate[k].judgment!))) &&
    string(r.answers.act.step) && string(r.answers.accountability.person) &&
    Array.isArray(r.answers.ownershipItems) && Array.isArray(r.contextSnapshot?.rows) &&
    r.answers.ownershipItems.every(i=>i && string(i.id) && string(i.text) && [null,"mine","not-mine"].includes(i.ownership)) &&
    r.contextSnapshot.rows.every(i=>i && string(i.id) && string(i.label) && string(i.question) && string(i.words)) &&
    Array.isArray(r.contextSnapshot?.creatures) && Number.isFinite(r.createdAt) && Number.isFinite(r.updatedAt) &&
    r.contextSnapshot.creatures.every(c=>c && string(c.id) && string(c.name)) &&
    (r.followUp===null || r.followUp && ["worked","partly","not-yet"].includes(r.followUp.result) && string(r.followUp.note) && Number.isFinite(r.followUp.savedAt)) &&
    typeof r.answers.act.date==="string" && typeof r.answers.accountability.date==="string" &&
    validDate(r.answers.act.date) && validDate(r.answers.accountability.date)
  ).map(r=>({...r,leaks:findings(r).leaks}))};
}
/** Union by ID: an unrelated decision can never disappear during reconciliation. */
export function mergeDecisions(a: unknown, b: unknown): DecisionStore {
  const records=new Map<string,DecisionRecord>();
  for(const r of [...normalizeDecisions(a).items,...normalizeDecisions(b).items]){
    const old=records.get(r.id);
    if(!old || r.updatedAt>old.updatedAt) records.set(r.id,r);
  }
  return {version:1,items:[...records.values()].sort((a,b)=>b.createdAt-a.createdAt)};
}
