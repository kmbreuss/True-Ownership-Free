import React, { useLayoutEffect, useRef } from "react";

/** Keep the saved answer intact; only its visible editing height is capped. */
export function PriceWhereField({ value, placeholder, onChange }: {
  value: string; placeholder: string; onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let active = true, width = -1, frame = 0;
    const resize = () => {
      if (!active) return;
      const css = getComputedStyle(el);
      const line = parseFloat(css.lineHeight);
      const padding = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
      const border = parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
      el.style.setProperty("--rc-where-height", "0px");
      // scrollHeight is integer-rounded; keep the actual line-height fractional
      // so two complete line boxes fit without rounding the content area down.
      const lines = el.scrollHeight > Math.round(line + padding) ? 2 : 1;
      const height = lines * line + padding + border;
      el.style.setProperty("--rc-where-height", `${height}px`);
    };
    const scheduleResize = () => {
      if (!active) return;
      cancelAnimationFrame(frame);
      // Never force textarea/grid layout inside ResizeObserver delivery.
      frame = requestAnimationFrame(() => { frame = 0; resize(); });
    };
    resize();
    const observer = new ResizeObserver(entries => {
      const nextWidth = entries[0].contentRect.width;
      if (nextWidth !== width) { width = nextWidth; scheduleResize(); }
    });
    // Observe the container: our own height/scrollbar changes must not retrigger resizing.
    observer.observe(el.parentElement ?? el);
    void document.fonts.ready.then(scheduleResize);
    document.fonts.addEventListener("loadingdone", scheduleResize);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", scheduleResize);
    };
  }, [value]);
  return <textarea ref={ref} className="rc-where-answer" rows={1}
    placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />;
}
