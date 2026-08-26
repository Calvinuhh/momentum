import { Hono } from "hono";
import {
  clearSessionCookies,
  getRefreshTokenCookie,
  revokeRefreshFamily,
} from "../../../utils/session.js";

const logoutRouter = new Hono();

logoutRouter.post("/", async (c) => {
  const refreshToken = getRefreshTokenCookie(c);
  try {
    if (refreshToken) await revokeRefreshFamily(refreshToken);
  } finally {
    clearSessionCookies(c);
  }
  return c.body(null, 204);
});

export default logoutRouter;
