// ─────────────────────────────────────────────────────────────────────────────
// A4 · Act On It · State module (Ship A4-1 · Hub + Mirror 1 · Self)
// ─────────────────────────────────────────────────────────────────────────────
// Same structural pattern as a2Constants.ts / a3Constants.ts: one dedicated
// localStorage key + EMPTY_* + normalize/load/save/has helpers, registered with
// the account-sync engine (newFlowSync.ts) as the "a4state" store.
//
// A4 builds self-trust — one kept promise at a time. Each of the three mirrors
// (Self · Time · Wealth) walks the same six screens and ends in ONE promise.
// `claimed` is the SOLE driver of a mirror card's Complete state.
//
// A5 reads these fields later — keep the names stable:
//   promise = will + when   · year · gives · stop · plan
//
// This module is pure (no React, no App imports) so the gap-building logic can
// be unit-tested on its own.
// ─────────────────────────────────────────────────────────────────────────────

import { notifyLocalChange } from "./syncHook";
import {
  DOMAIN_LABELS,
  LENS_DOMAINS,
  SENTENCE_TEMPLATES,
  VISION_CHIPS,
  type Lens,
} from "./mirror2Constants";

export const A4_STORAGE_KEY = "to_a4_state_v1";

export type A4MirrorKey = "self" | "time" | "wealth";
export const A4_MIRROR_KEYS: readonly A4MirrorKey[] = ["self", "time", "wealth"];

// What a gap is made of. "own" = the member wrote it themselves.
export type A4GapKind =
  | "behavior"
  | "gift"
  | "shadow"
  | "purpose"
  | "priority"
  | "activity"
  | "person"
  | "place"
  | "own";

// Kinds offered on the "choose your own" form, in the order the brief lists
// them. (The last, "write my own", is the free kind.)
export const A4_OWN_KINDS: { kind: A4GapKind; label: string }[] = [
  { kind: "behavior", label: "A behavior" },
  { kind: "gift", label: "A gift" },
  { kind: "shadow", label: "A shadow" },
  { kind: "purpose", label: "My purpose" },
  { kind: "priority", label: "A priority" },
  { kind: "activity", label: "An activity" },
  { kind: "person", label: "A person" },
  { kind: "place", label: "A place" },
  { kind: "own", label: "Write my own" },
];

export function a4KindLabel(kind: A4GapKind): string {
  switch (kind) {
    case "behavior":
      return "Behavior";
    case "gift":
      return "Gift";
    case "shadow":
      return "Shadow";
    case "purpose":
      return "Purpose";
    case "priority":
      return "Priority";
    case "activity":
      return "Activity";
    case "person":
      return "Person";
    case "place":
      return "Place";
    default:
      return "Your own";
  }
}

// One gap card: what they SAY (said) vs what they actually DO (evidence), and
// where the evidence comes from (source).
export type A4Gap = {
  id: string;
  kind: A4GapKind;
  tag: string; // extra kind label, e.g. the value a behavior belongs to ("" = none)
  said: string;
  evidence: string;
  source: string;
};

export type A4OwnGap = { kind: A4GapKind; said: string; evidence: string };
export type A4Sure = "yes" | "not-yet";
export type A4MoneyAnswer = "Always" | "Sometimes" | "Rarely";

// One mirror's promise. `step` is the screen the member is on (0–5) so a refresh
// lands on the same screen. `picked` is a gap id, "own", or null. `gap` is a
// snapshot of the picked gap, kept so the promise still reads correctly if the
// upstream A2/A3 answers change later.
export type A4MirrorState = {
  step: number; // 0–5
  picked: string | null; // gapId | "own" | null
  own: A4OwnGap | null;
  gap: A4Gap | null; // snapshot of the picked gap (own gaps included)
  every: string; // "Every time I ___"
  prove: string; // "I prove to myself ___"
  will: string; // "I will ___"
  when: string; // "when ___"
  sayNo: string | null; // Time & Wealth only
  year: string; // "A year from now, because I kept this…"
  gives: string; // "Keeping this gives me…"
  stop: string; // "What's most likely to stop me is…"
  plan: string; // "When that happens, I will…"
  sure: A4Sure | null;
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A4_MIRROR: A4MirrorState = {
  step: 0,
  picked: null,
  own: null,
  gap: null,
  every: "",
  prove: "",
  will: "",
  when: "",
  sayNo: null,
  year: "",
  gives: "",
  stop: "",
  plan: "",
  sure: null,
  claimed: false,
  claimedAt: null,
};

export type A4WealthState = A4MirrorState & {
  // Money check (Wealth screen 1), asked fresh: index 0–4 → answer.
  moneyCheck: Record<string, A4MoneyAnswer>;
};

export type A4State = {
  self: A4MirrorState;
  time: A4MirrorState;
  wealth: A4WealthState;
  a4: { claimed: boolean; claimedAt: string | null };
};

export const EMPTY_A4: A4State = {
  self: { ...EMPTY_A4_MIRROR },
  time: { ...EMPTY_A4_MIRROR, sayNo: "" },
  wealth: { ...EMPTY_A4_MIRROR, sayNo: "", moneyCheck: {} },
  a4: { claimed: false, claimedAt: null },
};

const A4_KINDS: readonly A4GapKind[] = [
  "behavior",
  "gift",
  "shadow",
  "purpose",
  "priority",
  "activity",
  "person",
  "place",
  "own",
];
const A4_MONEY: readonly A4MoneyAnswer[] = ["Always", "Sometimes", "Rarely"];

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const isoOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;

function normalizeGap(raw: unknown): A4Gap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const said = str(o.said).trim();
  const evidence = str(o.evidence).trim();
  if (said === "" && evidence === "") return null;
  const kind = A4_KINDS.includes(o.kind as A4GapKind)
    ? (o.kind as A4GapKind)
    : "own";
  return {
    id: str(o.id),
    kind,
    tag: str(o.tag),
    said,
    evidence,
    source: str(o.source),
  };
}

function normalizeOwn(raw: unknown): A4OwnGap | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const kind = A4_KINDS.includes(o.kind as A4GapKind)
    ? (o.kind as A4GapKind)
    : "own";
  const said = str(o.said);
  const evidence = str(o.evidence);
  if (said.trim() === "" && evidence.trim() === "") return null;
  return { kind, said, evidence };
}

// Coerce an unknown blob into a valid A4MirrorState so a corrupt store can't
// poison a mirror. `time`/`wealth` keep a string sayNo; `self` keeps null.
function normalizeMirror(raw: unknown, withSayNo: boolean): A4MirrorState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const stepN = typeof r.step === "number" && Number.isFinite(r.step) ? r.step : 0;
  const own = normalizeOwn(r.own);
  const gap = normalizeGap(r.gap);
  let picked: string | null =
    typeof r.picked === "string" && r.picked.trim() !== "" ? r.picked : null;
  // "own" with no own gap behind it can't be honoured.
  if (picked === "own" && !own) picked = null;
  return {
    step: Math.max(0, Math.min(5, Math.round(stepN))),
    picked,
    own,
    gap,
    every: str(r.every),
    prove: str(r.prove),
    will: str(r.will),
    when: str(r.when),
    sayNo: withSayNo ? str(r.sayNo) : null,
    year: str(r.year),
    gives: str(r.gives),
    stop: str(r.stop),
    plan: str(r.plan),
    sure: r.sure === "yes" || r.sure === "not-yet" ? (r.sure as A4Sure) : null,
    claimed: r.claimed === true,
    claimedAt: isoOrNull(r.claimedAt),
  };
}

function normalizeWealth(raw: unknown): A4WealthState {
  const base = normalizeMirror(raw, true);
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const moneyCheck: Record<string, A4MoneyAnswer> = {};
  const mc = r.moneyCheck;
  if (mc && typeof mc === "object") {
    for (const [k, v] of Object.entries(mc as Record<string, unknown>)) {
      if (/^[0-4]$/.test(k) && A4_MONEY.includes(v as A4MoneyAnswer)) {
        moneyCheck[k] = v as A4MoneyAnswer;
      }
    }
  }
  return { ...base, moneyCheck };
}

export function normalizeA4(raw: unknown): A4State {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const a4raw = (r.a4 && typeof r.a4 === "object" ? r.a4 : {}) as Record<string, unknown>;
  return {
    self: normalizeMirror(r.self, false),
    time: normalizeMirror(r.time, true),
    wealth: normalizeWealth(r.wealth),
    a4: { claimed: a4raw.claimed === true, claimedAt: isoOrNull(a4raw.claimedAt) },
  };
}

export function loadA4State(): A4State {
  try {
    if (typeof window === "undefined") return EMPTY_A4;
    const raw = window.localStorage.getItem(A4_STORAGE_KEY);
    if (!raw) return EMPTY_A4;
    return normalizeA4(JSON.parse(raw));
  } catch {}
  return EMPTY_A4;
}

export function saveA4State(state: A4State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(A4_STORAGE_KEY, JSON.stringify(state));
    notifyLocalChange(A4_STORAGE_KEY);
  } catch {}
}

// True when the A4 schema has ever been written. Used by the hub to seed
// EMPTY_A4 on first-ever mount.
export function hasA4State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(A4_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ─── Gap building (pure) ────────────────────────────────────────────────────

// Everything the gap builder needs, already read out of A1 / A2 / A3 by the
// App-side reader (readA4Sources). Plain data in, plain data out.
export type A4Creature = {
  id: string;
  label: string; // "Gracefully Wise Eagle"
  emoji: string;
  underPressure: string; // "Under pressure: Fierce turns harsh." or ""
  gifts: { id: string; label: string; rating: number | null }[]; // rating = A2 1–5
};
export type A4Value = {
  id: string;
  name: string;
  behaviors: { id: string; name: string; keystone: boolean }[];
};
export type A4VisionLine = {
  domain: string;
  label: string;
  chip: string; // the tier chip they picked for Future B ("" if none)
  b1: string;
  b2: string;
};
export type A4Sources = {
  purpose: string;
  creatures: A4Creature[];
  values: A4Value[];
  critics: string[]; // A3 Thoughts marked Critic, in the order they were listed
  envWeights: { name: string; kind: "habit" | "place" }[]; // A3 Environment rated Weight
  purposeRating: number | null; // A2 1–10
  vision: Record<Lens, A4VisionLine[]>;
};

export const A2_GIFT_RATING_WORDS = [
  "Shadow",
  "Slipping",
  "Holding",
  "Growing",
  "In your power",
] as const;

// A gift rated this low (or lower) in A2 counts as Slipping.
export const A4_SLIPPING_MAX = 2;
// The most gap cards the screen shows at once (2×2).
export const A4_MAX_GAPS = 4;

// Their Vision, domain by domain, for one lens. Only domains the member has
// actually written something for are returned.
export function a4VisionLines(
  vision: any,
): Record<Lens, A4VisionLine[]> {
  const out: Record<Lens, A4VisionLine[]> = { time: [], wealth: [], self: [] };
  if (!vision || typeof vision !== "object") return out;
  const futureB =
    vision.twoFutures && typeof vision.twoFutures === "object"
      ? vision.twoFutures.futureB
      : null;
  for (const lens of ["self", "time", "wealth"] as Lens[]) {
    const blanks = vision[lens] && typeof vision[lens] === "object" ? vision[lens] : {};
    const tiers =
      futureB && typeof futureB === "object" && futureB[lens] ? futureB[lens] : {};
    for (const d of LENS_DOMAINS[lens]) {
      const tier = tiers[d];
      const chip =
        tier === 1 || tier === 2 || tier === 3 || tier === 4
          ? VISION_CHIPS[lens][d][tier as 1 | 2 | 3 | 4]
          : "";
      const b1 = str(blanks[d]?.blank1).trim();
      const b2 = str(blanks[d]?.blank2).trim();
      if (chip === "" && b1 === "" && b2 === "") continue;
      out[lens].push({
        domain: d,
        label: DOMAIN_LABELS[lens][d],
        chip,
        b1,
        b2,
      });
    }
  }
  return out;
}

// Chips are written as standalone phrases ("Mostly kind to myself"); after
// "In 10 years," they read as a clause, so lower the first letter — except
// "I" / "I'm" / "I've", which stay capital.
const lowerFirst = (s: string): string =>
  /^I(?![a-z])/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);

const endStop = (s: string): string => (/[.!?…]$/.test(s) ? s : s + ".");

// One readable 10-year sentence for a vision line:
//   "In 10 years, {chip}. {stem1} {b1}, {stem2} {b2}."
// Partial fills degrade gracefully; "" when there is nothing to say.
export function a4VisionSentence(lens: Lens, line: A4VisionLine): string {
  const tmpl = SENTENCE_TEMPLATES[lens][line.domain];
  const parts: string[] = [];
  if (line.chip) parts.push(`In 10 years, ${lowerFirst(line.chip)}.`);
  if (tmpl && line.b1) {
    const tail = line.b2 ? `, ${tmpl.stem2} ${line.b2}` : "";
    parts.push(endStop(`${tmpl.stem1} ${line.b1}${tail}`));
  } else if (tmpl && line.b2) {
    parts.push(endStop(`${tmpl.stem2} ${line.b2}`));
  }
  return parts.join(" ").trim();
}

// The single 10-year line shown in the "your why" strip for a mirror: the first
// domain of that lens with something written (blanks preferred over chip-only).
export function a4TenYearLine(
  vision: Record<Lens, A4VisionLine[]>,
  lens: Lens,
): string {
  const lines = vision[lens] || [];
  const withBlanks = lines.find((l) => l.b1 !== "" || l.b2 !== "");
  const pick = withBlanks || lines[0];
  return pick ? a4VisionSentence(lens, pick) : "";
}

// Build the Self gap cards from the member's own answers. A source that is
// missing is dropped — never an empty or placeholder card. Order is round-robin
// across the four sources so the four cards are four different kinds of gap.
export function buildSelfGaps(src: A4Sources): A4Gap[] {
  const keystones: { value: string; behavior: string; id: string }[] = [];
  for (const v of src.values) {
    for (const b of v.behaviors) {
      if (b.keystone && b.name.trim() !== "") {
        keystones.push({ value: v.name, behavior: b.name.trim(), id: b.id });
      }
    }
  }
  // 1 · a keystone behavior vs. an A3 Thoughts inner-voice line (Critic).
  const voice: A4Gap[] = [];
  const critics = src.critics.map((c) => c.trim()).filter((c) => c !== "");
  for (let i = 0; i < Math.min(keystones.length, critics.length); i++) {
    voice.push({
      id: `voice:${keystones[i].id}:${i}`,
      kind: "behavior",
      tag: keystones[i].value,
      said: keystones[i].behavior,
      evidence: `“${critics[i]}”`,
      source: "Inner voice · A3 Thoughts",
    });
  }
  // 2 · a gift rated Slipping (or lower) in A2.
  const slipping: A4Gap[] = [];
  for (const c of src.creatures) {
    for (const g of c.gifts) {
      if (g.rating != null && g.rating <= A4_SLIPPING_MAX && g.label.trim() !== "") {
        slipping.push({
          id: `gift:${g.id}`,
          kind: "gift",
          tag: c.label,
          said: g.label.trim(),
          evidence: `You rated it ${A2_GIFT_RATING_WORDS[Math.max(0, g.rating - 1)]} in Align With It.`,
          source: "Gift check · A2 Alignment",
        });
      }
    }
  }
  // 3 · a keystone behavior vs. an A3 Environment item rated Weight.
  const env: A4Gap[] = [];
  const weights = src.envWeights.filter((w) => w.name.trim() !== "");
  // Offset past the behaviors already used by the inner-voice cards so the two
  // behavior cards read as two different behaviors when there are enough.
  const offset = Math.min(voice.length, Math.max(0, keystones.length - 1));
  for (let i = 0; i < weights.length && keystones.length > 0; i++) {
    const k = keystones[(offset + i) % keystones.length];
    env.push({
      id: `env:${k.id}:${i}`,
      kind: "behavior",
      tag: k.value,
      said: k.behavior,
      evidence: `${weights[i].name.trim()} — a ${weights[i].kind} you rated Weight.`,
      source: "Environment · A3",
    });
  }
  // 4 · Purpose vs. how fully they said they live it (A2 purpose rating).
  const purpose: A4Gap[] = [];
  if (
    src.purpose.trim() !== "" &&
    src.purposeRating != null &&
    src.purposeRating < 9
  ) {
    purpose.push({
      id: "purpose",
      kind: "purpose",
      tag: "",
      said: src.purpose.trim(),
      evidence: `You rated how fully you live it ${src.purposeRating} of 10.`,
      source: "Purpose · A2 Alignment",
    });
  }
  const pools = [voice, slipping, env, purpose];
  const out: A4Gap[] = [];
  for (let round = 0; out.length < A4_MAX_GAPS; round++) {
    let added = false;
    for (const p of pools) {
      if (round < p.length && out.length < A4_MAX_GAPS) {
        out.push(p[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

// A claimed-promise check shared by the claim button and the hub: every field
// the promise needs, filled in, plus a "Yes, I'm sure".
export function a4PromiseReady(
  m: A4MirrorState,
  opts: { needSayNo?: boolean } = {},
): boolean {
  const filled = (s: string) => s.trim() !== "";
  const hasGap = m.picked != null && (m.gap != null || m.own != null);
  return (
    hasGap &&
    filled(m.every) &&
    filled(m.prove) &&
    filled(m.will) &&
    filled(m.when) &&
    (!opts.needSayNo || filled(m.sayNo ?? "")) &&
    filled(m.year) &&
    filled(m.gives) &&
    filled(m.stop) &&
    filled(m.plan) &&
    m.sure === "yes"
  );
}

// Per-screen gate for the Continue button (0-based screen index).
export function a4ScreenReady(
  m: A4MirrorState,
  screen: number,
  opts: { needSayNo?: boolean } = {},
): boolean {
  const filled = (s: string) => s.trim() !== "";
  switch (screen) {
    case 0:
      return true;
    case 1:
      return m.picked != null && (m.gap != null || m.own != null);
    case 2:
      return filled(m.every) && filled(m.prove);
    case 3:
      return (
        filled(m.will) && filled(m.when) && (!opts.needSayNo || filled(m.sayNo ?? ""))
      );
    case 4:
      return filled(m.year) && filled(m.gives);
    default:
      return a4PromiseReady(m, opts);
  }
}
