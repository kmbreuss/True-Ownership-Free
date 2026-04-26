import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { db, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  destroyUserSessions,
  generateTempPassword,
  hashPassword,
} from "../lib/auth";

const router: IRouter = Router();

function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "owner") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

function normaliseRole(value: unknown): "owner" | "client" | null {
  return value === "owner" || value === "client" ? value : null;
}

router.use("/admin", requireOwner);

// GET /api/admin/users — list every user (no password hashes).
router.get("/admin/users", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      role: usersTable.role,
      hasPassword: usersTable.passwordHash,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json({
    users: rows.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      hasPassword: !!u.hasPassword,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
  });
});

// POST /api/admin/users — { email, firstName?, lastName?, role? }
// Creates a user with an auto-generated temp password, returned once.
router.post("/admin/users", async (req: Request, res: Response) => {
  const email = normaliseEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }
  const role = normaliseRole(req.body?.role) ?? "client";
  const firstName =
    typeof req.body?.firstName === "string" ? req.body.firstName : null;
  const lastName =
    typeof req.body?.lastName === "string" ? req.body.lastName : null;

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "A user with that email already exists" });
    return;
  }

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);

  const [created] = await db
    .insert(usersTable)
    .values({
      email,
      firstName,
      lastName,
      role,
      passwordHash: hash,
    })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });

  res.json({ user: created, tempPassword });
});

// POST /api/admin/users/:id/change-password — { newPassword? }
// If newPassword omitted, an auto-generated temp password is returned.
router.post(
  "/admin/users/:id/change-password",
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const supplied =
      typeof req.body?.newPassword === "string" && req.body.newPassword.length >= 8
        ? req.body.newPassword
        : null;

    const [row] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newPlain = supplied ?? generateTempPassword();
    const hash = await hashPassword(newPlain);

    await db
      .update(usersTable)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(usersTable.id, id));

    await destroyUserSessions(id);

    res.json({
      ok: true,
      tempPassword: supplied ? null : newPlain,
    });
  },
);

// POST /api/admin/users/:id/role — { role: 'owner' | 'client' }
router.post("/admin/users/:id/role", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const role = normaliseRole(req.body?.role);
  if (!role) {
    res.status(400).json({ error: "Role must be 'owner' or 'client'" });
    return;
  }

  // Don't let an owner demote themselves to the last owner-less state by
  // accident; allow the change but simply require there be at least one
  // remaining owner afterward.
  if (req.user!.id === id && role !== "owner") {
    const owners = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"));
    if (owners.length <= 1) {
      res
        .status(409)
        .json({ error: "Cannot demote the last remaining owner" });
      return;
    }
  }

  const [row] = await db
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, role: usersTable.role });

  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Force re-login so the new role is reflected in their next request.
  await destroyUserSessions(id);

  res.json({ ok: true, user: row });
});

// DELETE /api/admin/users/:id — removes user and every session they have.
router.delete("/admin/users/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (req.user!.id === id) {
    res.status(409).json({ error: "You cannot delete your own account" });
    return;
  }

  // Refuse if it would remove the last owner.
  const [target] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (target.role === "owner") {
    const owners = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"));
    if (owners.length <= 1) {
      res
        .status(409)
        .json({ error: "Cannot delete the last remaining owner" });
      return;
    }
  }

  await destroyUserSessions(id);
  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ ok: true });
});

export default router;
