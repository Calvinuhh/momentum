import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/users.js";
import { eq } from "drizzle-orm";
import { enqueueVerificationEmail } from "../../../queue/email.js";
import { createVerificationCode, hashVerificationCode } from "../../../utils/verification-tokens.js";
import type { RegisterInput } from "./schema.js";

export async function registerUser({ email, password }: RegisterInput) {
  const passwordHash = await Bun.password.hash(password);
  const verificationCode = createVerificationCode();
  const verificationTokenHash = await hashVerificationCode(verificationCode);

  try {
    const user = db
      .insert(users)
      .values({
        email,
        passwordHash,
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning({ id: users.id, email: users.email })
      .get();

    try {
      await enqueueVerificationEmail({ email, code: verificationCode });
    } catch (error) {
      db.delete(users).where(eq(users.id, user.id)).run();
      throw error;
    }

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return null;
    }
    throw error;
  }
}
