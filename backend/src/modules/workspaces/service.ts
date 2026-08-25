import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { invitations } from "../../db/schema/invitations.js";
import { memberships } from "../../db/schema/memberships.js";
import { workspaces } from "../../db/schema/workspaces.js";
import type { CreateWorkspaceInput } from "./schema.js";

export function createWorkspace(ownerId: string, input: CreateWorkspaceInput) {
  const workspace = db
    .insert(workspaces)
    .values({
      name: input.name,
      description: input.description ?? null,
      ownerId,
    })
    .returning()
    .get();

  db.insert(memberships)
    .values({
      userId: ownerId,
      workspaceId: workspace.id,
      role: "OWNER",
    })
    .run();

  return workspace;
}

export function listWorkspaces(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
    })
    .from(workspaces)
    .innerJoin(memberships, and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, userId)))
    .where(isNull(workspaces.deletedAt))
    .all();
}

export function getWorkspaceById(workspaceId: string, userId: string) {
  const row = db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      description: workspaces.description,
      ownerId: workspaces.ownerId,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      role: memberships.role,
    })
    .from(workspaces)
    .innerJoin(memberships, and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, userId)))
    .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)))
    .get();

  return row ?? null;
}

export function hardDeleteWorkspace(workspaceId: string, userId: string) {
  return db.transaction((tx) => {
    const ownedWorkspace = tx
      .select({ id: workspaces.id })
      .from(workspaces)
      .innerJoin(
        memberships,
        and(
          eq(memberships.workspaceId, workspaces.id),
          eq(memberships.userId, userId),
          eq(memberships.role, "OWNER"),
        ),
      )
      .where(eq(workspaces.id, workspaceId))
      .get();

    if (!ownedWorkspace) return false;

    tx.delete(invitations).where(eq(invitations.workspaceId, workspaceId)).run();
    tx.delete(memberships).where(eq(memberships.workspaceId, workspaceId)).run();
    tx.delete(workspaces).where(eq(workspaces.id, workspaceId)).run();

    return true;
  });
}
