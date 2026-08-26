import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { memberships } from "../../../db/schema/memberships.js";
import { refreshTokens } from "../../../db/schema/refresh-tokens.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashInvitationToken } from "../../../utils/invitation-tokens.js";
import { hashOpaqueToken } from "../../../utils/opaque-tokens.js";
import { prepareRefreshSession } from "../../../utils/refresh-tokens.js";
import type { ClaimInvitationInput } from "./schema.js";

export async function claimInvitation(
  { token, password }: ClaimInvitationInput,
  currentRefreshToken?: string,
) {
  const tokenHash = await hashInvitationToken(token);
  const currentRefreshTokenHash = currentRefreshToken
    ? await hashOpaqueToken(currentRefreshToken)
    : undefined;
  const invitation = db
    .select({
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      workspaceDeletedAt: workspaces.deletedAt,
    })
    .from(invitations)
    .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
    .where(eq(invitations.tokenHash, tokenHash))
    .get();

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date() ||
    invitation.workspaceDeletedAt
  ) {
    return { kind: "invalid" as const };
  }
  if (db.select({ id: users.id }).from(users).where(eq(users.email, invitation.email)).get()) {
    return { kind: "account_exists" as const };
  }

  const passwordHash = await Bun.password.hash(password);
  const session = await prepareRefreshSession();

  try {
    return db.transaction((tx) => {
      if (
        currentRefreshTokenHash &&
        tx
          .select({ tokenHash: refreshTokens.tokenHash })
          .from(refreshTokens)
          .where(
            and(
              eq(refreshTokens.tokenHash, currentRefreshTokenHash),
              gt(refreshTokens.expiresAt, new Date()),
              isNull(refreshTokens.revokedAt),
            ),
          )
          .get()
      ) {
        return { kind: "active_session" as const };
      }

      const current = tx
        .select({
          id: invitations.id,
          email: invitations.email,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
          workspaceId: workspaces.id,
          workspaceName: workspaces.name,
          workspaceDeletedAt: workspaces.deletedAt,
        })
        .from(invitations)
        .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
        .where(eq(invitations.tokenHash, tokenHash))
        .get();

      if (
        !current ||
        current.acceptedAt ||
        current.expiresAt <= new Date() ||
        current.workspaceDeletedAt
      ) {
        return { kind: "invalid" as const };
      }
      if (tx.select({ id: users.id }).from(users).where(eq(users.email, current.email)).get()) {
        return { kind: "account_exists" as const };
      }

      const user = tx
        .insert(users)
        .values({ email: current.email, passwordHash, emailVerifiedAt: new Date() })
        .returning({ id: users.id, email: users.email })
        .get();

      tx.insert(memberships)
        .values({ userId: user.id, workspaceId: current.workspaceId, role: current.role })
        .run();
      tx.update(invitations)
        .set({ acceptedAt: new Date() })
        .where(eq(invitations.id, current.id))
        .run();
      tx.insert(refreshTokens)
        .values({
          userId: user.id,
          familyId: session.familyId,
          tokenHash: session.tokenHash,
          expiresAt: session.expiresAt,
        })
        .run();

      return {
        kind: "claimed" as const,
        user,
        session,
        workspace: { id: current.workspaceId, name: current.workspaceName },
      };
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed: users.email")) {
      return { kind: "account_exists" as const };
    }
    throw error;
  }
}
