import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { memberships } from "../../../db/schema/memberships.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { enqueueWorkspaceInvitationEmail } from "../../../queue/email.js";
import { createInvitationToken, hashInvitationToken } from "../../../utils/invitation-tokens.js";
import type { CreateInvitationInput } from "./schema.js";

export async function createInvitation(
  workspaceId: string,
  inviterId: string,
  input: CreateInvitationInput,
) {
  const token = createInvitationToken();
  const tokenHash = await hashInvitationToken(token);

  let result;
  try {
    result = db.transaction((tx) => {
      const access = tx
        .select({ role: memberships.role, workspaceName: workspaces.name })
        .from(memberships)
        .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
        .where(
          and(
            eq(memberships.workspaceId, workspaceId),
            eq(memberships.userId, inviterId),
            isNull(workspaces.deletedAt),
          ),
        )
        .get();

      if (!access) return { kind: "not_found" as const };
      if (access.role === "MEMBER") return { kind: "forbidden" as const };

      const recipient = tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email))
        .get();

      if (recipient) {
        const membership = tx
          .select({ userId: memberships.userId })
          .from(memberships)
          .where(
            and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, recipient.id)),
          )
          .get();
        if (membership) return { kind: "already_member" as const };
      }

      const pending = tx
        .select({ id: invitations.id, expiresAt: invitations.expiresAt })
        .from(invitations)
        .where(
          and(
            eq(invitations.workspaceId, workspaceId),
            eq(invitations.email, input.email),
            isNull(invitations.acceptedAt),
          ),
        )
        .get();

      if (pending?.expiresAt && pending.expiresAt > new Date()) {
        return { kind: "already_pending" as const };
      }
      if (pending) tx.delete(invitations).where(eq(invitations.id, pending.id)).run();

      const invitation = tx
        .insert(invitations)
        .values({
          workspaceId,
          email: input.email,
          role: input.role,
          tokenHash,
          invitedBy: inviterId,
        })
        .returning({
          id: invitations.id,
          email: invitations.email,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
          createdAt: invitations.createdAt,
        })
        .get();

      return {
        kind: "created" as const,
        invitation,
        workspaceName: access.workspaceName,
        recipientExists: !!recipient,
      };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed") &&
      error.message.includes("invitations.workspace_id")
    ) {
      return { kind: "already_pending" as const };
    }
    throw error;
  }

  if (result.kind !== "created") return result;

  try {
    await enqueueWorkspaceInvitationEmail({
      email: result.invitation.email,
      invitationId: result.invitation.id,
      token,
      workspaceName: result.workspaceName,
      recipientExists: result.recipientExists,
    });
  } catch (error) {
    db.delete(invitations).where(eq(invitations.id, result.invitation.id)).run();
    throw error;
  }

  return result;
}
