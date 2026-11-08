import { useEffect, useState } from "react";
import { isDevPreview, previewWrite } from "../devPreview";
import { EMPTY_PRACTICAL, loadPractical, normalizePractical, PRACTICAL_KEY, savePractical, type Practical } from "./practical";

export function usePractical() {
  const read = () => {
    try { return { value: loadPractical(), error: "" }; }
    catch (e) { return { value: EMPTY_PRACTICAL, error: e instanceof Error ? e.message : "Your practical A1 answers could not be read." }; }
  };
  const [state, setState] = useState(read);
  useEffect(() => {
    const refresh = () => setState(read());
    const storage = (e: StorageEvent) => { if (!e.key || e.key === PRACTICAL_KEY) refresh(); };
    window.addEventListener("a1-practical-change", refresh);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener("a1-practical-change", refresh); window.removeEventListener("storage", storage); };
  }, []);
  const update = (patch: Partial<Practical> | ((current: Practical) => Partial<Practical>)): boolean => {
    if (state.error) return false;
    try {
      // Merge at the actual edit, not from an earlier component's stale snapshot.
      const current = isDevPreview() ? state.value : loadPractical(), changes = typeof patch === "function" ? patch(current) : patch;
      const next = normalizePractical({ ...current, ...changes });
      if (isDevPreview()) previewWrite(PRACTICAL_KEY, JSON.stringify(next));
      else savePractical(changes);
      setState({ value: next, error: "" });
      return true;
    } catch (e) {
      setState(previous => ({ ...previous, error: e instanceof Error ? e.message : "Your answer could not be saved. Please try again." }));
      return false;
    }
  };
  return { practical: state.value, error: state.error, update };
}
