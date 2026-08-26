import { describe, expect, test } from "bun:test";
import { createVerificationCode, hashVerificationCode } from "../src/utils/verification-tokens.js";

describe("email verification tokens", () => {
  test("creates six-character alphanumeric codes", () => {
    expect(createVerificationCode()).toMatch(/^[A-Za-z0-9]{6}$/);
  });

  test("hashes the same code deterministically without returning it", async () => {
    const hash = await hashVerificationCode("Ab12x9");
    expect(hash).toHaveLength(64);
    expect(hash).toBe(await hashVerificationCode("Ab12x9"));
    expect(hash).not.toContain("Ab12x9");
  });
});
