import { and, eq, ne } from "drizzle-orm";
import { pushInstallations } from "../../../db/schema/push-installations.js";
import { withCurrentRefreshFamily } from "../../../utils/session.js";
import type { DeletePushInstallationInput, PushInstallationInput } from "./schema.js";

export function registerPushInstallation(
  authenticatedUserId: string,
  refreshToken: string | undefined,
  input: PushInstallationInput,
) {
  if (input.userId !== authenticatedUserId) return Promise.resolve(false);

  return withCurrentRefreshFamily(refreshToken, authenticatedUserId, (tx, familyId) => {
    tx.delete(pushInstallations)
      .where(and(eq(pushInstallations.familyId, familyId), ne(pushInstallations.endpoint, input.endpoint)))
      .run();
    tx.insert(pushInstallations)
      .values({
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        userId: authenticatedUserId,
        familyId,
      })
      .onConflictDoUpdate({
        target: pushInstallations.endpoint,
        set: {
          p256dh: input.p256dh,
          auth: input.auth,
          userId: authenticatedUserId,
          familyId,
          updatedAt: new Date(),
        },
      })
      .run();
  });
}

export function deletePushInstallation(
  authenticatedUserId: string,
  refreshToken: string | undefined,
  input: DeletePushInstallationInput,
) {
  if (input.userId !== authenticatedUserId) return Promise.resolve(false);

  return withCurrentRefreshFamily(refreshToken, authenticatedUserId, (tx, familyId) => {
    tx.delete(pushInstallations)
      .where(
        and(
          eq(pushInstallations.endpoint, input.endpoint),
          eq(pushInstallations.userId, authenticatedUserId),
          eq(pushInstallations.familyId, familyId),
        ),
      )
      .run();
  });
}
