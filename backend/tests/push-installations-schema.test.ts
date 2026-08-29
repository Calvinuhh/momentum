import { describe, expect, test } from "bun:test";
import { pushInstallationSchema } from "../src/modules/notifications/push-installation/schema.js";

describe("push installation schema", () => {
  test("accepts VAPID subscriptions and rejects malformed or ambiguous input", () => {
    expect(
      pushInstallationSchema.safeParse({
        endpoint: "https://example.com/push/abc",
        p256dh: "a".repeat(87),
        auth: "a".repeat(22),
        userId: "a".repeat(24),
      }).success,
    ).toBe(true);
    expect(
      pushInstallationSchema.safeParse({
        endpoint: "http://example.com/push/abc",
        p256dh: "a".repeat(87),
        auth: "a".repeat(22),
        userId: "a".repeat(24),
      }).success,
    ).toBe(false);
    expect(
      pushInstallationSchema.safeParse({
        endpoint: "https://example.com/push/abc",
        p256dh: "a".repeat(87),
        auth: "a".repeat(22),
        userId: "a".repeat(24),
        unexpected: true,
      }).success,
    ).toBe(false);
  });
});
