// Leaf module: no state/sync imports. Explicit DEV branches are folded away by Vite.
let transitioning = false;
export function isDevPreview(): boolean {
  if (!import.meta.env.DEV) return false;
  if (transitioning) return true;
  try {
    return sessionStorage.getItem("to_dev_preview") === "1"
      || new URLSearchParams(location.search).get("preview") === "1";
  } catch { return false; }
}

// An ephemeral read-through workspace, never a browser-storage replacement.
// Some rooms save then read on the next mount; they still need those edits
// during a walkthrough. A full reload discards this map.
const scratch = new Map<string, string>();
export function previewRead(key: string): string | undefined {
  if (import.meta.env.DEV && isDevPreview()) return scratch.get(key);
  return undefined;
}
export function previewWrite(key: string, value: string): boolean {
  if (import.meta.env.DEV && isDevPreview()) {
    scratch.set(key, value);
    return true;
  }
  return false;
}

export function setDevPreview(enabled: boolean): void {
  if (!import.meta.env.DEV) return;
  transitioning = true;
  const url = new URL(location.href);
  url.searchParams.delete("preview");
  try {
    if (enabled) sessionStorage.setItem("to_dev_preview", "1");
    else sessionStorage.removeItem("to_dev_preview");
  } catch {
    if (enabled) url.searchParams.set("preview", "1");
  }
  // Reload on BOTH transitions: cancel old room effects/timers, discard React
  // state and scratch edits, and reconstruct real progress from normal storage.
  location.replace(url.href);
}

if (import.meta.env.DEV) {
  try {
    if (new URLSearchParams(location.search).get("preview") === "1") {
      sessionStorage.setItem("to_dev_preview", "1");
    }
  } catch { /* Query activation still works when storage is unavailable. */ }
}
