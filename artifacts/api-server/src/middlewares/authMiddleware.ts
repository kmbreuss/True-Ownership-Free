import { type Request, type Response, type NextFunction } from "express";
import {
  clearSession,
  getSessionId,
  getSession,
  getUserById,
  type AuthedUser,
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

  // Re-resolve the user from the database every request. This is the
  // Owner's-Circle pattern: role/password/email changes take effect on
  // the next request without needing to re-login. If the user was
  // deleted, the session is killed.
  const fresh = await getUserById(session.user.id);
  if (!fresh) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = fresh;
  next();
}
