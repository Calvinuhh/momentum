import { Hono } from "hono";
import { createApiError } from "../../../errors/api-error.js";
import { requireAuth } from "../../../middleware/auth.js";
import { validateJson } from "../../../middleware/validation.js";
import createInvitationRouter from "../../invitations/create/index.js";
import { createWorkspaceSchema } from "./schema.js";
import { createWorkspace, getWorkspaceById, hardDeleteWorkspace, listWorkspaces } from "./service.js";

const workspaceRouter = new Hono<{ Variables: { userId: string } }>();

// All workspace routes require authentication
workspaceRouter.use("*", requireAuth);
workspaceRouter.route("/:id/invitations", createInvitationRouter);

workspaceRouter.post("/", validateJson(createWorkspaceSchema), async (c) => {
  const userId = c.get("userId");
  const input = c.req.valid("json");
  const workspace = createWorkspace(userId, input);
  return c.json({ workspace }, 201);
});

workspaceRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const items = listWorkspaces(userId);
  return c.json({ workspaces: items });
});

workspaceRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const workspace = getWorkspaceById(id, userId);
  if (!workspace) {
    throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  }
  return c.json({ workspace });
});

// Permanent deletion is intentionally backend-only; the frontend does not expose this action.
workspaceRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const deleted = hardDeleteWorkspace(id, userId);

  if (!deleted) {
    throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  }

  return c.body(null, 204);
});

export default workspaceRouter;
