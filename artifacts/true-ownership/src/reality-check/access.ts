import { useSyncExternalStore } from "react";
import { isDevPreview } from "../devPreview";

// No account permission changes. This simulation resets on reload/Preview exit.
let simulatedFree = false;
const listeners = new Set<() => void>();
export function simulatedAccess(): "free" | "member" {
  return import.meta.env.DEV && simulatedFree ? "free" : "member";
}
export function setSimulatedFree(free: boolean) {
  if (!import.meta.env.DEV) return;
  simulatedFree = free;
  listeners.forEach(fn => fn());
}
export function useRCAccess() {
  return useSyncExternalStore(
    fn => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    simulatedAccess, () => "member" as const,
  );
}
export function rcFreeLocked() {
  return simulatedAccess() === "free" && !isDevPreview();
}
