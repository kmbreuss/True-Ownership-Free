import { isDevPreview, previewRead } from "../devPreview";
import { notifyLocalChange } from "../syncHook";
import { SETASIDE_KEY, loadSetAside } from "../reality-check/rcJourney";

export const NOTICE_KEY = "a1_notice";
export const NOTICE_ITEM_ID = "a1:notice";
export interface A1Notice { value: string; lived: string; didnt: string; savedAt: string }
export function loadNotice(): A1Notice | null {
  const raw = previewRead(NOTICE_KEY) ?? localStorage.getItem(NOTICE_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || !["value", "lived", "didnt", "savedAt"].every(k => typeof value[k] === "string")) {
    throw new Error("Your weekly notice could not be read.");
  }
  return value;
}
export function saveNotice(draft: Pick<A1Notice, "value" | "lived" | "didnt">): void {
  if (isDevPreview()) return;
  const now = new Date().toISOString();
  const notice: A1Notice = { ...draft, savedAt: now };
  const aside = loadSetAside();
  const previous = aside.items.find(item => item.id === NOTICE_ITEM_ID);
  const item = { ...previous, id: NOTICE_ITEM_ID, source: "a1", kind: "notice",
    area: null, round: "a1", createdAt: previous?.createdAt || now, text: draft.didnt };
  // Updating our own stable item (even to an empty answer) preserves its identity.
  // Never manufacture a blank item, drop another source, or rewrite RC answers.
  const items = previous ? aside.items.map(old => old.id === NOTICE_ITEM_ID ? item : old)
    : draft.didnt.trim() ? [...aside.items, item] : aside.items;
  const changes: [string, string][] = [[NOTICE_KEY, JSON.stringify(notice)]];
  if (previous || draft.didnt.trim()) changes.push([SETASIDE_KEY, JSON.stringify({ ...aside, items })]);
  const before = changes.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of changes) localStorage.setItem(key, value);
  } catch (error) {
    for (const [key, value] of before) {
      try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* Report the original save failure. */ }
    }
    throw error;
  }
  for (const [key] of changes) notifyLocalChange(key);
}
