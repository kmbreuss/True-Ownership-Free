import React, { useLayoutEffect, useRef, useState } from "react";

/** Presentation formatting never rewrites an untouched saved numeric answer. */
export function LedgerNumber({ value, money, onChange }: {
  value: number | null; money?: boolean; onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const formatted = value === null ? "" : new Intl.NumberFormat("en-US", {
    maximumFractionDigits: money ? 0 : 20,
  }).format(value);
  return <div className="rc-ledger-amount">
    {money && <span className="rc-currency">$</span>}
    <input type="text" inputMode={money ? "numeric" : "decimal"}
      aria-label={money ? "About dollars a month" : "About hours a week"}
      placeholder="0" value={draft ?? formatted}
      style={{ width: `${Math.max(2, (draft ?? formatted).length)}ch` }}
      onFocus={() => setDraft(formatted)}
      onBlur={() => setDraft(null)}
      onChange={e => {
        const text = e.target.value.replace(/,/g, "");
        if (!/^\d*\.?\d*$/.test(text)) return;
        const n = text && text !== "." ? Number(text) : null;
        if (n !== null && !Number.isFinite(n)) return;
        // Keep the displayed text/caret stable while editing; format on blur.
        setDraft(e.target.value);
        onChange(n === null ? null : money ? Math.round(n) : n);
      }} />
    <span className="rc-ledger-unit">{money ? "a month" : "hours a week"}</span>
  </div>;
}

/** A real inline editing surface wraps across sentence fragments, unlike input. */
export function InlineAnswer({ value, onChange, label, placeholder = "…", required = false }: {
  value: string; onChange: (value: string) => void; label: string; placeholder?: string; required?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.textContent !== value) el.textContent = value;
  }, [value]);
  return <span ref={ref} className="rc-inline-answer" contentEditable="plaintext-only"
    role="textbox" tabIndex={0} aria-label={label} aria-multiline="true" aria-required={required || undefined}
    data-placeholder={placeholder} suppressContentEditableWarning
    onInput={e => onChange(e.currentTarget.textContent ?? "")} />;
}
