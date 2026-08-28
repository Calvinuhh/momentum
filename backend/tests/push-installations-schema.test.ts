import { describe, expect, test } from "bun:test";
import { pushInstallationSchema } from "../src/modules/notifications/push-installation/schema.js";

describe("push installation schema", () => {
  test("accepts current FIDs and rejects malformed or ambiguous input", () => {
    expect(
      pushInstallationSchema.safeParse({
        fid: `c${"a".repeat(21)}`,
        userId: "a".repeat(24),
      }).success,
    ).toBe(true);
    expect(
      pushInstallationSchema.safeParse({
        fid: `c${"a".repeat(21)} `,
        userId: "a".repeat(24),
      }).success,
    ).toBe(false);
    expect(
      pushInstallationSchema.safeParse({
        fid: `c${"a".repeat(21)}`,
        userId: "a".repeat(24),
        unexpected: true,
      }).success,
    ).toBe(false);
  });
});
