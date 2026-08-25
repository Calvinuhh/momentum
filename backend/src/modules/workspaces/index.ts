import { Hono } from "hono";
import { createApiError } from "../../errors/api-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateJson } from "../../middleware/validation.js";
import { createWorkspaceSchema } from "./schema.js";
import { createWorkspace, getWorkspaceById, hardDeleteWorkspace, listWorkspaces } from "./service.js";

const workspacesRouter = new Hono<{ Variables: { userId: string } }>();

// All workspace routes require authentication
workspacesRouter.use("*", requireAuth);

workspacesRouter.post("/", validateJson(createWorkspaceSchema), async (c) => {
  const userId = c.get("userId");
  const input = c.req.valid("json");
  const workspace = createWorkspace(userId, input);
  return c.json({ workspace }, 201);
});

workspacesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const items = listWorkspaces(userId);
  return c.json({ workspaces: items });
});

workspacesRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const workspace = getWorkspaceById(id, userId);
  if (!workspace) {
    throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  }
  return c.json({ workspace });
});

// Permanent deletion is intentionally backend-only; the frontend does not expose this action.
workspacesRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const deleted = hardDeleteWorkspace(id, userId);

  if (!deleted) {
    throw createApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  }

  return c.body(null, 204);
});

export default workspacesRouter;
