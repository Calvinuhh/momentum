import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";
import { workspaces } from "./workspaces.js";

export type InvitationRole = "ADMIN" | "MEMBER";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id")
    .primaryKey()
      .$defaultFn(() => createId()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    email: text("email").notNull(),
    role: text("role").$type<InvitationRole>().notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    check("invitations_role_check", sql`${table.role} IN ('ADMIN','MEMBER')`),
    check("invitations_email_len", sql`length(${table.email}) >= 5 AND length(${table.email}) <= 254`),
    index("invitations_workspace_id_idx").on(table.workspaceId),
    index("invitations_email_idx").on(table.email),
    index("invitations_expires_at_idx").on(table.expiresAt),
    uniqueIndex("invitations_workspace_email_pending_idx")
      .on(table.workspaceId, table.email)
      .where(sql`${table.acceptedAt} IS NULL`),
  ],
);
