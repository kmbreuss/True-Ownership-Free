import type { ReactNode } from "react";
import type { RCScene } from "../../rcConstants";

// FC-16: six steps, four tiles each. Labels are in the reader's voice (approved by Katherine).
export type SceneKey = "morning" | "work" | "family" | "people" | "money" | "feels";
export interface Tile { id: string; label: string; bg: string }
export const SCENE_STEPS: { key: SceneKey; name: string; short: string; prompt: string; tiles: Tile[] }[] = [
  { key: "morning", name: "Morning", short: "Morning", prompt: "How does your morning start? Pick the one that feels like you.", tiles: [
    { id: "morning:sunrise", label: "Slow sunrise", bg: "sand" }, { id: "morning:coffee", label: "Coffee before anyone needs me", bg: "cream" },
    { id: "morning:walk", label: "A walk first", bg: "mint" }, { id: "morning:work", label: "Starting on my work", bg: "sand" }] },
  { key: "work", name: "Work", short: "Work", prompt: "What does your work look like? Pick the one that feels like you.", tiles: [
    { id: "work:team", label: "My team takes the first call", bg: "cream" }, { id: "work:done", label: "I stop when the day is done", bg: "sand" },
    { id: "work:mine", label: "I do the work only I can do", bg: "mint" }, { id: "work:no", label: "I say no, and it holds", bg: "blush" }] },
  { key: "family", name: "Family · home", short: "Family · home", prompt: "How does home feel? Pick the one that feels like you.", tiles: [
    { id: "family:home", label: "Home in time for what matters", bg: "sand" }, { id: "family:dinner", label: "Dinner without my phone", bg: "cream" },
    { id: "family:there", label: "I'm actually there", bg: "blush" }, { id: "family:evening", label: "A slow evening together", bg: "mint" }] },
  { key: "people", name: "People", short: "People", prompt: "Who is around you? Pick the one that feels like you.", tiles: [
    { id: "people:friends", label: "Friends I see, not just text", bg: "cream" }, { id: "people:checks", label: "Someone checks in on me", bg: "blush" },
    { id: "people:help", label: "I ask for help, and get it", bg: "sand" }, { id: "people:real", label: "People who know the real me", bg: "mint" }] },
  { key: "money", name: "Money", short: "Money", prompt: "How does money feel? Pick the one that feels like you.", tiles: [
    { id: "money:number", label: "I know my number", bg: "sand" }, { id: "money:account", label: "I check my account without dread", bg: "cream" },
    { id: "money:aside", label: "Enough set aside", bg: "mint" }, { id: "money:choose", label: "My money goes where I choose", bg: "blush" }] },
  { key: "feels", name: "How it feels", short: "How it feels", prompt: "How does it feel? Pick up to three.", tiles: [
    { id: "feels:calm", label: "Calm", bg: "mint" }, { id: "feels:trusted", label: "Trusted", bg: "cream" },
    { id: "feels:free", label: "Free", bg: "sand" }, { id: "feels:present", label: "Present", bg: "blush" }] },
];
const ALL = SCENE_STEPS.flatMap(s => s.tiles);
export const tileById = (id: string) => ALL.find(t => t.id === id);
// A saved value is a tile id, or the reader's own words.
export const labelOf = (value: string) => tileById(value)?.label ?? value.trim();
const sentence = (text: string) => { const t = text.trim(); return t ? (/[.!?…]$/.test(t) ? t : `${t}.`) : ""; };
export function composeLine(scene: RCScene): string {
  return (["morning", "work", "family", "people", "money"] as const).map(k => sentence(labelOf(scene[k]))).filter(Boolean).join(" ");
}
export const EMPTY_SCENE: RCScene = { morning: "", work: "", family: "", people: "", money: "", feels: [], ownWords: "" };

const st = { fill: "none", stroke: "var(--gold)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const sp = "#036360", glowFill = "#E3C27E", soft = "#F5E2BD";
const art: Record<string, ReactNode> = {
  "morning:sunrise": <><path d="M26 58a34 34 0 0 1 68 0z" fill={glowFill} /><path {...st} d="M10 58h100M60 14v8M30 24l5 5M90 24l-5 5M16 44h8M96 44h8" /></>,
  "morning:coffee": <><path {...st} d="M38 34h38v22a10 10 0 0 1-10 10H48a10 10 0 0 1-10-10zM76 40h6a7 7 0 0 1 0 14h-6M34 70h50" fill="#fff" /><path {...st} d="M50 14c-4 5 4 8 0 14M64 14c-4 5 4 8 0 14" /></>,
  "morning:walk": <><path d="M0 62c20-12 50-12 70-2s40 2 50-4v20H0z" fill="#BFD6C2" /><circle cx="62" cy="22" r="7" fill={sp} /><path d="M62 29v22M50 38h24M62 51l-9 15M62 51l9 15" stroke={sp} strokeWidth="4" strokeLinecap="round" fill="none" /></>,
  "morning:work": <><rect {...st} x="34" y="22" width="48" height="30" rx="3" fill="#fff" /><path {...st} d="M22 62h76M30 62v12M90 62v12" /><circle cx="88" cy="50" r="8" fill={sp} /></>,
  "work:team": <><circle cx="40" cy="30" r="8" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><circle cx="60" cy="24" r="9" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><circle cx="80" cy="30" r="8" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><path {...st} d="M26 62c2-12 8-18 14-18M44 62c2-14 8-20 16-20s14 6 16 20M94 62c-2-12-8-18-14-18" /><rect x="52" y="64" width="16" height="8" rx="3" fill={sp} /></>,
  "work:done": <><circle {...st} cx="48" cy="40" r="22" fill="#fff" /><path {...st} d="M48 26v14l-8 10" /><path d="M86 20a12 12 0 1 0 8 20 10 10 0 0 1-8-20z" fill={glowFill} /></>,
  "work:mine": <><circle {...st} cx="60" cy="40" r="26" fill="#fff" /><path d="M60 20l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill={sp} /></>,
  "work:no": <><circle {...st} cx="60" cy="40" r="24" fill="#fff" /><path stroke="#7A2E2E" strokeWidth="5" strokeLinecap="round" d="M44 40h32" /><path {...st} d="M36 72h48" /></>,
  "family:home": <><path {...st} d="M26 44l34-26 34 26v28H26z" fill="#fff" /><rect x="52" y="48" width="16" height="24" fill={glowFill} /><circle cx="96" cy="20" r="9" {...st} /><path {...st} d="M96 15v5l3 3" /></>,
  "family:dinner": <><circle {...st} cx="60" cy="42" r="20" fill="#fff" /><path {...st} d="M28 24v34M24 24v10a4 4 0 0 0 8 0V24M96 24v34" /><rect x="84" y="14" width="14" height="22" rx="3" {...st} /><path stroke="#7A2E2E" strokeWidth="3" strokeLinecap="round" d="M80 12l22 26" /></>,
  "family:there": <><circle cx="44" cy="30" r="8" fill={sp} /><circle cx="76" cy="30" r="8" fill={sp} /><path {...st} d="M30 66c2-16 8-24 14-24s12 8 14 24M62 66c2-16 8-24 14-24s12 8 14 24" /><path d="M60 16c-6-8-14 2-6 8l6 5 6-5c8-6 0-16-6-8z" fill="#7A2E2E" /></>,
  "family:evening": <><path {...st} d="M18 62h84v10H18zM26 62V48a6 6 0 0 1 6-6h56a6 6 0 0 1 6 6v14" fill="#fff" /><path {...st} d="M98 18v28" /><path d="M90 18h16l-3 12H93z" fill={glowFill} /><path d="M32 16a10 10 0 1 0 6 18 8 8 0 0 1-6-18z" fill={glowFill} /></>,
  "people:friends": <><path {...st} d="M26 34h26v20a8 8 0 0 1-8 8h-10a8 8 0 0 1-8-8zM52 40h5a6 6 0 0 1 0 12h-5M68 34h26v20a8 8 0 0 1-8 8H76a8 8 0 0 1-8-8z" fill="#fff" /><path {...st} d="M34 14c-3 4 3 6 0 12M44 14c-3 4 3 6 0 12M76 14c-3 4 3 6 0 12M86 14c-3 4 3 6 0 12" /></>,
  "people:checks": <><path {...st} d="M24 20h72a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H54l-14 12V58H24a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z" fill="#fff" /><path d="M60 46c-8-9-18 0-9 7l9 7 9-7c9-7-1-16-9-7z" fill="#7A2E2E" /></>,
  "people:help": <><circle cx="38" cy="28" r="8" fill={sp} /><circle cx="86" cy="28" r="8" fill={sp} /><path {...st} d="M26 66c2-14 7-22 12-22 4 0 8 3 12 8l22 4M96 66c-2-14-7-22-10-22" /><path {...st} d="M60 56l-8-4M62 54l10-2" /></>,
  "people:real": <><circle cx="38" cy="32" r="8" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><circle cx="60" cy="24" r="10" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><circle cx="82" cy="32" r="8" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><path {...st} d="M22 66c2-14 8-22 16-22M42 70c2-18 9-26 18-26s16 8 18 26M98 66c-2-14-8-22-16-22" fill={soft} /></>,
  "money:number": <><rect {...st} x="36" y="10" width="48" height="62" rx="6" fill="#fff" /><rect x="42" y="16" width="36" height="14" rx="2" fill={sp} /><path {...st} strokeWidth="4" d="M46 42h4M60 42h4M74 42h4M46 54h4M60 54h4M74 54h4" /></>,
  "money:account": <><rect {...st} x="38" y="8" width="44" height="66" rx="8" fill="#fff" /><path stroke={sp} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M48 40l8 8 16-18" /><path {...st} d="M50 62h20" /></>,
  "money:aside": <><path {...st} d="M40 24h40v6l4 6v30a6 6 0 0 1-6 6H42a6 6 0 0 1-6-6V36l4-6z" fill="#fff" /><ellipse cx="60" cy="62" rx="14" ry="5" fill={glowFill} /><ellipse cx="60" cy="54" rx="14" ry="5" fill={glowFill} stroke="var(--gold)" strokeWidth="2" /></>,
  "money:choose": <><circle cx="30" cy="40" r="12" fill={glowFill} stroke="var(--gold)" strokeWidth="3" /><path {...st} d="M44 40h20M64 40l22-16M64 40l22 16M80 20l8 4-4 8M80 60l8-4-4-8" /></>,
  "feels:calm": <><path {...st} d="M14 30c12-10 22 10 34 0s22 10 34 0 14-4 24 0M14 48c12-10 22 10 34 0s22 10 34 0 14-4 24 0M14 66c12-10 22 10 34 0s22 10 34 0 14-4 24 0" /></>,
  "feels:trusted": <><circle {...st} cx="48" cy="40" r="20" fill="#fff" /><circle {...st} cx="72" cy="40" r="20" fill="#fff" /><path fill="none" stroke={sp} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M54 40l5 5 8-10" /></>,
  "feels:free": <><path {...st} d="M16 46c14-4 28-12 44-30 0 18 8 30 44 32-30 4-34 12-44 24-6-12-14-20-44-26z" fill="#fff" /></>,
  "feels:present": <><circle {...st} cx="60" cy="40" r="28" fill="#fff" /><circle cx="60" cy="40" r="12" fill={glowFill} /><circle cx="60" cy="40" r="4" fill={sp} /></>,
};
const BG: Record<string, string> = { sand: "#F5E4BE", cream: "#F4EBDA", mint: "#E3EDE5", blush: "#F4E3DD" };
export function TileArt({ id, bg }: { id: string; bg?: string }) {
  const color = BG[bg ?? tileById(id)?.bg ?? "cream"];
  // The colour sits on the wrapper so wide tiles never crop the picture.
  return <span className="fc-tile-art" style={{ background: color }}><svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className="fc-tile-svg">{art[id]}</svg></span>;
}
// Future A (grey fog) and Future B (sunrise) road pictures.
export function RoadFuture({ kind }: { kind: "a" | "b" }) {
  return kind === "a"
    ? <svg viewBox="0 0 340 110" className="fc-road" aria-hidden="true" focusable="false"><defs><linearGradient id="fa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C5C0B9" /><stop offset="1" stopColor="#DAD7D2" /></linearGradient></defs>
      <rect width="340" height="110" rx="20" fill="url(#fa)" /><path d="M0 76c40-8 80-10 120-2" fill="none" stroke="#A9A49C" strokeWidth="2" /><path d="M54 40c10-8 22-8 32 0M110 30c10-8 22-8 30 0" fill="none" stroke="#A9A49C" strokeWidth="2" strokeLinecap="round" />
      <path d="M176 110l128-80 12 6-110 74z" fill="#9A958D" /><path d="M214 96l84-54" stroke="#E9E6E0" strokeWidth="3" strokeDasharray="8 8" /></svg>
    : <svg viewBox="0 0 340 110" className="fc-road" aria-hidden="true" focusable="false"><defs><linearGradient id="fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0C8" /><stop offset="1" stopColor="#F6E3B5" /></linearGradient></defs>
      <rect width="340" height="110" rx="20" fill="url(#fb)" /><circle cx="170" cy="52" r="26" fill="#FDE9A8" opacity=".85" /><circle cx="170" cy="54" r="18" fill="#FBE3A0" />
      <path d="M0 64c60-10 120-12 170-6 60 6 120 4 170-6v58H0z" fill="#EAD7AA" /><path d="M158 110l12-48 12 48z" fill="#E3C27E" /><path d="M170 66v40" stroke="#fff" strokeWidth="3" strokeDasharray="6 8" /></svg>;
}
