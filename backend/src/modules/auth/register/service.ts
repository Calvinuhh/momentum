import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/users.js";
import type { RegisterInput } from "./schema.js";

export async function registerUser({ email, password }: RegisterInput) {
  const passwordHash = await Bun.password.hash(password);

  try {
    return db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id, email: users.email })
      .get();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return null;
    }
    throw error;
  }
}
