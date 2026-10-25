import { useLayoutEffect } from "react";
import { isDevPreview, setDevPreview } from "./devPreview";

/** DEV inspection guard, including portal-mounted room controls. */
export function DevPreviewBanner() {
  useLayoutEffect(() => {
    if (!import.meta.env.DEV || !isDevPreview()) return;
    const isClaim = (button: HTMLButtonElement) =>
      /^(?:re[\s-]?)?claim\b|^seal\b/i.test(button.textContent?.trim() || "")
      && !button.closest(".na1-mirror-card-action");
    const protect = () => {
      document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
        if (isClaim(button)) {
          if (!button.disabled) button.disabled = true;
          button.setAttribute("aria-description", "Claim is off in preview");
          if (!button.nextElementSibling?.hasAttribute("data-preview-claim-note")) {
            const note = document.createElement("small");
            note.dataset.previewClaimNote = "true";
            note.textContent = "Claim is off in preview";
            button.after(note);
          }
        }
        if (button.closest(".na1-mirror-card-action") && !button.disabled) {
          button.dataset.previewOpen = "true";
          button.setAttribute("aria-label", "Open (preview) →");
        }
      });
    };
    const block = (event: Event) => {
      const button = (event.target as Element)?.closest<HTMLButtonElement>("button");
      if (button && isClaim(button)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    protect();
    const observer = new MutationObserver(protect);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    document.addEventListener("click", block, true);
    return () => { observer.disconnect(); document.removeEventListener("click", block, true); };
  }, []);
  if (!import.meta.env.DEV || !isDevPreview()) return null;
  return <>
    <style>{`
      body { padding-top: 48px !important; }
      .na1-room-overlay { top: 48px !important; }
      .na1-ex-row.is-locked { pointer-events: auto !important; }
      button[data-preview-open] { font-size:0 !important; }
      button[data-preview-open]::after { content:"Open (preview) →"; font-size:16px; }
      [data-preview-claim-note] { display:block; font-size:13px; padding:4px; }
    `}</style>
    <div role="status" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2147483647, minHeight: 40, padding: "4px 12px", background: "#E8F1F2", color: "#682D3B", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span>PREVIEW · dev only · nothing you do here is saved</span>
      <button type="button" onClick={() => setDevPreview(false)}>Exit preview</button>
    </div>
  </>;
}
