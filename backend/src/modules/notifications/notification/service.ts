import { and, count, desc, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { notifications } from "../../../db/schema/notifications.js";
import type { ListNotificationsInput } from "./schema.js";

export function listNotifications(userId: string, { limit, cursor }: ListNotificationsInput) {
  const cursorRow = cursor
    ? db
        .select({ id: notifications.id, createdAt: notifications.createdAt })
        .from(notifications)
        .where(and(eq(notifications.id, cursor), eq(notifications.userId, userId)))
        .get()
    : undefined;

  if (cursor && !cursorRow) return { kind: "invalid_cursor" as const };

  const conditions = [eq(notifications.userId, userId)];
  if (cursorRow) {
    conditions.push(
      or(
        lt(notifications.createdAt, cursorRow.createdAt),
        and(
          eq(notifications.createdAt, cursorRow.createdAt),
          lt(notifications.id, cursorRow.id),
        ),
      )!,
    );
  }

  const rows = db
    .select({
      id: notifications.id,
      type: notifications.type,
      invitationId: notifications.resourceId,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1)
    .all();

  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const unreadCount =
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .get()?.value ?? 0;

  return {
    kind: "ok" as const,
    notifications: items,
    unreadCount,
    nextCursor: hasNextPage ? (items[items.length - 1]?.id ?? null) : null,
  };
}

export function markNotificationRead(userId: string, notificationId: string) {
  db.update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .run();
}

export function markAllNotificationsRead(userId: string) {
  db.update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .run();
}
