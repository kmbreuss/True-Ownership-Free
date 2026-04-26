import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  clearSession,
  createSession,
  destroyUserSessions,
  findUserByEmail,
  getSessionId,
  hashPassword,
  SESSION_COOKIE,
  SESSION_TTL,
  verifyPassword,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

// POST /api/auth/login — { email, password } → 200 { user } + sets sid cookie
router.post("/auth/login", async (req: Request, res: Response) => {
  const email = normaliseEmail(req.body?.email);
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const row = await findUserByEmail(email);
  // Always perform a bcrypt compare so timing doesn't leak whether the email
  // exists. If row is null we compare against a dummy hash.
  const ok = await verifyPassword(
    password,
    row?.passwordHash ??
      "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.KHYQk0wQkk3kMnUqFmQFE.6oxAjC",
  );

  if (!row || !ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
    },
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({
    user: {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      profileImageUrl: row.profileImageUrl,
      role: row.role,
    },
  });
});

// POST /api/auth/logout — kills the current session, clears the cookie.
router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

// GET /api/auth/me — current user (with role) or null.
router.get("/auth/me", (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ user: null });
    return;
  }
  res.json({ user: req.user });
});

// POST /api/auth/me/password — { currentPassword, newPassword }
router.post("/auth/me/password", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!newPassword || newPassword.length < 8) {
    res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
    return;
  }

  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  if (!row) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const ok = await verifyPassword(currentPassword, row.passwordHash);
  if (!ok) {
    res.status(403).json({ error: "Current password is incorrect" });
    return;
  }

  const hash = await hashPassword(newPassword);
  await db
    .update(usersTable)
    .set({ passwordHash: hash, updatedAt: new Date() })
    .where(eq(usersTable.id, row.id));

  // Kill every other session for this user; the current request's session
  // also dies, so the client must log in again with the new password.
  await destroyUserSessions(row.id);
  await clearSession(res, getSessionId(req));

  res.json({ ok: true });
});

export default router;
