import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { setAccessTokenCookie } from "../../../utils/session.js";
import { loginSchema } from "./schema.js";
import { authenticateUser } from "./service.js";

const loginRouter = new Hono();

loginRouter.post("/", validateJson(loginSchema), async (c) => {
  const user = await authenticateUser(c.req.valid("json"));

  if (!user) {
    throw createApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");
  }

  if ("unverified" in user) {
    throw createApiError(403, "EMAIL_NOT_VERIFIED", "Please verify your email before logging in");
  }

  await setAccessTokenCookie(c, user.id);

  return c.json({ user });
});

export default loginRouter;
