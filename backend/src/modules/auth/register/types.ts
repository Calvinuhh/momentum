import type { users } from "../../../db/schema/index.js";

export type PublicUser = Pick<typeof users.$inferSelect, "id" | "email">;

export type RegisterResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "EMAIL_ALREADY_REGISTERED" };
