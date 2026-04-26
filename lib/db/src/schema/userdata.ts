import { jsonb, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const userDataTable = pgTable(
  "user_data",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    key: varchar("key").notNull(),
    value: jsonb("value"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

export type UserDataRow = typeof userDataTable.$inferSelect;
export type InsertUserData = typeof userDataTable.$inferInsert;
