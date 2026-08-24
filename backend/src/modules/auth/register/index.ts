import { Hono } from "hono";
import { validateJson } from "../../../middleware/validation.js";
import { createApiError } from "../../../errors/api-error.js";
import { registerSchema } from "./schema.js";
import { registerUser } from "./service.js";

const registerRouter = new Hono();

registerRouter.post("/", validateJson(registerSchema), async (c) => {
  const user = await registerUser(c.req.valid("json"));

  if (!user) {
    throw createApiError(409, "EMAIL_ALREADY_REGISTERED", "Email already registered");
  }

  return c.json({ user }, 201);
});

export default registerRouter;
