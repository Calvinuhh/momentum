import { Hono } from "hono";
import { createApiError } from "../../errors/api-error.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateJson } from "../../middleware/validation.js";
import { createWorkspaceSchema } from "./schema.js";
import { createWorkspace, getWorkspaceById, listWorkspaces } from "./service.js";

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

export default workspacesRouter;
