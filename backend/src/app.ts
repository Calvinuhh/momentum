import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { env } from "./config/env.js";
import { router } from "./modules/index.js";
import { requestLogger } from "./middleware/logger.js";
import { logger } from "./utils/logger.js";
import { apiErrorBody, isApiError } from "./errors/api-error.js";

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

app.get("/api/v1/health", (c) => c.json({ status: "ok", env: env.NODE_ENV }));

app.route("/api/v1", router);

app.notFound((c) => c.json({ error: { code: "NOT_FOUND", message: "Not found" } }, 404));

app.onError((err, c) => {
  if (isApiError(err)) {
    return c.json(apiErrorBody(err), err.status);
  }
  if (err instanceof HTTPException) {
    return c.json(apiErrorBody({ code: "HTTP_ERROR", message: err.message }), err.status);
  }
  if (err instanceof SyntaxError) {
    return c.json(apiErrorBody({ code: "BAD_JSON", message: "Malformed JSON request body" }), 400);
  }
  logger.error(err.message, { stack: err.stack });
  const message = env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
  return c.json({ error: { code: "INTERNAL_ERROR", message } }, 500);
});
