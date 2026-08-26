import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { memberships } from "../../../db/schema/memberships.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashInvitationToken } from "../../../utils/invitation-tokens.js";
import type { AcceptInvitationInput } from "./schema.js";

export async function acceptInvitation(userId: string, { token }: AcceptInvitationInput) {
  const tokenHash = await hashInvitationToken(token);

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
      .where(eq(invitations.tokenHash, tokenHash))
      .get();

    if (!user || !invitation || invitation.workspaceDeletedAt) {
      return { kind: "invalid" as const };
    }
    if (user.email !== invitation.email) return { kind: "email_mismatch" as const };

    const workspace = { id: invitation.workspaceId, name: invitation.workspaceName };
    if (invitation.acceptedAt) return { kind: "accepted" as const, workspace };
    if (invitation.expiresAt <= new Date()) return { kind: "invalid" as const };

    tx.insert(memberships)
      .values({ userId, workspaceId: invitation.workspaceId, role: invitation.role })
      .onConflictDoNothing()
      .run();
    tx.update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitation.id))
      .run();

    return { kind: "accepted" as const, workspace };
  });
}
