import type { Context } from "hono";
import { and, eq, inArray, isNull, lte, notInArray, or } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { pushInstallations } from "../db/schema/push-installations.js";
import { refreshTokens } from "../db/schema/refresh-tokens.js";
import { createOpaqueToken, hashOpaqueToken } from "./opaque-tokens.js";
import { isRecentRefreshRevocation, prepareRefreshSession } from "./refresh-tokens.js";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_PATH = "/api/v1";

type SessionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function setAccessTokenCookie(c: Context, userId: string, sessionExpiresAt: Date) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = Math.min(
    ACCESS_TOKEN_TTL_SECONDS,
    Math.floor(sessionExpiresAt.getTime() / 1000) - now,
  );
  if (maxAge <= 0) throw new Error("Session expired");
  const token = await sign(
    { sub: userId, iat: now, exp: now + maxAge },
    env.JWT_SECRET,
    "HS256",
  );

  setCookie(c, "access_token", token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}

function setRefreshTokenCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    maxAge: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    path: REFRESH_TOKEN_PATH,
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}

export function getRefreshTokenCookie(c: Context): string | undefined {
  return getCookie(c, REFRESH_TOKEN_COOKIE);
}

export function clearSessionCookies(c: Context) {
  deleteCookie(c, "access_token", { path: "/", secure: env.NODE_ENV === "production" });
  deleteCookie(c, REFRESH_TOKEN_COOKIE, {
    path: REFRESH_TOKEN_PATH,
    secure: env.NODE_ENV === "production",
  });
}

export async function setSessionCookies(
  c: Context,
  userId: string,
  refreshToken: string,
  expiresAt: Date,
) {
  await setAccessTokenCookie(c, userId, expiresAt);
  setRefreshTokenCookie(c, refreshToken, expiresAt);
}

export async function deleteRefreshFamily(token: string) {
  const tokenHash = await hashOpaqueToken(token);
  db.transaction((tx) => {
    const current = tx
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .get();

    if (current) {
      tx.delete(pushInstallations).where(eq(pushInstallations.familyId, current.familyId)).run();
      tx.delete(refreshTokens).where(eq(refreshTokens.familyId, current.familyId)).run();
    }
  });
}

export async function withCurrentRefreshFamily(
  token: string | undefined,
  userId: string,
  operation: (tx: SessionTransaction, familyId: string) => void,
): Promise<boolean> {
  if (!token) return false;
  const tokenHash = await hashOpaqueToken(token);

  return db.transaction((tx) => {
    const current = tx
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .get();
    if (!current || current.userId !== userId || current.revokedAt) return false;
    if (current.expiresAt <= new Date()) {
      tx.delete(pushInstallations).where(eq(pushInstallations.familyId, current.familyId)).run();
      tx.delete(refreshTokens).where(eq(refreshTokens.familyId, current.familyId)).run();
      return false;
    }

    operation(tx, current.familyId);
    return true;
  });
}

export async function startSession(c: Context, userId: string) {
  const currentToken = getRefreshTokenCookie(c);
  const currentTokenHash = currentToken ? await hashOpaqueToken(currentToken) : undefined;
  const session = await prepareRefreshSession();

  db.transaction((tx) => {
    if (currentTokenHash) {
      const current = tx
        .select({ familyId: refreshTokens.familyId })
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, currentTokenHash))
        .get();
      if (current) {
        tx.delete(pushInstallations).where(eq(pushInstallations.familyId, current.familyId)).run();
        tx.delete(refreshTokens).where(eq(refreshTokens.familyId, current.familyId)).run();
      }
    }

    const activeFamilies = tx
      .selectDistinct({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(isNull(refreshTokens.revokedAt));
    const staleFamilies = tx
      .selectDistinct({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(
        or(
          lte(refreshTokens.expiresAt, new Date()),
          notInArray(refreshTokens.familyId, activeFamilies),
        ),
      );
    tx.delete(pushInstallations)
      .where(inArray(pushInstallations.familyId, staleFamilies))
      .run();
    tx.delete(refreshTokens)
      .where(
        or(
          lte(refreshTokens.expiresAt, new Date()),
          notInArray(refreshTokens.familyId, activeFamilies),
        ),
      )
      .run();
    tx.insert(refreshTokens)
      .values({
        userId,
        familyId: session.familyId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      })
      .run();
  });

  await setSessionCookies(c, userId, session.token, session.expiresAt);
}

export async function rotateRefreshSession(token: string) {
  const tokenHash = await hashOpaqueToken(token);
  const nextToken = createOpaqueToken();
  const nextTokenHash = await hashOpaqueToken(nextToken);
  const now = new Date();

  return db.transaction((tx) => {
    const current = tx
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .get();

    if (!current) {
      return { kind: "invalid" as const };
    }
    if (Math.floor(current.expiresAt.getTime() / 1000) <= Math.floor(now.getTime() / 1000)) {
      tx.delete(pushInstallations).where(eq(pushInstallations.familyId, current.familyId)).run();
      tx.delete(refreshTokens).where(eq(refreshTokens.familyId, current.familyId)).run();
      return { kind: "invalid" as const };
    }

    if (current.revokedAt) {
      if (isRecentRefreshRevocation(current.revokedAt, now.getTime())) {
        return { kind: "retry" as const };
      }

      tx.update(refreshTokens)
        .set({ revokedAt: now })
        .where(and(eq(refreshTokens.familyId, current.familyId), isNull(refreshTokens.revokedAt)))
        .run();
      tx.delete(pushInstallations).where(eq(pushInstallations.familyId, current.familyId)).run();
      return { kind: "reused" as const };
    }

    const rotated = tx
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(and(eq(refreshTokens.tokenHash, current.tokenHash), isNull(refreshTokens.revokedAt)))
      .returning({ tokenHash: refreshTokens.tokenHash })
      .get();

    if (!rotated) return { kind: "retry" as const };

    tx.insert(refreshTokens)
      .values({
        userId: current.userId,
        familyId: current.familyId,
        tokenHash: nextTokenHash,
        expiresAt: current.expiresAt,
      })
      .run();

    return {
      kind: "rotated" as const,
      userId: current.userId,
      token: nextToken,
      expiresAt: current.expiresAt,
    };
  });
}
