import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { env } from "../config/env.js";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function setAccessTokenCookie(c: Context, userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: userId, iat: now, exp: now + ACCESS_TOKEN_TTL_SECONDS },
    env.JWT_SECRET,
    "HS256",
  );

  setCookie(c, "access_token", token, {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}
