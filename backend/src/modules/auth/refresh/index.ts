import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import {
  clearSessionCookies,
  getRefreshTokenCookie,
  rotateRefreshSession,
  setSessionCookies,
} from "../../../utils/session.js";

const refreshRouter = new Hono();

refreshRouter.post("/", async (c) => {
  const token = getRefreshTokenCookie(c);
  const result = token ? await rotateRefreshSession(token) : { kind: "invalid" as const };
  if (result.kind === "retry") {
    throw createApiError(409, "REFRESH_RETRY", "Session refresh already in progress");
  }
  if (result.kind !== "rotated") {
    clearSessionCookies(c);
    throw createApiError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
  }

  await setSessionCookies(c, result.userId, result.token, result.expiresAt);
  return c.body(null, 204);
});

export default refreshRouter;
