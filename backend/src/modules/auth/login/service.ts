import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/users.js";
import type { LoginInput } from "./schema.js";

export async function authenticateUser({ email, password }: LoginInput) {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  const validPassword = user ? await Bun.password.verify(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    return null;
  }

  if (!user.emailVerifiedAt) {
    return { unverified: true as const };
  }

  return { id: user.id, email: user.email };
}
