// Global copyright footer. Rendered once per top-level screen.
// - Year auto-updates via JS so we never have to bump it on Jan 1.
// - Sits at content bottom; combined with the flex-column wrappers in
//   <SignInScreen> and <ServerDataLoader>, this gives the sticky-footer
//   behaviour requested in the polish pass (viewport bottom on short
//   pages, content bottom on long-scroll pages).
// - Mobile: text wraps naturally; iOS safe-area inset is respected.
// - Excluded from modals structurally — modals overlay at higher z-index.
// - KB brand: label font is Questrial (KB Brand Guide). `tone="onDark"` is used
//   by the sign-in screen, whose Spruce→Deepwater glow is always dark.
export function Footer({ tone }: { tone?: "onDark" } = {}) {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        width: "100%",
        flexShrink: 0,
        padding: "16px 16px calc(20px + env(safe-area-inset-bottom, 0px))",
        textAlign: "center",
        fontFamily: "'Questrial', system-ui, sans-serif",
        fontSize: 12,
        color: tone === "onDark" ? "rgba(245,245,247,0.62)" : "var(--na1-text-mute, #696869)",
        letterSpacing: "0.04em",
        lineHeight: 1.5,
      }}
    >
      <span style={{ display: "inline-block", maxWidth: "100%" }}>
        True Ownership™ · © {year} Katherine Breuss · All rights reserved
      </span>
    </footer>
  );
}
