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
export function InlineAnswer({ value, onChange, label, placeholder = "…", required = false, lowerStart = false }: {
  value: string; onChange: (value: string) => void; label: string; placeholder?: string; required?: boolean; lowerStart?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!lowerStart) { if (el.textContent !== value) el.textContent = value; return; }
    // CSS changes only the first letter's appearance. DOM text and onInput keep
    // the original case, even when an owner edits elsewhere in the sentence.
    const selection = window.getSelection();
    const offset = (node: Node | null, n: number) => {
      if (!node || !el.contains(node)) return null;
      const range = document.createRange();
      range.selectNodeContents(el); range.setEnd(node, n);
      return range.toString().length;
    };
    const anchor = offset(selection?.anchorNode ?? null, selection?.anchorOffset ?? 0);
    const focus = offset(selection?.focusNode ?? null, selection?.focusOffset ?? 0);
    const index = value.search(/\p{L}/u);
    if (index < 0) el.textContent = value;
    else {
      const letter = String.fromCodePoint(value.codePointAt(index)!);
      const first = document.createElement("span");
      first.dataset.lowerStart = ""; first.textContent = letter;
      el.replaceChildren(document.createTextNode(value.slice(0, index)), first,
        document.createTextNode(value.slice(index + letter.length)));
    }
    if (anchor !== null && focus !== null && selection) {
      const locate = (n: number): [Node, number] => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node: Node | null, last: Node = el;
        while ((node = walker.nextNode())) {
          last = node;
          const length = node.textContent?.length ?? 0;
          if (n <= length) return [node, n];
          n -= length;
        }
        return [last, last === el ? 0 : last.textContent?.length ?? 0];
      };
      const a = locate(anchor), f = locate(focus);
      selection.setBaseAndExtent(a[0], a[1], f[0], f[1]);
    }
  }, [value, lowerStart]);
  return <span ref={ref} className="rc-inline-answer" contentEditable="plaintext-only"
    role="textbox" tabIndex={0} aria-label={label} aria-multiline="true" aria-required={required || undefined}
    data-placeholder={placeholder} suppressContentEditableWarning
    onInput={e => onChange(e.currentTarget.textContent ?? "")} />;
}
