import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// (IMPORTANT) Session storage. Required for both legacy OIDC and current
// email+password sessions; do not drop.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table — extended for Stage 3 (email + password auth).
// `passwordHash` is NULL only for legacy OIDC-imported rows that have not
// been migrated yet. `role` defaults to 'client'; 'owner' = lightweight admin.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  role: varchar("role", { length: 16 }).notNull().default("client"),
  emailConsent: boolean("email_consent").notNull().default(false),
  waitlistedAt: timestamp("waitlisted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Dormant invite-token table — wired in schema only so future invite flows
// (Owner's-Circle pattern) can land without another migration.
export const invitesTable = pgTable("invites", {
  token: varchar("token", { length: 64 }).primaryKey(),
  email: varchar("email").notNull(),
  role: varchar("role", { length: 16 }).notNull().default("client"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
export type Invite = typeof invitesTable.$inferSelect;
