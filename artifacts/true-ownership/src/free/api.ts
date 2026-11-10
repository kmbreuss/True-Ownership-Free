import type { FreeAccount } from "@workspace/api-client-react";
import { accountCacheReady, accountGeneration } from "../lib/accountIsolation";
export type Account = FreeAccount;

export async function freeRequest<T = { ok: boolean }>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const stamp = accountGeneration();
  const owner = localStorage.getItem("account-cache-owner:v2");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (owner) headers["X-Account-Id"] = owner;
  const response = await fetch(`/api${path}`, {
    method, credentials: "include", headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (path !== "/free/signup" && (stamp !== accountGeneration() || !accountCacheReady())) {
    throw new Error("Account changed. Reload before continuing.");
  }
  if (!response.ok) throw new Error(data.error ?? "Could not save. Please try again.");
  return data as T;
}
