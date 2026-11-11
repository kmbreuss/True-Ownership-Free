import { useLayoutEffect, useRef } from "react";

// A line that grows with what is written, so nothing is clipped.
export function Grow({ label, placeholder, value, onChange, className = "fc-grow" }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, [value]);
  return <textarea ref={ref} rows={1} className={className} aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value.replace(/\n/g, " "))} />;
}
