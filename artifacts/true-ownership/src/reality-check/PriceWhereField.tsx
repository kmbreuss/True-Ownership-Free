import React, { useLayoutEffect, useRef } from "react";

/** Keep the saved answer intact; only its visible editing height is capped. */
export function PriceWhereField({ value, placeholder, onChange }: {
  value: string; placeholder: string; onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let active = true, width = -1;
    const resize = () => {
      if (!active) return;
      const css = getComputedStyle(el);
      const line = parseFloat(css.lineHeight);
      const extra = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom)
        + parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
      el.style.setProperty("--rc-where-height", "0px");
      const height = Math.max(Math.ceil(line + extra),
        Math.min(el.scrollHeight + el.offsetHeight - el.clientHeight, Math.ceil(2 * line + extra)));
      el.style.setProperty("--rc-where-height", `${height}px`);
    };
    resize();
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0].contentRect.width;
      if (nextWidth !== width) { width = nextWidth; resize(); }
    });
    // Observe the container: our own height/scrollbar changes must not retrigger resizing.
    observer.observe(el.parentElement ?? el);
    void document.fonts.ready.then(resize);
    document.fonts.addEventListener("loadingdone", resize);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", resize);
    };
  }, [value]);
  return <textarea ref={ref} className="rc-where-answer" rows={1}
    placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />;
}
