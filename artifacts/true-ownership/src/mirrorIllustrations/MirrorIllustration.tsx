import type { ReactNode } from "react";
import "./mirror-illustrations.css";

export type IllustrationState = "later" | "next" | "claimed";
export type SavedCreature = { animalEmoji?: string; animal?: string; name?: string };
const warm = { fill: "var(--ill-warm,none)", fillOpacity: .5 };
const accent = { fill: "var(--ill-accent,none)" };

// Geometry supplied in Mirror-illustrations-svg.zip. Stroke defaults are shared
// rather than repeating the same attributes on every path.
const artwork = {
  "a1-values": <><circle cx="60" cy="45" r="28" {...warm}/><path d="M60 21 L66 45 L60 69 L54 45 Z" {...accent}/><circle cx="60" cy="45" r="2.5" fill="currentColor" stroke="none"/><path d="M28 45h6 M86 45h6 M60 11v5 M60 74v5"/></>,
  "a1-identity": <><path d="M60 12 L90 22 V46 C90 64 76 74 60 80 C44 74 30 64 30 46 V22 Z" {...warm}/><path d="M46 50 q14 -16 28 0 M52 40 h.01 M68 40 h.01"/></>,
  "a1-purpose": <><circle cx="60" cy="48" r="30" fill="var(--ill-warm,none)" fillOpacity=".35" stroke="none"/><path d="M54 15 a6 6 0 0 1 12 0"/><path d="M48 24 L60 15 L72 24 Z"/><rect x="45" y="24" width="30" height="5" rx="1.5"/><path d="M47 29 L44 66 H76 L73 29 Z" {...warm}/><path d="M53 29 L52 66 M67 29 L68 66" opacity=".55"/><path d="M60 60 c-8 -5 -7 -14 0 -21 c7 7 8 16 0 21z" {...accent}/><rect x="42" y="66" width="36" height="6" rx="2"/><g stroke="var(--ill-rays,none)" opacity=".75"><path d="M32 46h-8 M96 46h-8 M36 30l-6-4 M84 30l6-4 M36 62l-6 4 M84 62l6 4"/></g></>,
  "a1-vision": <><path d="M22 62H98"/><path d="M40 62a20 20 0 0 1 40 0" {...warm}/><path d="M60 31v-9 M80 39l6-6 M40 39l-6-6 M90 53h8 M22 53h8"/><path d="M42 72Q60 66 78 72" opacity=".6"/></>,
  "a2-alignment-check": <><rect x="22" y="34" width="76" height="22" rx="11" {...warm}/><rect x="50" y="39" width="20" height="12" rx="6" {...accent}/><path d="M60 30v-8 M60 60v8 M34 45h6 M80 45h6"/></>,
  "a2-time-audit": <><path d="M42 16h36 M42 74h36"/><path d="M46 16 C46 34 74 34 74 45 C74 56 46 56 46 74 M74 16 C74 34 46 34 46 45 C46 56 74 56 74 74"/><path d="M52 70 C52 62 68 62 68 70 Z" {...warm}/><path d="M60 48v10" strokeDasharray="2 3"/></>,
  "a2-named-truth": <><circle cx="44" cy="45" r="14" {...warm}/><circle cx="44" cy="45" r="4" {...accent}/><path d="M58 45H96 M84 45v10 M92 45v7"/></>,
  "a3-people": <><circle cx="60" cy="30" r="8" {...warm}/><path d="M46 58c2-12 26-12 28 0"/><circle cx="34" cy="40" r="6"/><path d="M24 62c1-9 19-9 20 0"/><circle cx="86" cy="40" r="6"/><path d="M76 62c1-9 19-9 20 0"/><path d="M28 72 Q60 82 92 72" opacity=".6"/></>,
  "a3-environment": <><path d="M30 44 L60 20 L90 44 V74 H30 Z" {...warm}/><rect x="40" y="50" width="14" height="14" rx="2"/><path d="M74 74 V62 M74 62 c-8 -2 -8 -10 0 -12 c8 2 8 10 0 12 z" {...accent}/></>,
  "a3-thoughts": <><path d="M40 56 C26 56 26 36 40 36 C40 22 60 20 64 30 C76 22 92 32 86 44 C96 50 88 62 78 58 C72 66 52 66 48 58 Z" {...warm}/><circle cx="38" cy="68" r="3.5"/><circle cx="30" cy="76" r="2"/></>,
  "a3-energy-map": <><rect x="28" y="30" width="58" height="30" rx="6"/><path d="M86 39h5v12h-5"/><rect x="33" y="35" width="30" height="20" rx="3" {...warm}/><path d="M50 36 L44 46 H52 L46 54"/></>,
  "a3-the-board": <><circle cx="60" cy="45" r="16" {...warm}/><circle cx="60" cy="19" r="5"/><circle cx="86" cy="45" r="5" {...accent}/><circle cx="60" cy="71" r="5"/><circle cx="34" cy="45" r="5"/><circle cx="79" cy="27" r="4"/><circle cx="41" cy="63" r="4"/></>,
  "a3-the-move": <><circle cx="30" cy="62" r="6" {...warm}/><path d="M38 58 C56 48 66 40 84 30" strokeDasharray="4 5"/><path d="M76 26 L88 28 L84 40"/></>,
  "a4-self": <><ellipse cx="60" cy="36" rx="18" ry="22" {...warm}/><path d="M60 58v18 M52 76h16"/><path d="M52 32 q8 -8 14 0" opacity=".7"/></>,
  "a4-time": <><circle cx="60" cy="45" r="27" {...warm}/><path d="M60 26v19l12 8"/><path d="M60 18v4 M87 45h-4 M60 72v-4 M33 45h4"/></>,
  "a4-wealth": <><ellipse cx="60" cy="68" rx="20" ry="5"/><path d="M40 68v-6 M80 68v-6"/><ellipse cx="60" cy="62" rx="20" ry="5" {...warm}/><path d="M60 57V36 M60 44 c-10 0 -14 -8 -14 -12 c8 0 14 4 14 12 M60 38 c8 0 12 -8 12 -12 c-8 0 -12 4 -12 12"/></>,
  "a5-commitment": <><circle cx="60" cy="22" r="6"/><path d="M60 28V74 M46 38h28"/><path d="M34 54 C36 70 50 76 60 76 C70 76 84 70 86 54"/><path d="M28 58l6-6 6 6 M80 58l6-6 6 6"/><circle cx="60" cy="22" r="6" {...warm} stroke="none"/></>,
  "a5-weekly-check-in": <><rect x="30" y="24" width="60" height="50" rx="8" {...warm}/><path d="M30 38h60 M44 18v12 M76 18v12"/><path d="M48 56l8 8 16 -16"/></>,
  "a5-90-day-look-back": <><path d="M86 45 A26 26 0 1 1 78 26"/><path d="M80 16 L79 27 L90 28"/><circle cx="60" cy="45" r="10" {...warm}/><path d="M60 39v6l4 3"/></>,
} satisfies Record<string, ReactNode>;
export type MirrorIllustrationId = keyof typeof artwork;

export function MirrorIllustration({ id, state, creatures = [] }: {
  id: MirrorIllustrationId; state: IllustrationState; creatures?: SavedCreature[];
}) {
  const personalized = id === "a1-identity" && state === "claimed";
  return <div className={`mi-panel mi-${state}`} data-illustration={id} data-state={state} aria-hidden="true">
    <svg viewBox="0 0 120 90" width="120" height="90" focusable="false">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {personalized ? <>
          <path d="M60 12 L90 22 V46 C90 64 76 74 60 80 C44 74 30 64 30 46 V22 Z" {...warm}/>
          {creatures.slice(0, 3).map((creature, index, shown) => {
            const x = shown.length === 1 ? 60 : shown.length === 2 ? 48 + index * 24 : 40 + index * 20;
            const emoji = creature.animalEmoji?.trim();
            const initial = Array.from((creature.animal || creature.name || "").trim())[0] ?? "";
            return <g key={index} data-creature-index={index} stroke="none">
              {!emoji && <circle cx={x} cy="43" r="9" fill="#A5875E"/>}
              <text x={x} y="44" textAnchor="middle" dominantBaseline="central" fontSize={emoji ? 18 : 12}
                fill={emoji ? "currentColor" : "#FFFFFF"}>{emoji || initial}</text>
            </g>;
          })}
          {creatures.length > 3 && <text x="60" y="65" textAnchor="middle" stroke="none" fill="currentColor" fontSize="10">+{creatures.length - 3}</text>}
        </> : artwork[id]}
      </g>
    </svg>
  </div>;
}
