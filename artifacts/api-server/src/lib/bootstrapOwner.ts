import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

export async function bootstrapOwner(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"));

    if (count > 0) {
      logger.info({ owners: count }, "Owner already exists, skipping bootstrap");
      return;
    }

    const email = normaliseEmail(process.env["INITIAL_OWNER_EMAIL"]);
    const password = process.env["INITIAL_OWNER_PASSWORD"];

    if (!email || !password) {
      logger.warn(
        {
          haveEmail: Boolean(email),
          havePassword: Boolean(password),
        },
        "Owner bootstrap skipped: INITIAL_OWNER_EMAIL and INITIAL_OWNER_PASSWORD must both be set",
      );
      return;
    }

    const firstName = process.env["INITIAL_OWNER_FIRST_NAME"] ?? null;
    const lastName = process.env["INITIAL_OWNER_LAST_NAME"] ?? null;

    const passwordHash = await hashPassword(password);

    await db.insert(usersTable).values({
      email,
      firstName,
      lastName,
      role: "owner",
      passwordHash,
    });

    logger.info({ email }, "Owner bootstrapped");
  } catch (err) {
    logger.error({ err }, "Owner bootstrap failed");
  }
}
