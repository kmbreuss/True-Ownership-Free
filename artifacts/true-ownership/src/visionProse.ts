import { DOMAIN_LABELS, LENS_DOMAINS, SENTENCE_TEMPLATES, VISION_CHIPS, type Lens } from "./mirror2Constants";

const cap = (s: string) => s === "" ? s : s.charAt(0).toUpperCase() + s.slice(1);
const end = (s: string) => /[.!?…]$/.test(s) ? s : s + ".";
const chipFor = (vision: any, lens: Lens, domain: string): string => {
  const tier = vision?.twoFutures?.futureB?.[lens]?.[domain];
  return tier === 1 || tier === 2 || tier === 3 || tier === 4 ? VISION_CHIPS[lens][domain][tier as 1 | 2 | 3 | 4] : "";
};

/** Existing sentence construction and length limits, with a label only when a chip is absent. */
export function declSentences(vision: any, lens: Lens): string[] {
  const out: string[] = [];
  for (const d of LENS_DOMAINS[lens]) {
    const chip = chipFor(vision, lens, d), tmpl = SENTENCE_TEMPLATES[lens][d];
    const sec = vision?.[lens]?.[d] || {};
    const b1 = String(sec.blank1 || "").trim(), b2 = String(sec.blank2 || "").trim();
    if (!chip && !b1 && !b2) continue;
    const parts = [chip ? end(cap(chip)) : `${DOMAIN_LABELS[lens][d]}:`];
    if (b1) parts.push(end(`${tmpl.stem1} ${b1}${b2 ? `, ${tmpl.stem2} ${b2}` : ""}`));
    else if (b2) parts.push(end(`${tmpl.stem2} ${b2}`));
    out.push(parts.join(" "));
    if (out.join(" ").length >= 130) break;
  }
  return out.slice(0, 2);
}

export function declSummary(vision: any): string {
  let usedLabel = false;
  const pick = (lens: Lens): string => {
    for (const d of LENS_DOMAINS[lens]) {
      const chip = chipFor(vision, lens, d);
      if (chip) return chip;
    }
    const written = LENS_DOMAINS[lens].find(d => {
      const s = vision?.[lens]?.[d];
      return [s?.blank1, s?.blank2].some(v => typeof v === "string" && v.trim());
    });
    if (!written) return "";
    usedLabel = true;
    return DOMAIN_LABELS[lens][written];
  };
  const low = (s: string) => s.replace(/^(I|I'm|I've|I'll)\b/, "$1")
    .replace(/^(?!I\b|I')([A-Z])/, m => m.toLowerCase());
  const parts = (["time", "wealth", "self"] as const).map(pick).filter(Boolean);
  if (!parts.length) return "";
  return usedLabel ? `${parts.join(" · ")}.` : `A life where ${parts.map(low).join(" · ")}.`;
}
