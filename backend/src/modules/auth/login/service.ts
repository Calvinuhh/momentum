import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema/index.js";
import { env } from "../../../config/env.js";
import type { LoginInput } from "./schema.js";
import type { LoginResult } from "./types.js";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function authenticateUser({ email, password }: LoginInput): Promise<LoginResult> {
  const user = db.select().from(users).where(eq(users.email, email)).get();
  const validPassword = user ? await Bun.password.verify(password, user.passwordHash) : false;

  if (!user || !validPassword) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  return { ok: true, user: { id: user.id, email: user.email } };
}

export function createAccessToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return sign(
    {
      sub: userId,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    },
    env.JWT_SECRET,
    "HS256",
  );
}
