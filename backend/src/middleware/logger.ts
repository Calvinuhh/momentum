import type { Context, Next } from "hono";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const level = c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info";
  // ponytail: en prod tomamos x-forwarded-for (primera IP = cliente real), en dev omitimos PII
  const ip =
    env.NODE_ENV === "production"
      ? (c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
      : undefined;
  const base = `${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`;
  const line = ip ? `${base} ip=${ip}` : base;
  const meta = ip ? { ip } : undefined;
  if (level === "error") logger.error(line, meta);
  else if (level === "warn") logger.warn(line, meta);
  else logger.info(line, meta);
}
