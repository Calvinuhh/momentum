import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { setAccessTokenCookie } from "../../../utils/session.js";
import { claimInvitationSchema } from "./schema.js";
import { claimInvitation } from "./service.js";

const claimInvitationRouter = new Hono();

claimInvitationRouter.post("/", validateJson(claimInvitationSchema), async (c) => {
  const result = await claimInvitation(c.req.valid("json"));

  if (result.kind === "invalid") {
    throw createApiError(400, "INVALID_INVITATION", "Invalid or expired invitation");
  }
  if (result.kind === "account_exists") {
    throw createApiError(409, "ACCOUNT_ALREADY_EXISTS", "Log in to accept this invitation");
  }

  await setAccessTokenCookie(c, result.user.id);
  return c.json({ user: result.user, workspace: result.workspace }, 201);
});

export default claimInvitationRouter;
