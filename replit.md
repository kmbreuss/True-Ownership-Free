# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Authentication (AG45 · True Ownership)

Email + password auth, "Owner's Circle" pattern. Stage 3 complete (April 2026):
the previous Replit OIDC flow (`openid-client`, `lib/replit-auth-web`,
`/api/login`, `/api/callback`, `/api/logout`, `/api/mobile-auth/*`) has been
fully removed. Sessions are server-side rows in `sessions` keyed by an `sid`
cookie; passwords are bcryptjs (cost 10) hashes in `users.password_hash`.
Roles are a `varchar(16)` (`owner` | `client`) with default `client`.

- Server: `artifacts/api-server/src/routes/authPassword.ts`,
  `src/routes/admin.ts`, `src/middlewares/authMiddleware.ts`,
  `src/lib/auth.ts`.
- Client: `artifacts/true-ownership/src/lib/auth-context.tsx`
  (`<AuthProvider>` + `useAuth()`), inlined when the shared
  `lib/replit-auth-web` package was retired.
- The middleware re-resolves `req.user` from the database every request, so
  role/password changes take effect on the next request without re-login.
  After role changes, password resets, or account deletion the server calls
  `destroyUserSessions(userId)` so old credentials cannot outlive the change.
