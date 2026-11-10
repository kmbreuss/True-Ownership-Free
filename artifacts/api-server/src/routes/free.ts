import { Router, type IRouter } from "express";
import { db, usersTable, userDataTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { FreeSignupBody, UpdateFreeNameBody } from "@workspace/api-zod";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();
// Conservative per-server limits: bounded memory, no forwarded-IP trust.
const attempts = new Map<string, { count: number; until: number }>();
router.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    const host = req.get("x-forwarded-host")?.split(",")[0].trim() ?? req.get("host");
    let foreign = req.get("sec-fetch-site") === "cross-site";
    try { if (origin && new URL(origin).host !== host) foreign = true; } catch { foreign = true; }
    if (foreign) { res.status(403).json({ error: "Use this app to make changes." }); return; }
  }
  if (req.method === "POST" && ["/free/signup", "/auth/login"].includes(req.path)) {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    const key = `${req.ip}:${req.path}`;
    const value = attempts.get(key) ?? { count: 0, until: now + 15 * 60_000 };
    if (++value.count > (req.path.endsWith("signup") ? 20 : 60)) {
      res.set("Retry-After", String(Math.ceil((value.until - now) / 1000)));
      res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." }); return;
    }
    attempts.set(key, value);
  }
  next();
});

router.post("/free/signup", async (req, res): Promise<void> => {
  const parsed = FreeSignupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter your first name, a valid email and a password of 8–72 characters." }); return; }
  const { password, consent } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const firstName = parsed.data.firstName.trim();
  if (!firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Buffer.byteLength(password, "utf8") > 72) {
    res.status(400).json({ error: "Check your name and email. Passwords must be at most 72 UTF-8 bytes." }); return;
  }
  const passwordHash = await hashPassword(password);
  const created = await db.insert(usersTable).values({
    email, firstName, passwordHash, role: "client", emailConsent: consent === true,
  }).onConflictDoNothing({ target: usersTable.email }).returning({ id: usersTable.id });
  if (!created.length) { res.status(409).json({ error: "We couldn't create this account. Try signing in instead." }); return; }
  res.status(201).json({ ok: true });
});

router.use("/free", (req, res, next) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Sign in to continue." }); return; }
  if (req.method !== "GET" && req.get("X-Account-Id") !== req.user.id) {
    res.status(412).json({ error: "Account changed. Reload before saving." }); return;
  }
  next();
});

async function account(id: string) {
  const [row] = await db.select({ firstName: usersTable.firstName, consent: usersTable.emailConsent, waitlistedAt: usersTable.waitlistedAt })
    .from(usersTable).where(eq(usersTable.id, id));
  return row;
}
router.get("/free/account", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  res.json(await account(req.user.id));
});
router.patch("/free/account", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  const parsed = UpdateFreeNameBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Use a name of at most 100 characters." }); return; }
  await db.update(usersTable).set({ firstName: parsed.data.firstName.trim() || null }).where(eq(usersTable.id, req.user.id));
  res.json({ ok: true });
});
router.post("/free/waitlist", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  const [progress] = await db.select().from(userDataTable)
    .where(sql`${userDataTable.userId} = ${req.user.id} AND ${userDataTable.key} = 'rcstate'`);
  const saved = progress?.value as { v?: { complete?: boolean } } | undefined;
  if (!saved?.v?.complete) { res.status(409).json({ error: "Finish saving your Reality Check before joining the waitlist." }); return; }
  await db.update(usersTable).set({ waitlistedAt: sql`coalesce(${usersTable.waitlistedAt}, now())` }).where(eq(usersTable.id, req.user.id));
  res.json(await account(req.user.id));
});

const csv = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
};
router.get("/free/leads.csv", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) { res.sendStatus(401); return; }
  if (req.user.role !== "owner") { res.status(403).json({ error: "Owner access required." }); return; }
  const rows = await db.select({
    firstName: usersTable.firstName, email: usersTable.email, consent: usersTable.emailConsent,
    signupDate: usersTable.createdAt, waitlistedAt: usersTable.waitlistedAt, answers: userDataTable.value,
  }).from(usersTable).leftJoin(userDataTable, sql`${userDataTable.userId} = ${usersTable.id} AND ${userDataTable.key} = 'rcstate'`);
  const output = [["first_name", "email", "consent", "signup_date", "rc_finished", "waitlist", "waitlist_date", "focus_area"].map(csv).join(",")];
  for (const row of rows) {
    const rc = (row.answers as { v?: { complete?: boolean; focus?: string } } | null)?.v;
    output.push([row.firstName, row.email, row.consent ? "yes" : "no", row.signupDate.toISOString(),
      rc?.complete ? "yes" : "no", row.waitlistedAt ? "yes" : "no", row.waitlistedAt?.toISOString(), rc?.focus].map(csv).join(","));
  }
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="true-ownership-free-leads.csv"', "Cache-Control": "no-store" });
  res.send("\uFEFF" + output.join("\r\n"));
});
export default router;
