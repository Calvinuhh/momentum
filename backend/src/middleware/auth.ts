import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Context } from "hono";
import { env } from "../config/env.js";
import { createApiError } from "../errors/api-error.js";

function getToken(c: Context): string | undefined {
  const cookie = getCookie(c, "access_token");
  if (cookie) return cookie;
  const header = c.req.header("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return undefined;
}

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getToken(c);
  if (!token) {
    throw createApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    const userId = (payload as { sub?: unknown }).sub;
    if (typeof userId !== "string" || !userId) throw new Error();
    c.set("userId", userId);
  } catch {
    throw createApiError(401, "UNAUTHORIZED", "Invalid or expired token");
  }

  await next();
});
