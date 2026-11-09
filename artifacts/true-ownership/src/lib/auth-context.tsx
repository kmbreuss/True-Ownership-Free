import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser as BaseAuthUser } from "@workspace/api-client-react";
import { clearSignedOutAccountCache, prepareAccountSignOut, resumeNewFlowAfterSignOutFailure } from "./accountSignOut";
import { bindAccountCache, unbindAccountCache } from "./accountIsolation";

// Extend the generated AuthUser with the server-side `role` field.
// Optional because legacy responses don't include it; new /api/auth/me
// responses always do.
export type AuthUser = BaseAuthUser & { role?: string };

export interface AuthState {
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

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { user: AuthUser | null };
      if (data.user) bindAccountCache(data.user.id);
      else unbindAccountCache();
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
        bindAccountCache(data.user.id);
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
      await prepareAccountSignOut();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
    } catch (error) {
      resumeNewFlowAfterSignOutFailure();
      throw error;
    }
    clearSignedOutAccountCache();
    unbindAccountCache();
    setUser(null);
    // Discard all mounted answer state and return to sign-in without old route/preview parameters.
    window.location.replace(import.meta.env.BASE_URL);
  }, []);

  const value: AuthState = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth() called outside of <AuthProvider>. Wrap your app root in " +
        "<AuthProvider> from src/lib/auth-context.tsx.",
    );
  }
  return ctx;
}
