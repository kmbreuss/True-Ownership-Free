import { useEffect } from "react";
import "./phone-readability.css";

// Presentation only: legacy rooms contain inline type sizes. Apply floors to
// rendered text, never replacing copy, resizing larger type, or touching stores.
const surfaces = ".phone-a1-room,.vx-room,.rc-room,.rc-root,.vx-opening,.phone-a1-opening,.phone-a1-hub,.phone-home,.mom-page,.mom-panel,.decision-page,.jr-phone-bar,.jr-phone-tip,.pn-menu,.a1-end-card";
const compact = /eyebrow|status|badge|counter|pip-meta|substep-meta|stage-pill|section-label|picture-heading|picture-eyebrow|progress|jr-phone|pn-menu|under-version|sentence-label/;

export function PhoneReadability() {
  useEffect(() => {
    const media = matchMedia("(max-width: 899px)");
    let frame = 0;
    let focusTimer = 0;
    function measure() {
      frame = 0;
      if (!media.matches) return;
      document.querySelectorAll<HTMLElement>("[data-phone-type-floor]").forEach(el => delete el.dataset.phoneTypeFloor);
      document.querySelectorAll<HTMLElement>(surfaces).forEach(root => {
        [root, ...root.querySelectorAll<HTMLElement>("*")].forEach(el => {
          if (el.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
              !el.getClientRects().length || el.closest('[aria-hidden="true"]')) return;
          const text = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join("").trim() || (el.matches("input,textarea") ? "input" : "");
          if (!text || /^[★☆●✓×✕▶▾›←→✎🗑+\s·]+$/u.test(text)) return;
          const context = `${el.className} ${el.parentElement?.className}`;
          const isStatus = compact.test(context) && text.length < 100 && !/jr-phone-tip|mom-swipe/.test(context);
          const floor = isStatus ? 11 : 16;
          if (parseFloat(getComputedStyle(el).fontSize) < floor) {
            el.dataset.phoneTypeFloor = String(floor);
          }
        });
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    function revealFocus() {
      clearTimeout(focusTimer);
      focusTimer = window.setTimeout(() => {
        const el = document.activeElement;
        if (media.matches && el instanceof HTMLElement &&
            el.matches("input,textarea,[contenteditable=true]") && el.closest(surfaces)) {
          el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        }
      }, 180);
    }
    const observer = new MutationObserver(schedule);
    // Include Decide and full-answer panels portalled outside #root.
    observer.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", revealFocus);
    document.addEventListener("focusin", revealFocus);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(focusTimer);
      media.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", revealFocus);
      document.removeEventListener("focusin", revealFocus);
    };
  }, []);
  return null;
}
