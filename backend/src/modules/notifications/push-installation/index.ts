import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { getRefreshTokenCookie } from "../../../utils/session.js";
import { deletePushInstallationSchema, pushInstallationSchema } from "./schema.js";
import { deletePushInstallation, registerPushInstallation } from "./service.js";

const pushInstallationRouter = new Hono<{ Variables: { userId: string } }>();

function invalidRefreshToken() {
  return createApiError(401, "INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
}

pushInstallationRouter.put("/", validateJson(pushInstallationSchema), async (c) => {
  const registered = await registerPushInstallation(
    c.get("userId"),
    getRefreshTokenCookie(c),
    c.req.valid("json"),
  );
  if (!registered) throw invalidRefreshToken();
  return c.body(null, 204);
});

pushInstallationRouter.delete("/", validateJson(deletePushInstallationSchema), async (c) => {
  const deleted = await deletePushInstallation(
    c.get("userId"),
    getRefreshTokenCookie(c),
    c.req.valid("json"),
  );
  if (!deleted) throw invalidRefreshToken();
  return c.body(null, 204);
});

export default pushInstallationRouter;
