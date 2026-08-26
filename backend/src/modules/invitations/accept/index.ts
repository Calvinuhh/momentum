import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { requireAuth } from "../../../middleware/auth.js";
import { validateJson } from "../../../middleware/validation.js";
import { acceptInvitationSchema } from "./schema.js";
import { acceptInvitation } from "./service.js";

const acceptInvitationRouter = new Hono<{ Variables: { userId: string } }>();

acceptInvitationRouter.post("/", requireAuth, validateJson(acceptInvitationSchema), async (c) => {
  const result = await acceptInvitation(c.get("userId"), c.req.valid("json"));

  if (result.kind === "invalid") {
    throw createApiError(400, "INVALID_INVITATION", "Invalid or expired invitation");
  }
  if (result.kind === "email_mismatch") {
    throw createApiError(403, "INVITATION_EMAIL_MISMATCH", "This invitation belongs to another email");
  }

  return c.json({ workspace: result.workspace });
});

export default acceptInvitationRouter;
