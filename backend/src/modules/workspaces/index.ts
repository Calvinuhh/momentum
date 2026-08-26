import { Hono } from "hono";
import workspaceRouter from "./workspace/index.js";

const workspacesRouter = new Hono();

workspacesRouter.route("/", workspaceRouter);

export default workspacesRouter;
