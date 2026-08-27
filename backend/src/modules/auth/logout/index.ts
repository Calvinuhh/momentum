import { Hono } from "hono";
import {
  clearSessionCookies,
  deleteRefreshFamily,
  getRefreshTokenCookie,
} from "../../../utils/session.js";

const logoutRouter = new Hono();

logoutRouter.post("/", async (c) => {
  const refreshToken = getRefreshTokenCookie(c);
  try {
    if (refreshToken) await deleteRefreshFamily(refreshToken);
  } finally {
    clearSessionCookies(c);
  }
  return c.body(null, 204);
});

export default logoutRouter;
