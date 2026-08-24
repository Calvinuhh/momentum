import { deleteCookie } from "hono/cookie";
import { Hono } from "hono";
import { env } from "../../../config/env.js";

const logoutRouter = new Hono();

logoutRouter.post("/", (c) => {
  deleteCookie(c, "access_token", {
    path: "/",
    secure: env.NODE_ENV === "production",
  });
  return c.body(null, 204);
});

export default logoutRouter;
