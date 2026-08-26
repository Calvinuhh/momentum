import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { validateJson } from "../../../middleware/validation.js";
import { createInvitationSchema } from "./schema.js";
import { createInvitation } from "./service.js";

const createInvitationRouter = new Hono<{ Variables: { userId: string } }>();

createInvitationRouter.post("/", validateJson(createInvitationSchema), async (c) => {
  const workspaceId = c.req.param("id");
  if (!workspaceId) throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");

  const result = await createInvitation(workspaceId, c.get("userId"), c.req.valid("json"));

  if (result.kind === "not_found") {
    throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  }
  if (result.kind === "forbidden") {
    throw createApiError(403, "FORBIDDEN", "Only workspace owners and admins can invite members");
  }
  if (result.kind === "already_member") {
    throw createApiError(409, "USER_ALREADY_MEMBER", "This user is already a workspace member");
  }
  if (result.kind === "already_pending") {
    throw createApiError(409, "INVITATION_ALREADY_PENDING", "An active invitation already exists");
  }

  return c.json({ invitation: result.invitation }, 201);
});

export default createInvitationRouter;
