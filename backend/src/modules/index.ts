import { Hono } from "hono";
import authRouter from "./auth";
import invitationsRouter from "./invitations/index.js";
import workspacesRouter from "./workspaces/index.js";

export const router = new Hono();

router.route("/auth", authRouter);
router.route("/invitations", invitationsRouter);
router.route("/workspaces", workspacesRouter);
