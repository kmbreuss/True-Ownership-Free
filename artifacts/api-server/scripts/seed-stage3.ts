import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const KATHERINE_ID = "46260892";
const KATHERINE_EMAIL = "katherine@ag45.com";
const BCRYPT_COST = 10;

function generateTempPassword(): string {
  // 16-char URL-safe random string. Shown ONCE.
  return crypto.randomBytes(12).toString("base64url");
}

async function main() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, KATHERINE_ID));

  if (!existing) {
    console.error(
      `[seed-stage3] FATAL: user id=${KATHERINE_ID} not found. ` +
        `Refusing to create — Katherine's row must exist from Stage 2.`,
    );
    process.exit(1);
  }

  if (existing.passwordHash) {
    console.log(
      `[seed-stage3] User ${KATHERINE_ID} already has a password_hash. ` +
        `No changes made. (To re-seed, NULL the column manually first.)`,
    );
    console.log(`[seed-stage3] Current role: ${existing.role}`);
    process.exit(0);
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, BCRYPT_COST);

  await db
    .update(usersTable)
    .set({
      email: KATHERINE_EMAIL,
      passwordHash: hash,
      role: "owner",
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, KATHERINE_ID));

  console.log("");
  console.log("============================================================");
  console.log(" Katherine seeded with email + password.");
  console.log("------------------------------------------------------------");
  console.log(` user_id : ${KATHERINE_ID}`);
  console.log(` email   : ${KATHERINE_EMAIL}`);
  console.log(` role    : owner`);
  console.log(` TEMP PW : ${tempPassword}`);
  console.log("------------------------------------------------------------");
  console.log(" Copy the temp password NOW. It will not be shown again.");
  console.log(" Change it from the in-app account screen after first login.");
  console.log("============================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-stage3] ERROR:", err);
    process.exit(1);
  });
