import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { requireAuth } from "../../../middleware/auth.js";
import { validateJson } from "../../../middleware/validation.js";
import { previewInvitationSchema } from "./schema.js";
import { previewInvitation } from "./service.js";

const previewInvitationRouter = new Hono<{ Variables: { userId: string } }>();

previewInvitationRouter.post("/", requireAuth, validateJson(previewInvitationSchema), async (c) => {
  const result = await previewInvitation(c.req.valid("json"), c.get("userId"));

  if (result.kind === "invalid") {
    throw createApiError(400, "INVALID_INVITATION", "Invalid or expired invitation");
  }
  if (result.kind === "unauthorized") {
    throw createApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  if (result.kind === "email_mismatch") {
    throw createApiError(403, "INVITATION_EMAIL_MISMATCH", "This invitation belongs to another email");
  }

  return c.json({ invitation: result.invitation });
});

export default previewInvitationRouter;
