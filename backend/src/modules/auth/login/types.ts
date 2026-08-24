import type { users } from "../../../db/schema/index.js";

export type PublicUser = Pick<typeof users.$inferSelect, "id" | "email">;

export type LoginResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "INVALID_CREDENTIALS" };
