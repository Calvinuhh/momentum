import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashInvitationToken } from "../../../utils/invitation-tokens.js";
import type { InvitationReference } from "./schema.js";

export async function previewInvitation(reference: InvitationReference, userId: string) {
  const currentUser = db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (!currentUser) return { kind: "unauthorized" as const };

  const condition = "token" in reference
    ? eq(invitations.tokenHash, await hashInvitationToken(reference.token))
    : eq(invitations.id, reference.invitationId);
  const invitation = db
    .select({
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceDeletedAt: workspaces.deletedAt,
      inviterEmail: users.email,
    })
    .from(invitations)
    .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
    .innerJoin(users, eq(users.id, invitations.invitedBy))
    .where(condition)
    .get();

  if (
    !invitation ||
    invitation.workspaceDeletedAt ||
    (!invitation.acceptedAt && invitation.expiresAt <= new Date())
  ) {
    return { kind: "invalid" as const };
  }

  if (currentUser.email !== invitation.email) {
    return { kind: "email_mismatch" as const };
  }

  return {
    kind: "ok" as const,
    invitation: {
      workspace: { id: invitation.workspaceId, name: invitation.workspaceName },
      inviterEmail: invitation.inviterEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      eligibility: invitation.acceptedAt ? ("accepted" as const) : ("accept" as const),
    },
  };
}
