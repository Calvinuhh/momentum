import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/index.js";
import type { RegisterInput } from "./schema.js";
import type { RegisterResult } from "./types.js";

export async function registerUser({ email, password }: RegisterInput): Promise<RegisterResult> {
  const existingUser = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existingUser) {
    return { ok: false, reason: "EMAIL_ALREADY_REGISTERED" };
  }

  const passwordHash = await Bun.password.hash(password);

  try {
    const user = db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id, email: users.email })
      .get();

    return { ok: true, user };
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return { ok: false, reason: "EMAIL_ALREADY_REGISTERED" };
    }
    throw error;
  }
}
