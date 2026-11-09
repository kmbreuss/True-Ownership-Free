/**
 * All account caches share this boundary, including old direct Storage callers.
 * Unknown caches are kept as opaque browser-only recovery copies, never adopted.
 * No account answer screens may mount until bindAccountCache has succeeded.
 */
export const ACCOUNT_OWNER_KEY = "account-cache-owner:v2";
export const QUARANTINE_PREFIX = "account-cache-quarantine:v1:";
const rawGet = Storage.prototype.getItem;
const rawSet = Storage.prototype.setItem;
const rawRemove = Storage.prototype.removeItem;
const nativeFetch = window.fetch.bind(window);
let owner: string | null = null;
let generation = 0;
const invalidators = new Set<() => void>();
const requests = new Set<AbortController>();

export function isAccountCacheKey(key: string): boolean {
  return (key.startsWith("to_") && !["to_road_phone_tip_seen_v1", "to_dev_preview"].includes(key))
    || key.startsWith("a1_")
    || ["na1_optin", "na2_optin", "na3_optin", "newM3", "newM4"].includes(key);
}

export function accountCacheReady(): boolean {
  return owner !== null && rawGet.call(localStorage, ACCOUNT_OWNER_KEY) === owner;
}

export function accountGeneration(): number { return generation; }
export function onAccountBoundary(callback: () => void): void { invalidators.add(callback); }

function stopAccountWork(): void {
  owner = null;
  generation++;
  for (const request of requests) request.abort();
  requests.clear();
  for (const invalidate of invalidators) invalidate();
}

function quarantineAndClear(): void {
  const snapshot: { local: Record<string, string>; session: Record<string, string> } = { local: {}, session: {} };
  for (const [name, storage] of [["local", localStorage], ["session", sessionStorage]] as const) {
    for (const key of Object.keys(storage)) {
      if (isAccountCacheKey(key)) snapshot[name][key] = rawGet.call(storage, key)!;
    }
  }
  // Fail closed: if a recovery copy cannot be stored, do not discard the original.
  if (Object.keys(snapshot.local).length || Object.keys(snapshot.session).length) {
    rawSet.call(localStorage, QUARANTINE_PREFIX + crypto.randomUUID(), JSON.stringify({
      quarantinedAt: new Date().toISOString(), ...snapshot,
    }));
  }
  for (const [name, storage] of [["local", localStorage], ["session", sessionStorage]] as const) {
    for (const key of Object.keys(snapshot[name])) rawRemove.call(storage, key);
  }
  rawRemove.call(localStorage, ACCOUNT_OWNER_KEY);
  history.replaceState(null, "", import.meta.env.BASE_URL);
}

/** Called for both /auth/me restoration and fresh sign-in, before publishing user state. */
export function bindAccountCache(nextOwner: string): void {
  if (!nextOwner) throw new Error("An account is required before loading answers.");
  const previous = rawGet.call(localStorage, ACCOUNT_OWNER_KEY);
  if (owner === nextOwner && previous === nextOwner) return;
  stopAccountWork();
  if (previous !== nextOwner) quarantineAndClear();
  rawSet.call(localStorage, ACCOUNT_OWNER_KEY, nextOwner);
  owner = nextOwner;
}

/** Expired/revoked sessions must not leave reusable caches for the next login. */
export function unbindAccountCache(): void {
  stopAccountWork();
  quarantineAndClear();
}

// Every existing answer/progress Storage reader uses the same ownership check.
// Appearance and unrelated browser preferences remain available before sign-in.
Storage.prototype.getItem = function(key: string): string | null {
  if (isAccountCacheKey(String(key)) && !accountCacheReady()) return null;
  return rawGet.call(this, key);
};
Storage.prototype.setItem = function(key: string, value: string): void {
  if (isAccountCacheKey(String(key)) && !accountCacheReady()) {
    throw new Error("Account cache is not ready. Reload before saving answers.");
  }
  rawSet.call(this, key, value);
};
Storage.prototype.removeItem = function(key: string): void {
  if (isAccountCacheKey(String(key)) && !accountCacheReady()) return;
  rawRemove.call(this, key);
};

// Cover every userdata caller, not just the new-flow stores. The server checks
// the expected owner too, so a stale tab cannot write through another tab's cookie.
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.origin !== location.origin || !/^\/api\/userdata(?:\/|$)/.test(url.pathname)) {
    return nativeFetch(input, init);
  }
  if (!accountCacheReady()) throw new Error("Account changed. Reload before syncing answers.");
  const stamp = generation;
  const controller = new AbortController();
  const sourceSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  if (sourceSignal?.aborted) abort();
  sourceSignal?.addEventListener("abort", abort, { once: true });
  requests.add(controller);
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.set("X-Account-Id", owner!);
  try {
    const response = await nativeFetch(input, { ...init, headers, signal: controller.signal });
    if (stamp !== generation || !accountCacheReady()) throw new Error("Account changed during sync.");
    if (response.status === 401 || response.status === 412) {
      stopAccountWork();
      location.reload();
      throw new Error("Session changed. Sign in again before syncing.");
    }
    // Parsing may finish after a boundary even when headers arrived beforehand.
    const readJson = response.json.bind(response);
    response.json = async () => {
      const body = await readJson();
      if (stamp !== generation || !accountCacheReady()) throw new Error("Account changed while loading answers.");
      return body;
    };
    return response;
  } finally {
    requests.delete(controller);
    sourceSignal?.removeEventListener("abort", abort);
  }
};

window.addEventListener("storage", event => {
  if (owner && (event.key === ACCOUNT_OWNER_KEY || event.key === null) && !accountCacheReady()) {
    stopAccountWork();
    location.reload();
  }
});
