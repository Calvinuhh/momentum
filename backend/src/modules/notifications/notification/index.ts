import { Hono } from "hono";
import { apiErrorBody, createApiError } from "../../../errors/api-error.js";
import { listNotificationsSchema } from "./schema.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./service.js";

const notificationRouter = new Hono<{ Variables: { userId: string } }>();

notificationRouter.get("/", (c) => {
  const parsed = listNotificationsSchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      apiErrorBody({
        code: "VALIDATION_ERROR",
        message: "The provided data is invalid",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      }),
      400,
    );
  }

  const result = listNotifications(c.get("userId"), parsed.data);
  if (result.kind === "invalid_cursor") {
    throw createApiError(400, "INVALID_CURSOR", "The notification cursor is invalid");
  }

  return c.json({
    notifications: result.notifications,
    unreadCount: result.unreadCount,
    nextCursor: result.nextCursor,
  });
});

notificationRouter.patch("/read-all", (c) => {
  markAllNotificationsRead(c.get("userId"));
  return c.body(null, 204);
});

notificationRouter.patch("/:id/read", (c) => {
  markNotificationRead(c.get("userId"), c.req.param("id"));
  return c.body(null, 204);
});

export default notificationRouter;
