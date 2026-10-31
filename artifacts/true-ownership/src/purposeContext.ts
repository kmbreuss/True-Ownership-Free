export function firstSentence(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim();
  const end = /[.!?](?=\s|$)/.exec(text);
  return end ? text.slice(0, end.index + 1) : text;
}

/** Display-only: legacy answers always win; no caller should persist this fallback. */
export function purposeHoldback(saved: unknown, map: any, tuesday: unknown) {
  const candidates = [saved, map?.a1?.purpose?.symptoms?.holdingBack,
    map?.state?.a1?.purpose?.symptoms?.holdingBack,
    map?.purpose?.symptoms?.holdingBack, map?.symptoms?.holdingBack];
  const own = candidates.find(v => typeof v === "string" && v.trim());
  return own
    ? { text: String(own).trim(), fromRealityCheck: false }
    : { text: firstSentence(tuesday), fromRealityCheck: true };
}

export function purposeNamedContext(values: any, identity: any) {
  const clusters = Array.isArray(values?.clusters) ? values.clusters : [];
  const ranked = (Array.isArray(values?.rank) ? values.rank : [])
    .map((id: string) => clusters.find((c: any) => c.id === id))
    .filter(Boolean).map((c: any) => String(c.userName || c.proposal || "").trim())
    .filter(Boolean).slice(0, 5) as string[];
  const creatures = (Array.isArray(identity?.clusters) ? identity.clusters : [])
    .filter((c: any) => typeof c.animal === "string" && c.animal.trim())
    .map((c: any) => [c.descriptorWord1, c.descriptorWord2, c.animal]
      .filter((v: unknown) => typeof v === "string" && v.trim()).join(" ")) as string[];
  return { ranked, creatures };
}

export function shortFutureWords(value: string, limit = 60): string {
  const words = value.trim();
  if (words.length <= limit) return words;
  const head = words.slice(0, limit + 1);
  const boundary = head.lastIndexOf(" ");
  return `${head.slice(0, boundary > 0 ? boundary : limit).trimEnd()}…`;
}
