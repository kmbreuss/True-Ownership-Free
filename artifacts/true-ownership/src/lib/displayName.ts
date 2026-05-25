import type { AuthUser } from "./auth-context";

/**
 * Ship 5.5d · Personalization · single source of truth for resolving the
 * user's display name. Order of preference:
 *   1. Intake name (the name the user typed for themselves in the intake
 *      flow — most personal/recent, owner-controlled).
 *   2. Auth user's first name from `/api/auth/me`.
 *   3. Auth user's last name (rare — only when first name is blank).
 *   4. `null` — caller must use a tasteful fallback ("you" / "your" /
 *      "My"). NEVER render the literal word "User".
 *
 * `resolveDisplayName` is the canonical entry point; pass the intake name
 * (if any) and the auth user, get back the resolved display name or null.
 */

export function getDisplayName(
  user: AuthUser | null | undefined,
): string | null {
  if (!user) return null;
  const first = (user.firstName ?? "").trim();
  if (first) return first;
  const last = (user.lastName ?? "").trim();
  if (last) return last;
  return null;
}

export function resolveDisplayName(
  intakeName: unknown,
  user: AuthUser | null | undefined,
): string | null {
  if (typeof intakeName === "string") {
    const trimmed = intakeName.trim();
    if (trimmed) return trimmed;
  }
  return getDisplayName(user);
}
