import { Hono } from "hono";
import authRouter from "./auth";
import workspacesRouter from "./workspaces/index.js";

export const router = new Hono();

router.route("/auth", authRouter);
router.route("/workspaces", workspacesRouter);
