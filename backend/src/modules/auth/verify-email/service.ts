import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/users.js";
import { hashVerificationCode } from "./tokens.js";
import type { VerifyEmailInput } from "./schema.js";

export async function verifyUserEmail({ email, code }: VerifyEmailInput) {
  const tokenHash = await hashVerificationCode(code);

  return db
    .update(users)
    .set({
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    })
    .where(
      and(
        eq(users.email, email),
        eq(users.emailVerificationTokenHash, tokenHash),
        gt(users.emailVerificationExpiresAt, new Date()),
        isNull(users.emailVerifiedAt),
      ),
    )
    .returning({ id: users.id, email: users.email })
    .get();
}
