import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { invitations } from "../../../db/schema/invitations.js";
import { memberships } from "../../../db/schema/memberships.js";
import { users } from "../../../db/schema/users.js";
import { workspaces } from "../../../db/schema/workspaces.js";
import { hashInvitationToken } from "../../../utils/invitation-tokens.js";
import type { ClaimInvitationInput } from "./schema.js";

export async function claimInvitation({ token, password }: ClaimInvitationInput) {
  const tokenHash = await hashInvitationToken(token);
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

  try {
    return db.transaction((tx) => {
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

      return {
        kind: "claimed" as const,
        user,
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
