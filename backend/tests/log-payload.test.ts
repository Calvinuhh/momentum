import { describe, expect, test } from "bun:test";
import { captureBodyPreview, formatBodyPreview } from "../src/utils/log-payload.js";

describe("log payload previews", () => {
  test("formats JSON and redacts sensitive values", () => {
    const preview = formatBodyPreview(
      JSON.stringify({
        email: "calvin@example.com",
        password: "Secret1!",
        code: "6jRHqd",
        fid: "c12345678901234567890",
        nested: { accessToken: "token", ownerEmail: "owner@example.com" },
      }),
      "application/json",
    );

    expect(JSON.parse(preview)).toEqual({
      email: "c***@example.com",
      password: "[REDACTED]",
      code: "[REDACTED]",
      fid: "[REDACTED]",
      nested: { accessToken: "[REDACTED]", ownerEmail: "o***@example.com" },
    });
    expect(preview).not.toContain("\n");
    expect(preview).toContain("\"email\":\"c***@example.com\"");
  });

  test("omits malformed JSON instead of leaking its raw content", () => {
    expect(formatBodyPreview('{"password":"secret"', "application/json")).toBe(
      "[omitted: malformed JSON cannot be safely sanitized]",
    );
  });

  test("truncates sanitized previews at 4 KiB", () => {
    const preview = formatBodyPreview(JSON.stringify({ value: "a".repeat(5000) }), "application/json");

    expect(preview).toContain("... [truncated at 4 KiB]");
    expect(new TextEncoder().encode(preview).length).toBeLessThan(4200);
  });

  test("omits unsupported binary bodies", async () => {
    const response = new Response(new Uint8Array([1, 2, 3]), {
      headers: { "Content-Type": "application/octet-stream" },
    });

    expect(await captureBodyPreview(response)).toBe(
      "[omitted: unsupported content type application/octet-stream]",
    );
  });

  test("omits streaming responses", async () => {
    const response = new Response("data: message\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });

    expect(await captureBodyPreview(response)).toBe("[omitted: streaming response]");
  });
});
