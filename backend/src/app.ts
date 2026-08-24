import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { router } from "./modules/index.js";
import { requestLogger } from "./middleware/logger.js";

export const app = new Hono();

app.use("*", requestLogger);
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
  }),
);

app.get("/api/v1/health", (c) => c.json({ status: "ok", env: env.NODE_ENV, uptime: process.uptime() }));

app.route("/api/v1", router);

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));

app.onError((err, c) => {
  console.error(err);
  const status = 500;
  const message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return c.json({ error: { code: "INTERNAL_ERROR", message } }, status);
});
