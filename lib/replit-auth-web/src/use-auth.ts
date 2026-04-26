import { useState, useEffect, useCallback } from "react";
import type { AuthUser as BaseAuthUser } from "@workspace/api-client-react";

// Stage 3: extend the generated AuthUser with the server-side `role`
// field. Optional because legacy /api/auth/user responses don't include
// it; new /api/auth/me responses always do.
export type AuthUser = BaseAuthUser & { role?: string };

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Email + password sign-in. Returns null on success, an error string on
  // failure (e.g. "Invalid email or password").
  login: (email: string, password: string) => Promise<string | null>;
  // Server-side logout: clears the session row and the cookie.
  logout: () => Promise<void>;
  // Re-fetch /api/auth/me. Useful after admin-side role changes.
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.status === 401 || res.status === 400) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          return data.error ?? "Invalid email or password";
        }
        if (!res.ok) {
          return `Sign in failed (HTTP ${res.status})`;
        }
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
        setIsLoading(false);
        return null;
      } catch {
        return "Network error — please try again";
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* server may already be unreachable; clear local state anyway */
    }
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refresh,
  };
}
