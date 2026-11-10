import pg from "pg";
import assert from "node:assert/strict";

const email = process.argv[2] ?? "";
assert(/^free-regression-\d+-[a-f0-9]{6}@example\.invalid$/.test(email), "Only an exact free regression fixture address may be removed.");
assert(!process.env.REPLIT_DEPLOYMENT, "Fixture cleanup is development-only.");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  const { rows } = await client.query("SELECT id FROM users WHERE email = $1 AND role = 'client' FOR UPDATE", [email]);
  for (const row of rows) {
    await client.query("DELETE FROM sessions WHERE sess->'user'->>'id' = $1", [row.id]);
    await client.query("DELETE FROM users WHERE id = $1 AND email = $2 AND role = 'client'", [row.id, email]);
  }
  await client.query("COMMIT");
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { client.release(); await pool.end(); }
