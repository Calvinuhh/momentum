import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export const memberships = sqliteTable(
  "memberships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    role: text("role").$type<WorkspaceRole>().notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.workspaceId] }),
    check("memberships_role_check", sql`${table.role} IN ('OWNER','ADMIN','MEMBER')`),
    index("memberships_workspace_id_idx").on(table.workspaceId),
    index("memberships_user_id_idx").on(table.userId),
  ],
);
