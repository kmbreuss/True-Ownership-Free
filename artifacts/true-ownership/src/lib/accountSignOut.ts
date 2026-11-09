import { finishNewFlowSignOut, flushNewFlowForSignOut, resumeNewFlowAfterSignOutFailure } from "../newFlowSync";
import { accountCacheReady, accountGeneration, onAccountBoundary } from "./accountIsolation";

type Save = () => Promise<Response>;
const pending = new Set<Promise<void>>();
const failed = new Map<string, Save>();
const latest = new Map<string, Save>();
let clearLegacyMemory: (() => void) | undefined;

export function registerAccountMemoryClear(clear: () => void): void {
  clearLegacyMemory = clear;
}

/** Keep the existing immediate legacy save, but retain a failed latest write for logout retry. */
export function trackAccountSave(key: string, save: Save): void {
  if (!accountCacheReady()) return;
  const stamp = accountGeneration();
  latest.set(key, save);
  const job = save().then(response => {
    if (stamp !== accountGeneration() || latest.get(key) !== save) return;
    if (response.ok) failed.delete(key);
    else failed.set(key, save);
  }).catch(() => {
    if (stamp === accountGeneration() && latest.get(key) === save) failed.set(key, save);
  });
  pending.add(job);
  void job.finally(() => pending.delete(job));
}

onAccountBoundary(() => {
  clearLegacyMemory?.();
  pending.clear();
  failed.clear();
  latest.clear();
});

export async function prepareAccountSignOut(): Promise<void> {
  try {
    await flushNewFlowForSignOut();
    while (pending.size) await Promise.all([...pending]);
    for (const [key, save] of [...failed]) trackAccountSave(key, save);
    while (pending.size) await Promise.all([...pending]);
    if (failed.size) throw new Error("Your latest answers could not be saved. Please try signing out again when you’re connected.");
  } catch (error) {
    resumeNewFlowAfterSignOutFailure();
    throw error;
  }
}

/** Preserve browser appearance and the one-time road tip; remove answers, drafts and routes. */
export function clearSignedOutAccountCache(): void {
  finishNewFlowSignOut();
  clearLegacyMemory?.();
  const isAccountKey = (key: string) => (key.startsWith("to_") && key !== "to_road_phone_tip_seen_v1")
    || key.startsWith("a1_") || ["na1_optin", "na2_optin", "na3_optin", "newM3", "newM4"].includes(key);
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of Object.keys(storage)) if (isAccountKey(key)) storage.removeItem(key);
  }
  pending.clear();
  failed.clear();
  latest.clear();
}

export { resumeNewFlowAfterSignOutFailure };
