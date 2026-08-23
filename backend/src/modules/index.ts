import { Hono } from "hono";
import authRouter from "./auth";

export const router = new Hono();

router.route("/auth", authRouter)
