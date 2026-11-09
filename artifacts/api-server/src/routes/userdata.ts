import { Router, type IRouter, type Request, type Response } from "express";
import { db, userDataTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { normalizeDecisions, mergeDecisions } from "../../../../lib/decision-model";
import { SYNC_KEYS, decideWrite, isWrapped } from "../lib/syncGuard";

const router: IRouter = Router();

// Bind saves to the client account that produced them, not only to the shared
// browser cookie. Old/unbound clients must reload rather than upload old caches.
router.use("/userdata", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const expected = req.get("X-Account-Id");
  if ((req.method === "PUT" && !expected) || (expected && expected !== req.user.id)) {
    res.status(412).json({ error: "Account changed. Reload before syncing answers." });
    return;
  }
  next();
});

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
    if (key === "decisions") {
      const payload = value.v as {version?:unknown;items?:unknown[]}|null;
      if (!payload || payload.version!==1 || !Array.isArray(payload.items) ||
        normalizeDecisions(payload).items.length!==payload.items.length) {
        res.status(400).json({error:"Invalid decision record"}); return;
      }
    }
    try {
      // Serialise concurrent writers for this user+key, then apply the
      // newer-wins rule: an older client copy never replaces newer server data.
      const outcome = await db.transaction(async (tx) => {
        if (key === "decisions") await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${req.user.id + ":decisions"}))`);
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
        let incoming = value;
        if (key === "decisions") {
          const parsed = normalizeDecisions(value.v);
          const now = Date.now();
          const current = normalizeDecisions(isWrapped(row?.value) ? row.value.v : null);
          const items = parsed.items.map(r => {
            const old = current.items.find(item => item.id === r.id);
            // Once saved, the walkthrough is immutable. Only its outcome can change.
            if (old) return {...old, followUp: r.followUp && (!old.followUp || r.followUp.savedAt > old.followUp.savedAt)
              ? {...r.followUp, savedAt: now} : old.followUp, updatedAt: now};
            return {...r, createdAt: now, updatedAt: now, followUp: null};
          });
          incoming = {t: now, v: mergeDecisions({version:1,items}, current)};
        }
        const d = key === "decisions"
          ? {action: row ? "update" as const : "insert" as const, value: incoming}
          : decideWrite(row?.value, incoming, Date.now());
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
      res.json({ ok: true, t: outcome.value.t, ...(key === "decisions" ? {current:outcome.value} : {}) });
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
