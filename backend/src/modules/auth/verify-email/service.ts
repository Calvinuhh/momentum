import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { notifications } from "../../../db/schema/notifications.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashVerificationCode } from "../../../utils/verification-tokens.js";
import type { VerifyEmailInput } from "./schema.js";

export async function verifyUserEmail({ email, code }: VerifyEmailInput) {
  const tokenHash = await hashVerificationCode(code);

  return db.transaction((tx) => {
    const user = tx
      .update(users)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      })
      .where(
        and(
          eq(users.email, email),
          eq(users.emailVerificationTokenHash, tokenHash),
          gt(users.emailVerificationExpiresAt, new Date()),
          isNull(users.emailVerifiedAt),
        ),
      )
      .returning({ id: users.id, email: users.email })
      .get();
    if (!user) return undefined;

    const pendingInvitations = tx
      .select({
        id: invitations.id,
        workspaceId: invitations.workspaceId,
        workspaceName: workspaces.name,
        inviterEmail: users.email,
      })
      .from(invitations)
      .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
      .innerJoin(users, eq(users.id, invitations.invitedBy))
      .where(
        and(
          eq(invitations.email, user.email),
          gt(invitations.expiresAt, new Date()),
          isNull(invitations.acceptedAt),
          isNull(workspaces.deletedAt),
        ),
      )
      .all();

    if (pendingInvitations.length) {
      tx.insert(notifications)
        .values(
          pendingInvitations.map((invitation) => ({
            userId: user.id,
            workspaceId: invitation.workspaceId,
            type: "WORKSPACE_INVITATION" as const,
            resourceId: invitation.id,
            title: "Workspace invitation",
            body: `${invitation.inviterEmail} invited you to join ${invitation.workspaceName}.`,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    return user;
  });
}
