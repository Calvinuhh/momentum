import { Hono } from "hono";
import acceptInvitationRouter from "./accept/index.js";
import previewInvitationRouter from "./preview/index.js";

const invitationsRouter = new Hono();

invitationsRouter.route("/accept", acceptInvitationRouter);
invitationsRouter.route("/preview", previewInvitationRouter);

export default invitationsRouter;
