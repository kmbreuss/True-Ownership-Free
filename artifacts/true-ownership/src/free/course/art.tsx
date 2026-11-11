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
