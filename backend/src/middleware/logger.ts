import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { cloneRawRequest } from "hono/request";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { captureBodyPreview } from "../utils/log-payload.js";

const REQUEST_BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);
const RESPONSE_BODY_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

async function requestDetails(c: Context): Promise<string> {
  const sections: string[] = [];

  if (REQUEST_BODY_METHODS.has(c.req.method)) {
    try {
      const request = await cloneRawRequest(c.req);
      sections.push(`Request body: ${await captureBodyPreview(request)}`);
    } catch {
      sections.push("Request body: [unavailable]");
    }
  }

  if (RESPONSE_BODY_METHODS.has(c.req.method)) {
    try {
      sections.push(
        `Response body: ${await captureBodyPreview(c.res.clone())}`,
      );
    } catch {
      sections.push("Response body: [unavailable]");
    }
  }

  return sections.join("\n");
}

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const level =
    c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info";
  // In production, the first forwarded IP is the client; development omits this PII.
  const ip =
    env.NODE_ENV === "production"
      ? (c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown")
      : undefined;
  const base = `${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`;
  const line = base;
  const meta = ip ? { ip } : undefined;
  const fileDetails = await requestDetails(c);
  if (level === "error") logger.error(line, meta, fileDetails);
  else if (level === "warn") logger.warn(line, meta, fileDetails);
  else logger.info(line, meta, fileDetails);
});
