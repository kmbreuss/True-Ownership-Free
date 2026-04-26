import { Router, type IRouter, type Request, type Response } from "express";
import { db, userDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_KEYS = new Set([
  "map",
  "voice",
  "mapofme_origin",
  "intake",
  "phase",
  "step",
  "done",
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
