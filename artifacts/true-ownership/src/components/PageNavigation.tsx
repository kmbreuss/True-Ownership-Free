import { useEffect, useState } from "react";
import { Home, Route, Sparkles, Headphones, Diamond } from "lucide-react";
import "./page-navigation.css";

const tabs = [
  { id: "home", label: "Home", icon: Home, destination: "entry-hall" },
  { id: "road", label: "Road", icon: Route, destination: null },
  { id: "decide", label: "Decide", icon: Diamond, destination: "decide" },
  { id: "map", label: "Map of Me", icon: Sparkles, destination: "a1map" },
  { id: "audio", label: "Audio", icon: Headphones, destination: "audio" },
] as const;

export const menuViews = new Set(["entry-hall", "grid", "a2", "a3", "a4", "a5", "a1map", "audio", "decide"]);

/** Observe semantic modal presentation only; this never reads or writes progress. */
export function useFullScreenOverlay() {
  const [present, setPresent] = useState(false);
  useEffect(() => {
    const refresh = () => setPresent(Array.from(document.querySelectorAll<HTMLElement>(
      '[role="dialog"][aria-modal="true"],.na1-veil,.na1-video-overlay',
    )).some(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden"
      && el.getAttribute("aria-hidden") !== "true"));
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ["class", "style", "aria-hidden", "aria-modal", "open"] });
    return () => observer.disconnect();
  }, []);
  return present;
}

export function PhoneMenu({ view, visible, canMap, onNavigate, onRoad }: {
  view: string; visible: boolean; canMap: boolean;
  onNavigate: (destination: string) => void; onRoad: () => void;
}) {
  useEffect(() => {
    document.body.classList.toggle("phone-menu-on", visible);
    return () => document.body.classList.remove("phone-menu-on");
  }, [visible]);
  if (!visible) return null;
  const active = view === "entry-hall" ? "home" : view === "a1map" ? "map" : view === "audio" ? "audio" : view === "decide" ? "decide" : "road";
  return <nav className="pn-menu" aria-label="Main navigation">
    {tabs.map(tab => {
      const Icon = tab.icon, restricted = tab.id === "map" && !canMap;
      return <button type="button" key={tab.id} className={`${active === tab.id ? "is-active" : ""} ${tab.id==="decide" ? "pn-decide" : ""}`}
        aria-current={active === tab.id ? "page" : undefined} disabled={restricted}
        title={restricted ? "Unlocks when you join" : undefined}
        aria-label={restricted ? `${tab.label} · Unlocks when you join` : tab.label}
        onClick={() => tab.destination ? onNavigate(tab.destination) : onRoad()}>
        <Icon size={19} strokeWidth={1.4} aria-hidden="true" /><span>{tab.label}</span>
      </button>;
    })}
  </nav>;
}

export function DesktopPageLinks({ view, canMap, onNavigate }: {
  view: string; canMap: boolean; onNavigate: (destination: string) => void;
}) {
  return <nav className="pn-desktop-links" aria-label="More pages">
    <button type="button" aria-current={view==="decide" ? "page" : undefined} onClick={()=>onNavigate("decide")}>Own the decision</button>
    <button type="button" disabled={!canMap} title={!canMap ? "Unlocks when you join" : undefined}
      aria-current={view === "a1map" ? "page" : undefined} onClick={() => onNavigate("a1map")}>Map of Me</button>
    <button type="button" aria-current={view === "audio" ? "page" : undefined}
      onClick={() => onNavigate("audio")}>Audio</button>
  </nav>;
}
