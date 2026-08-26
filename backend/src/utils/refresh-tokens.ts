import { createId } from "@paralleldrive/cuid2";
import { createOpaqueToken, hashOpaqueToken } from "./opaque-tokens.js";

export const REFRESH_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_REUSE_GRACE_MS = 5 * 1000;

export async function prepareRefreshSession(now?: number) {
  const token = createOpaqueToken();
  const tokenHash = await hashOpaqueToken(token);

  return {
    familyId: createId(),
    token,
    tokenHash,
    expiresAt: new Date((now ?? Date.now()) + REFRESH_SESSION_TTL_MS),
  };
}

export function isRecentRefreshRevocation(revokedAt: Date, now = Date.now()): boolean {
  const age = now - revokedAt.getTime();
  return age >= 0 && age <= REFRESH_REUSE_GRACE_MS;
}
