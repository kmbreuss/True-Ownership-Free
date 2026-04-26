// Re-export shim. The real implementation lives in `auth-context.tsx`,
// which provides both `<AuthProvider>` (the single source of truth) and
// `useAuth()` (which reads from that provider's context).
export { useAuth, AuthProvider, type AuthUser, type AuthState } from "./auth-context";
