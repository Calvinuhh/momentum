import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export type NotificationType = "WORKSPACE_INVITATION";

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
    type: text("type").$type<NotificationType>().notNull(),
    resourceId: text("resource_id").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    check("notifications_type_check", sql`${table.type} = 'WORKSPACE_INVITATION'`),
    uniqueIndex("notifications_user_type_resource_unique").on(
      table.userId,
      table.type,
      table.resourceId,
    ),
    index("notifications_user_created_at_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx")
      .on(table.userId, table.createdAt)
      .where(sql`${table.readAt} IS NULL`),
    index("notifications_workspace_id_idx").on(table.workspaceId),
  ],
);
