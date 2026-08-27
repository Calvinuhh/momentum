import { integer, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const pushInstallations = sqliteTable(
  "push_installations",
  {
    fid: text("fid").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    familyId: text("family_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("push_installations_user_id_idx").on(table.userId),
    index("push_installations_family_id_idx").on(table.familyId),
  ],
);
