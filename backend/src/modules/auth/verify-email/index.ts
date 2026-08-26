import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { verifyEmailSchema } from "./schema.js";
import { verifyUserEmail } from "./service.js";

const verifyEmailRouter = new Hono();

verifyEmailRouter.post("/", validateJson(verifyEmailSchema), async (c) => {
  const user = await verifyUserEmail(c.req.valid("json"));

  if (!user) {
    throw createApiError(400, "INVALID_EMAIL_VERIFICATION_CODE", "Invalid or expired verification code");
  }

  return c.json({ user });
});

export default verifyEmailRouter;
