import * as oidc from "openid-client";
import { type Request, type Response, type NextFunction } from "express";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  getUserById,
  updateSession,
  type AuthedUser,
  type SessionData,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends AuthedUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

// Refresh OIDC tokens if expired. Only relevant for legacy OIDC-created
// sessions (sessions that carry a refresh_token). Email+password sessions
// have no tokens and skip this entirely.
async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  if (!session.refresh_token) return session;

  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(
      config,
      session.refresh_token,
    );
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  // Refresh OIDC tokens if applicable. No-op for email+password sessions.
  const refreshed = await refreshIfExpired(sid, session);
  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  // Re-resolve the user from the database every request. This is the
  // Owner's-Circle pattern: role/password/email changes take effect on
  // the next request without needing to re-login. If the user was
  // deleted, the session is killed.
  const fresh = await getUserById(refreshed.user.id);
  if (!fresh) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = fresh;
  next();
}
