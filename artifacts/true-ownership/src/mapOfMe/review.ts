let reviewDepth = 0;
export function beginMapReview() { reviewDepth++; return () => { reviewDepth = Math.max(0, reviewDepth - 1); }; }
export function inMapReview() { return reviewDepth > 0; }
const protectedField = (key: string) => /(?:^|_)(?:done|complete|claimed)(?:$|_)/i.test(key)
  || /^(?:sealCompleted|sealCompletedAt|sealRevisedAt|claimedAt|claimedAtIso|completedAt|maxReached|currentStep|step|sealSeen|revisedAt)$/.test(key)
  || /_complete$/.test(key);

/** Keep completion evidence intact while original editors save intentional answer edits. */
export function preserveReviewEvidence(before: any, after: any): any {
  if (!after || typeof after !== "object" || Array.isArray(after)) return after;
  const next = { ...after };
  for (const key of Object.keys(next)) {
    if (protectedField(key)) {
      if (before && Object.prototype.hasOwnProperty.call(before, key)) next[key] = before[key];
      else delete next[key];
    } else if (next[key] && typeof next[key] === "object" && !Array.isArray(next[key])) {
      next[key] = preserveReviewEvidence(before?.[key], next[key]);
    }
  }
  for (const key of Object.keys(before || {})) if (protectedField(key)) next[key] = before[key];
  return next;
}
export function reviewSaveValue(key: string, before: any, after: any) {
  if (!inMapReview()) return after;
  if (/^a1_.*_done$/.test(key)) return before;
  if (key === "a1_to_curq") return before;
  return preserveReviewEvidence(before, after);
}
