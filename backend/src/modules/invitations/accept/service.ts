import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { memberships } from "../../../db/schema/memberships.js";
import { notifications } from "../../../db/schema/notifications.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashInvitationToken } from "../../../utils/invitation-tokens.js";
import type { AcceptInvitationInput } from "./schema.js";

export async function acceptInvitation(userId: string, reference: AcceptInvitationInput) {
  const condition = "token" in reference
    ? eq(invitations.tokenHash, await hashInvitationToken(reference.token))
    : eq(invitations.id, reference.invitationId);

  return db.transaction((tx) => {
    const user = tx.select({ email: users.email }).from(users).where(eq(users.id, userId)).get();
    const invitation = tx
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
      .where(condition)
      .get();

    if (!user || !invitation || invitation.workspaceDeletedAt) {
      return { kind: "invalid" as const };
    }
    if (user.email !== invitation.email) return { kind: "email_mismatch" as const };

    const workspace = { id: invitation.workspaceId, name: invitation.workspaceName };
    const acceptedAt = new Date();
    if (!invitation.acceptedAt) {
      if (invitation.expiresAt <= acceptedAt) return { kind: "invalid" as const };

      tx.insert(memberships)
        .values({ userId, workspaceId: invitation.workspaceId, role: invitation.role })
        .onConflictDoNothing()
        .run();
      tx.update(invitations)
        .set({ acceptedAt })
        .where(eq(invitations.id, invitation.id))
        .run();
    }

    tx.update(notifications)
      .set({ readAt: acceptedAt })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "WORKSPACE_INVITATION"),
          eq(notifications.resourceId, invitation.id),
          isNull(notifications.readAt),
        ),
      )
      .run();

    return { kind: "accepted" as const, workspace };
  });
}
