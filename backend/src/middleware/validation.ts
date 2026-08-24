import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { apiErrorBody } from "../errors/api-error.js";

function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;

  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "application/json" || mediaType?.endsWith("+json") === true;
}

export function validateJson<T extends ZodType>(schema: T) {
  const validator = zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(
        apiErrorBody({
          code: "VALIDATION_ERROR",
          message: "The provided data is invalid",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        }),
        400,
      );
    }
  });

  return async (c: Parameters<typeof validator>[0], next: Parameters<typeof validator>[1]) => {
    if (!isJsonContentType(c.req.header("content-type"))) {
      return c.json(
        apiErrorBody({
          code: "JSON_REQUIRED",
          message: "A JSON request body is required",
        }),
        415,
      );
    }

    const body = await c.req.text();

    if (!body.trim()) {
      return c.json(
        apiErrorBody({
          code: "EMPTY_JSON_BODY",
          message: "The JSON request body must not be empty",
        }),
        400,
      );
    }

    try {
      JSON.parse(body);
    } catch {
      return c.json(
        apiErrorBody({
          code: "BAD_JSON",
          message: "Malformed JSON request body",
        }),
        400,
      );
    }

    return validator(c, next);
  };
}
