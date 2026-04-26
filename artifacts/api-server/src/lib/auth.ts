import crypto from "crypto";
import bcrypt from "bcryptjs";
import { type Request, type Response } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import type { AuthUser } from "@workspace/api-zod";

export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
export const BCRYPT_COST = 10;

// AuthUser plus authorization fields we need server-side (role).
export interface AuthedUser extends AuthUser {
  role: string;
}

// Email + password sessions only — Stage 3 removed every OIDC field.
export interface SessionData {
  user: AuthUser;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row || row.expire < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }

  return row.sess as unknown as SessionData;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}

// ── Password + user helpers ──────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function generateTempPassword(): string {
  // 16-char URL-safe random — shown to caller once.
  return crypto.randomBytes(12).toString("base64url");
}

export async function getUserById(id: string): Promise<AuthedUser | null> {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    profileImageUrl: row.profileImageUrl,
    role: row.role,
  };
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));
  return row ?? null;
}

// Delete every session belonging to a user. Used after role/password changes
// or account deletion so credentials can't outlive the change.
export async function destroyUserSessions(userId: string): Promise<void> {
  await db
    .delete(sessionsTable)
    .where(sql`sess->'user'->>'id' = ${userId}`);
}
