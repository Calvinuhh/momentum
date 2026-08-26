import { describe, expect, test } from "bun:test";
import { createOpaqueToken, hashOpaqueToken } from "../src/utils/opaque-tokens.js";
import {
  isRecentRefreshRevocation,
  prepareRefreshSession,
  REFRESH_SESSION_TTL_MS,
} from "../src/utils/refresh-tokens.js";

describe("refresh tokens", () => {
  test("creates opaque tokens and hashes them deterministically", async () => {
    const token = createOpaqueToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await hashOpaqueToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(await hashOpaqueToken(token)).not.toBe(await hashOpaqueToken(createOpaqueToken()));
  });

  test("uses an absolute seven-day expiry and a short reuse grace period", async () => {
    const now = Date.now();
    const session = await prepareRefreshSession(now);

    expect(session.expiresAt.getTime()).toBe(now + REFRESH_SESSION_TTL_MS);
    expect(isRecentRefreshRevocation(new Date(now - 4_999), now)).toBe(true);
    expect(isRecentRefreshRevocation(new Date(now - 5_001), now)).toBe(false);
  });
});
