// Leaf module (imports nothing) so the state modules can announce a local write
// without importing the sync engine — avoids an import cycle with
// newFlowSync.ts, which imports those modules' EMPTY_* constants.
type Handler = (localKey: string) => void;
let handler: Handler | null = null;
export function setChangeHandler(h: Handler | null): void {
  handler = h;
}
export function notifyLocalChange(localKey: string): void {
  try {
    handler?.(localKey);
  } catch {}
}
