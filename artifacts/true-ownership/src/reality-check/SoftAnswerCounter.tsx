import React from "react";

/** A suggestion, not a maxlength: older answers and ongoing edits stay intact. */
export function SoftAnswerCounter({ value }: { value: string }) {
  const count = Array.from(value).length;
  if (count < 100) return null;
  return <small className="rc-answer-counter" role="status" aria-live="polite"
    data-over-limit={count > 120 || undefined}
    title="Suggested length: 120 characters. Longer answers are kept in full.">
    {count}/120
  </small>;
}
