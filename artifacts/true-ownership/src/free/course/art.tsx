import type { ReactNode } from "react";
import type { RCArea } from "../../rcConstants";

// Line illustrations in the mockups' hand: bronze strokes on a pale gold tile.
const stroke = { fill: "none", stroke: "var(--gold)", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
function Svg({ children, size = 64 }: { children: ReactNode; size?: number }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">{children}</svg>;
}
export function IconOwnsYou() {
  return <Svg><path {...stroke} d="M50 32H16M25 23l-9 9 9 9" /><circle cx="54" cy="32" r="4" fill="var(--burgundy-soft)" /></Svg>;
}
export function IconYouOwnIt() {
  return <Svg><circle cx="32" cy="32" r="22" fill="var(--gold-soft)" />
    <path {...stroke} strokeWidth={2} d="M32 10v6M32 48v6M10 32h6M48 32h6" />
    <path d="M32 20l5 14-5 4-5-4z" fill="#036360" /></Svg>;
}
export function AreaIcon({ area }: { area: RCArea }) {
  if (area === "self") return <Svg><circle {...stroke} cx="32" cy="22" r="7" /><path {...stroke} d="M18 46c1-9 7-14 14-14s13 5 14 14z" fill="var(--gold-soft)" /></Svg>;
  if (area === "time") return <Svg><circle {...stroke} cx="32" cy="36" r="16" /><path {...stroke} d="M28 14h8M32 14v6M32 36V26M32 36l8 6" /></Svg>;
  return <Svg><ellipse {...stroke} cx="30" cy="46" rx="15" ry="5" /><path {...stroke} d="M15 46v-8c0 3 7 5 15 5s15-2 15-5v8M15 38v-8c0 3 7 5 15 5s15-2 15-5v8M15 30v-8c0-3 7-5 15-5s15 2 15 5-7 5-15 5-15-2-15-5z" /><path {...stroke} d="M48 10v10M43 15h10" /></Svg>;
}
export function PlayGlyph() {
  return <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M8 5l12 7-12 7z" fill="currentColor" /></svg>;
}
export function Check() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

// ---- Patterns, feelings, shield, pencil ----
import type { RCDefault, RCUnderneath } from "../../rcConstants";
const fillSoft = "var(--gold-soft)";
export function PatternIcon({ pattern }: { pattern: RCDefault }) {
  if (pattern === "avoiding") return <Svg><path {...stroke} d="M20 52V12h20l6 5v35M8 52h48" /><path {...stroke} d="M40 12l6 5v35" fill={fillSoft} /><circle cx="36" cy="33" r="1.8" fill="var(--gold)" /></Svg>;
  if (pattern === "blaming") return <Svg><path {...stroke} d="M10 34h26c4 0 4-7 0-7H22c-5 0-7 2-8 4" fill={fillSoft} /><path {...stroke} d="M10 34c0 6 5 9 12 9h12c4 0 7-3 7-6" /><path {...stroke} d="M42 26h10M48 21l5 5-5 5" /></Svg>;
  if (pattern === "carrying") return <Svg><rect {...stroke} x="25" y="10" width="14" height="8" fill={fillSoft} /><rect {...stroke} x="20" y="18" width="24" height="10" fill={fillSoft} /><rect {...stroke} x="15" y="28" width="34" height="12" fill={fillSoft} /><path {...stroke} d="M20 40c-4 2-7 6-9 10M44 40c4 2 7 6 9 10" /></Svg>;
  return <Svg><rect {...stroke} x="12" y="10" width="40" height="34" rx="2" /><path {...stroke} d="M32 10v34M12 27h40M24 52h16M32 44v8" /><path {...stroke} d="M18 21c2-3 6-3 8 0M38 36c2-3 6-3 8 0" fill="none" /></Svg>;
}
export function FeelingIcon({ feeling }: { feeling: Exclude<RCUnderneath, "other"> }) {
  if (feeling === "fear") return <Svg><path {...stroke} d="M12 42c2-14 10-24 20-24s18 10 20 24M10 46h44" /><circle cx="32" cy="34" r="2.4" fill="var(--gold)" /></Svg>;
  if (feeling === "guilt") return <Svg><path {...stroke} d="M32 10v22M22 20l10-10 10 10" /><rect {...stroke} x="18" y="38" width="28" height="9" rx="2" fill={fillSoft} /></Svg>;
  if (feeling === "shame") return <Svg><circle {...stroke} cx="32" cy="22" r="9" /><path {...stroke} d="M23 22h18M16 52c1-10 7-16 16-16s15 6 16 16" /></Svg>;
  return <Svg><path {...stroke} d="M32 50C16 38 10 30 14 22c3-6 12-6 18 2 6-8 15-8 18-2 2 5-1 10-6 16" fill={fillSoft} /><path {...stroke} d="M32 24v26M44 44l8 8M52 44l-8 8" /></Svg>;
}
export function ShieldIcon() {
  return <Svg><path {...stroke} d="M32 8l20 6v16c0 12-8 20-20 26C20 50 12 42 12 30V14z" fill={fillSoft} /><path {...stroke} d="M32 22v18M23 31h18" /></Svg>;
}
export function PencilIcon() {
  return <Svg><path {...stroke} d="M14 50l4-12 24-24 8 8-24 24zM38 18l8 8" /></Svg>;
}
