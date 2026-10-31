import { useLayoutEffect, useRef } from "react";

/** Measure the real twelve-card presentation, independently of the active set. */
export function useMirrorLayout(active: boolean, onPaged: (paged: boolean) => void) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scene = ref.current;
    const body = scene?.closest<HTMLElement>(".rc-body");
    if (!active || !scene || !body) return;
    let live = true, frame = 0;
    const measure = () => {
      if (!live) return;
      const probe = scene.cloneNode(true) as HTMLElement;
      probe.classList.remove("is-paged");
      probe.setAttribute("aria-hidden", "true");
      probe.inert = true;
      probe.querySelector(".rc-mirror-pages")?.remove();
      probe.querySelectorAll<HTMLElement>("[hidden]").forEach(el => el.hidden = false);
      probe.style.cssText = `position:fixed;left:-10000px;top:0;width:${scene.getBoundingClientRect().width}px;visibility:hidden;pointer-events:none`;
      scene.parentElement!.append(probe);
      try {
        const css = getComputedStyle(body);
        const siblings = Array.from(body.children).filter(el => !el.contains(scene));
        const reserved = siblings.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0)
          + siblings.length * (parseFloat(css.rowGap) || 0);
        const height = body.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - reserved;
        const quote = probe.querySelector<HTMLElement>(".rc-quote")!;
        const readableWidth = parseFloat(getComputedStyle(quote).fontSize) * 9;
        const tooNarrow = quote.getBoundingClientRect().width < readableWidth;
        onPaged(tooNarrow || probe.getBoundingClientRect().height > height + 1);
      } finally { probe.remove(); }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(body);
    observer.observe(scene);
    Array.from(body.children).filter(el => !el.contains(scene)).forEach(el => observer.observe(el));
    void document.fonts.ready.then(() => { if (live) schedule(); });
    document.fonts.addEventListener("loadingdone", schedule);
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", schedule);
    };
  }, [active, onPaged]);
  return ref;
}
