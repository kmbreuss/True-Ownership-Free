// Development-only API checks. Temporary synthetic account is removed in finally.
import pg from "pg";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const base = process.env.FREE_TEST_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
assert(/^https:\/\/[^/]+\.replit\.dev$|^http:\/\/localhost:80$/.test(base), "Only the development preview is allowed.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const email = `free-api-check-${randomBytes(8).toString("hex")}@example.invalid`;
const password = randomBytes(18).toString("base64url");
let id;
let cookie;
async function request(url, method = "GET", body, headers = {}) {
  const response = await fetch(base + url, { method, headers: {
    "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}),
    ...(id ? { "X-Account-Id": id } : {}), ...headers,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return response;
}
try {
  const signed = await request("/api/free/signup", "POST", { firstName: "=SUM(1,2)", email, password, consent: true, role: "owner" });
  assert.equal(signed.status, 201, await signed.text());
  const row = (await pool.query("SELECT id, role FROM users WHERE email = $1", [email])).rows[0];
  id = row.id;
  assert.equal(row.role, "client", "Signup must never grant owner access.");
  const login = await request("/api/auth/login", "POST", { email, password });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/free/leads.csv")).status, 403);
  assert.equal((await request("/api/free/account")).status, 200);
  const meta = await (await request("/api/free/account")).json();
  assert.equal(meta.consent, true); assert.equal(meta.waitlistedAt, null);
  assert.equal((await request("/api/free/waitlist", "POST")).status, 409);
  assert.equal((await request("/api/free/signup", "POST", { firstName: "Duplicate", email, password })).status, 409);
  assert.equal((await request("/api/free/signup", "POST", { firstName: "Invalid", email: "bad email", password })).status, 400);
  assert.equal((await request("/api/free/signup", "POST", { firstName: "Invalid", email: "other@example.invalid", password: "short" })).status, 400);
  assert.equal((await request("/api/free/signup", "POST", { firstName: "Invalid", email: "other@example.invalid", password: "界".repeat(30) })).status, 400);
  assert.equal((await request("/api/free/account", "PATCH", { firstName: "Other" }, { "X-Account-Id": "other-user" })).status, 412);
  assert.equal((await request("/api/free/waitlist", "POST", undefined, { Origin: "https://foreign.invalid" })).status, 403);
  assert.equal((await request("/api/admin/users")).status, 404, "Generated-password admin API must be unreachable.");
  // Simulate an owner ONLY on this exact temporary synthetic fixture.
  await pool.query("UPDATE users SET role = 'owner' WHERE id = $1 AND email = $2", [id, email]);
  const exportResponse = await request("/api/free/leads.csv");
  assert.equal(exportResponse.status, 200);
  assert.match(exportResponse.headers.get("content-type"), /text\/csv/);
  const csv = await exportResponse.text();
  assert(csv.includes(email)); assert(csv.includes("\"'=SUM(1,2)\""), "CSV spreadsheet formulas must be escaped.");
  assert(!csv.includes("password_hash")); assert(!csv.includes("$2b$"));
  assert(csv.includes('"rc_finished","waitlist","waitlist_date","focus_area"'));
  await pool.query("UPDATE users SET role = 'client' WHERE id = $1 AND email = $2", [id, email]);
  assert.equal((await request("/api/free/leads.csv")).status, 403, "Owner access must be re-resolved each request.");
  console.log("PASS: client-only signup, validation, consent, duplicate safety, account/origin isolation, owner-only CSV, formula escaping, removed admin API.");
} finally {
  if (id) {
    await pool.query("DELETE FROM sessions WHERE sess->'user'->>'id' = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1 AND email = $2", [id, email]);
  }
  await pool.end();
}
