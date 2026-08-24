import { setCookie } from "hono/cookie";
import { Hono } from "hono";
import { env } from "../../../config/env.js";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { loginSchema } from "./schema.js";
import { authenticateUser, createAccessToken } from "./service.js";

const loginRouter = new Hono();

loginRouter.post("/", validateJson(loginSchema), async (c) => {
  const result = await authenticateUser(c.req.valid("json"));

  if (!result.ok) {
    throw createApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  const token = await createAccessToken(result.user.id);

  setCookie(c, "access_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });

  return c.json({ user: result.user });
});

export default loginRouter;
