import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth.js";
import notificationRouter from "./notification/index.js";
import pushInstallationRouter from "./push-installation/index.js";

const notificationsRouter = new Hono<{ Variables: { userId: string } }>();

notificationsRouter.use("*", requireAuth);
notificationsRouter.route("/installations", pushInstallationRouter);
notificationsRouter.route("/", notificationRouter);

export default notificationsRouter;
