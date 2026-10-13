import { Router, type IRouter, type Request, type Response } from "express";
import { db, userDataTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { SYNC_KEYS, decideWrite, isWrapped } from "../lib/syncGuard";

const router: IRouter = Router();

const ALLOWED_KEYS = new Set([
  "map",
  "voice",
  "mapofme_origin",
  "intake",
  "phase",
  "step",
  "done",
  // New-flow (A1/A2/A3/Values) progress — versioned { t, v } values, see lib/syncGuard.ts
  ...SYNC_KEYS,
]);

router.get("/userdata", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(userDataTable)
      .where(eq(userDataTable.userId, req.user.id));
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "userdata GET error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/userdata/:key", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const key = String(req.params.key);
  if (!ALLOWED_KEYS.has(key)) {
    res.status(400).json({ error: "Invalid key" });
    return;
  }
  if (!req.body || !("value" in req.body)) {
    res.status(400).json({ error: "Missing value field in body" });
    return;
  }
  const value = req.body.value;
  if (SYNC_KEYS.has(key)) {
    if (!isWrapped(value)) {
      res.status(400).json({ error: "Expected { t, v }" });
      return;
    }
    try {
      // Serialise concurrent writers for this user+key, then apply the
      // newer-wins rule: an older client copy never replaces newer server data.
      const outcome = await db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(userDataTable)
          .where(
            and(
              eq(userDataTable.userId, req.user.id),
              eq(userDataTable.key, key),
            ),
          )
          .for("update");
        const d = decideWrite(row?.value, value, Date.now());
        if (d.action === "conflict") return d;
        if (d.action === "insert") {
          await tx
            .insert(userDataTable)
            .values({ userId: req.user.id, key, value: d.value })
            .onConflictDoUpdate({
              target: [userDataTable.userId, userDataTable.key],
              set: { value: d.value, updatedAt: new Date() },
            });
        } else {
          await tx
            .update(userDataTable)
            .set({ value: d.value, updatedAt: new Date() })
            .where(
              and(
                eq(userDataTable.userId, req.user.id),
                eq(userDataTable.key, key),
              ),
            );
        }
        return d;
      });
      if (outcome.action === "conflict") {
        res.status(409).json({ error: "Newer data on server", current: outcome.current });
        return;
      }
      res.json({ ok: true, t: outcome.value.t });
    } catch (err) {
      req.log.error({ err, key }, "userdata PUT (versioned) error");
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
  try {
    await db
      .insert(userDataTable)
      .values({ userId: req.user.id, key, value })
      .onConflictDoUpdate({
        target: [userDataTable.userId, userDataTable.key],
        set: { value, updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err, key }, "userdata PUT error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
