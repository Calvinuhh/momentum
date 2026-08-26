import { Hono } from "hono";
import acceptInvitationRouter from "./accept/index.js";
import claimInvitationRouter from "./claim/index.js";

const invitationsRouter = new Hono();

invitationsRouter.route("/accept", acceptInvitationRouter);
invitationsRouter.route("/claim", claimInvitationRouter);

export default invitationsRouter;
