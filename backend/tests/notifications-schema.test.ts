import { describe, expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { notifications } from "../src/db/schema/notifications.js";
import { listNotificationsSchema } from "../src/modules/notifications/notification/schema.js";
import { pushInstallations } from "../src/db/schema/push-installations.js";

describe("notification persistence schemas", () => {
  test("validates notification list parameters", () => {
    expect(listNotificationsSchema.parse({})).toEqual({ limit: 20 });
    expect(listNotificationsSchema.parse({ limit: "50", cursor: "  abc " })).toEqual({
      limit: 50,
      cursor: "abc",
    });
    expect(listNotificationsSchema.safeParse({ limit: "51" }).success).toBe(false);
  });

  test("defines the notification columns and indexes", () => {
    const config = getTableConfig(notifications);

    expect(config.name).toBe("notifications");
    expect(config.columns.map((column) => column.name)).toEqual([
      "id",
      "user_id",
      "workspace_id",
      "type",
      "resource_id",
      "title",
      "body",
      "read_at",
      "created_at",
    ]);
    expect(config.indexes.map((index) => index.config.name)).toEqual([
      "notifications_user_type_resource_unique",
      "notifications_user_created_at_idx",
      "notifications_user_unread_idx",
      "notifications_workspace_id_idx",
    ]);
    expect(config.indexes[0]?.config.unique).toBe(true);
    expect(config.checks).toHaveLength(1);
  });

  test("uses the endpoint as push installation primary key", () => {
    const config = getTableConfig(pushInstallations);

    expect(config.name).toBe("push_installations");
    expect(config.columns.map((column) => column.name)).toEqual([
      "endpoint",
      "p256dh",
      "auth",
      "user_id",
      "family_id",
      "created_at",
      "updated_at",
    ]);
  });

  test("preserves notifications when the workspace is deleted", () => {
    const config = getTableConfig(notifications);
    const workspaceForeignKey = config.foreignKeys.find(
      (foreignKey) => foreignKey.reference().columns[0]?.name === "workspace_id",
    );

    expect(workspaceForeignKey?.onDelete).toBe("set null");
  });
});
