import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id")
    .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    check("workspaces_name_len", sql`length(${table.name}) >= 3 AND length(${table.name}) <= 50`),
    check(
      "workspaces_description_len",
      sql`${table.description} IS NULL OR length(${table.description}) <= 1000`,
    ),
    index("workspaces_owner_id_idx").on(table.ownerId),
    index("workspaces_deleted_at_idx").on(table.deletedAt),
  ],
);
