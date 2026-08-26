import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const refreshTokens = sqliteTable(
  "refresh_tokens",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    familyId: text("family_id").notNull(),
    tokenHash: text("token_hash").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_family_id_idx").on(table.familyId),
    index("refresh_tokens_expires_at_idx").on(table.expiresAt),
  ],
);
