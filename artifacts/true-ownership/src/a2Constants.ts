// ─────────────────────────────────────────────────────────────────────────────
// A2 · Align With It · State module (A2.0 · hub scaffold)
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors mirror4Constants.ts' structural pattern (dedicated localStorage
// key + EMPTY_* + load/save/has helpers) for the A2 program. A2.0 only
// initializes an empty schema stub — one empty object per mirror. The
// per-mirror internals (M1 Alignment Check, M2 Time Audit, M3 Focus +
// Commit, M4 Integrity Claim) land in A2.1+ and will replace each
// A2MirrorStub with its real shape.
// ─────────────────────────────────────────────────────────────────────────────

export const A2_STORAGE_KEY = "to_a2_state_v1";

// Placeholder per-mirror state. Empty until A2.1+ fills each mirror in.
export type A2MirrorStub = Record<string, never>;

// A2.2 · Mirror 1 (Alignment Check) flow progress. The Alignment Check runs
// as one continuous paced room with four steps (1 Read your A1 · 2 Rate
// alignment · 3 Key Misalignment · 4 Claim). We persist only the step
// progress here (Step 1 is read-only). `veilSeen` makes the launch veil fire
// once — the first time the user ever enters the room — so a resume or a
// close+reopen drops them straight into their step with no ceremony replay.
export type A2M1State = {
  currentStep: number; // 1–4, the step currently shown
  maxReached: number; // 1–4, highest step ever reached (drives stepper checks)
  veilSeen: boolean; // true once the launch veil has played
  // A2.3 · Step 2 (Rate alignment). Per-item alignment ratings keyed by gift
  // id (creatures) and behavior id (values), each a 5-point score 1–5. An id
  // ABSENT from this map is "unrated" and renders at a neutral middle without a
  // position label; presence is what marks an item rated (Step 2 Complete = all
  // shown gifts + behaviors present here).
  ratings: Record<string, number>;
  // A2.4 · Step 2 (Rate alignment) · Purpose reading. The first sub-screen of
  // Step 2 is a single 1–10 self-rating of how fully the user lives their
  // purpose ("Far from it" → "Fully embodied"). ABSENT/undefined = unrated
  // (renders neutral, no score label); presence (1–10) marks it rated. Step 2
  // Complete = purpose rated (when a purpose statement exists) AND every gift
  // AND every behavior rated.
  purposeRating?: number;
  // A2.3 · Saved Step 2 sub-screen index (0-based: Purpose, then one per
  // creature, then one per value) so a refresh resumes the exact screen.
  // Clamped to the live sub-screen count at the render site.
  step2Index: number;
  // A2.4 · Step 3 (Key Misalignment) selections. `bottleneck` is the id of the
  // chosen single bottleneck candidate ("purpose" | gift id | behavior id);
  // null means "use the live lowest-ranked default". `keepInFocus` is the id of
  // the single pinned watch-item (☆), or null. Both carry forward to A3.
  bottleneck: string | null;
  keepInFocus: string | null;
  // A2.5 · Step 4 (Claim). `claimed` is the single source of truth for Mirror 1
  // completion (the §7 rule — the A2 hub's Alignment Check card flips to
  // COMPLETE off this boolean, not a separate flag). `claimedAt` is the ISO
  // timestamp of the first claim, set once and preserved across re-entry.
  claimed: boolean;
  claimedAt?: string;
};

export const EMPTY_A2_M1: A2M1State = {
  currentStep: 1,
  maxReached: 1,
  veilSeen: false,
  ratings: {},
  step2Index: 0,
  bottleneck: null,
  keepInFocus: null,
  claimed: false,
};

// A2 Ship 1 · Mirror 2 (Time Audit). Runs as one continuous paced room with three
// working steps (1 Your priorities · 2 Where time goes · 3 What's missing) plus a
// Claim step. Everything persists here under to_a2_state_v1.m2; `claimed` is the
// SOLE driver of Mirror 2 hub completion.
export type A2M2Feeling = "love" | "like" | "dislike" | "despise";

export type A2M2Activity = {
  id: string;
  name: string;
  hrsPerWeek: number; // 0–80
  feeling: A2M2Feeling;
  priorityServed: string; // a priority name, or "" for none
};

export type A2M2MissingItem = {
  id: string;
  name: string;
  priorityTag: string; // a priority name, or "" for none
};

export type A2M2State = {
  // Step 1 · ordered priority names, most important first (UI caps at 5).
  priorities: string[];
  // Step 2 · activities logged for the week.
  activities: A2M2Activity[];
  // Step 3 · things being crowded out.
  missingItems: A2M2MissingItem[];
  // Claim · single source of truth for Mirror 2 completion.
  claimed: boolean;
  claimedAt: string | null;
};

export const EMPTY_A2_M2: A2M2State = {
  priorities: [],
  activities: [],
  missingItems: [],
  claimed: false,
  claimedAt: null,
};

export type A2State = {
  m1: A2M1State;
  m2: A2M2State;
  m3: A2MirrorStub;
  m4: A2MirrorStub;
};

export const EMPTY_A2: A2State = {
  m1: { ...EMPTY_A2_M1 },
  m2: { ...EMPTY_A2_M2 },
  m3: {},
  m4: {},
};

// Coerce an unknown blob into a valid A2M1State, defaulting missing/invalid
// fields and clamping steps into 1–4 so older `{}` stubs upgrade cleanly.
function normalizeA2M1(raw: unknown): A2M1State {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<A2M1State>;
  const clamp = (n: unknown, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(1, Math.min(4, Math.round(n)))
      : fallback;
  const currentStep = clamp(r.currentStep, 1);
  const maxReached = Math.max(currentStep, clamp(r.maxReached, currentStep));
  // Coerce ratings to a clean { id: 1–5 } map; drop any non-numeric/garbage
  // entries so a corrupt blob can't poison Step 2's completion math.
  const ratings: Record<string, number> = {};
  const rawRatings = (r as { ratings?: unknown }).ratings;
  if (rawRatings && typeof rawRatings === "object") {
    for (const [k, v] of Object.entries(rawRatings as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        ratings[k] = Math.max(1, Math.min(5, Math.round(v)));
      }
    }
  }
  const rawIdx = (r as { step2Index?: unknown }).step2Index;
  const step2Index =
    typeof rawIdx === "number" && Number.isFinite(rawIdx)
      ? Math.max(0, Math.round(rawIdx))
      : 0;
  // Purpose rating: a clean 1–10 int when present, else undefined (= unrated).
  const rawPurpose = (r as { purposeRating?: unknown }).purposeRating;
  const purposeRating =
    typeof rawPurpose === "number" && Number.isFinite(rawPurpose)
      ? Math.max(1, Math.min(10, Math.round(rawPurpose)))
      : undefined;
  // Step 3 selections: a non-empty string id, else null.
  const cleanId = (v: unknown): string | null =>
    typeof v === "string" && v.trim() !== "" ? v : null;
  const bottleneck = cleanId((r as { bottleneck?: unknown }).bottleneck);
  const keepInFocus = cleanId((r as { keepInFocus?: unknown }).keepInFocus);
  // Claim: a strict boolean, plus a clean ISO string timestamp when present.
  const claimed = (r as { claimed?: unknown }).claimed === true;
  const rawClaimedAt = (r as { claimedAt?: unknown }).claimedAt;
  const claimedAt =
    typeof rawClaimedAt === "string" && rawClaimedAt.trim() !== ""
      ? rawClaimedAt
      : undefined;
  return {
    currentStep,
    maxReached,
    veilSeen: r.veilSeen === true,
    ratings,
    purposeRating,
    step2Index,
    bottleneck,
    keepInFocus,
    claimed,
    claimedAt,
  };
}

const A2M2_FEELINGS: readonly A2M2Feeling[] = [
  "love",
  "like",
  "dislike",
  "despise",
];

// Coerce an unknown blob into a valid A2M2State, dropping garbage so a corrupt
// store can't poison the Time Audit. Ids are preserved when present and
// synthesized from index otherwise so list keys stay stable.
function normalizeA2M2(raw: unknown): A2M2State {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<A2M2State>;
  const cleanStr = (v: unknown): string => (typeof v === "string" ? v : "");
  const rawPri = (r as { priorities?: unknown }).priorities;
  const priorities = Array.isArray(rawPri)
    ? rawPri
        .filter((p): p is string => typeof p === "string" && p.trim() !== "")
        .map((p) => p.trim())
    : [];
  const rawActs = (r as { activities?: unknown }).activities;
  const activities: A2M2Activity[] = Array.isArray(rawActs)
    ? rawActs
        .filter(
          (a): a is Record<string, unknown> => !!a && typeof a === "object",
        )
        .map((a, i) => {
          const hrs = a.hrsPerWeek;
          const feeling = a.feeling;
          return {
            id:
              typeof a.id === "string" && a.id.trim() !== "" ? a.id : `m2a_${i}`,
            name: cleanStr(a.name),
            hrsPerWeek:
              typeof hrs === "number" && Number.isFinite(hrs)
                ? Math.max(0, Math.min(80, hrs))
                : 0,
            feeling: A2M2_FEELINGS.includes(feeling as A2M2Feeling)
              ? (feeling as A2M2Feeling)
              : "like",
            priorityServed: cleanStr(a.priorityServed),
          };
        })
    : [];
  const rawMissing = (r as { missingItems?: unknown }).missingItems;
  const missingItems: A2M2MissingItem[] = Array.isArray(rawMissing)
    ? rawMissing
        .filter(
          (m): m is Record<string, unknown> => !!m && typeof m === "object",
        )
        .map((m, i) => ({
          id: typeof m.id === "string" && m.id.trim() !== "" ? m.id : `m2m_${i}`,
          name: cleanStr(m.name),
          priorityTag: cleanStr(m.priorityTag),
        }))
    : [];
  const claimed = (r as { claimed?: unknown }).claimed === true;
  const rawClaimedAt = (r as { claimedAt?: unknown }).claimedAt;
  const claimedAt =
    typeof rawClaimedAt === "string" && rawClaimedAt.trim() !== ""
      ? rawClaimedAt
      : null;
  return { priorities, activities, missingItems, claimed, claimedAt };
}

export function loadA2State(): A2State {
  try {
    if (typeof window === "undefined") return EMPTY_A2;
    const raw = window.localStorage.getItem(A2_STORAGE_KEY);
    if (!raw) return EMPTY_A2;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // Shallow-merge over EMPTY_A2 so future schema additions get
      // sensible defaults on older stored blobs, then normalize m1 so a
      // legacy empty-object stub upgrades to the real step shape.
      const merged = { ...EMPTY_A2, ...parsed } as A2State;
      merged.m1 = normalizeA2M1((parsed as { m1?: unknown }).m1);
      merged.m2 = normalizeA2M2((parsed as { m2?: unknown }).m2);
      return merged;
    }
  } catch {}
  return EMPTY_A2;
}

export function saveA2State(state: A2State): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(A2_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// True when the A2 schema has ever been written. Used by the hub to seed
// EMPTY_A2 on first-ever mount.
export function hasA2State(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(A2_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
