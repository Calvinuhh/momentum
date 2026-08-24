import { Hono } from "hono";
import loginRouter from "./login/index.js";
import logoutRouter from "./logout/index.js";
import registerRouter from "./register/index.js";

const authRouter = new Hono();

authRouter.route("/register", registerRouter);
authRouter.route("/login", loginRouter);
authRouter.route("/logout", logoutRouter);

export default authRouter;
