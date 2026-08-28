import { and, eq, ne } from "drizzle-orm";
import { pushInstallations } from "../../../db/schema/push-installations.js";
import { withCurrentRefreshFamily } from "../../../utils/session.js";
import type { PushInstallationInput } from "./schema.js";

export function registerPushInstallation(
  authenticatedUserId: string,
  refreshToken: string | undefined,
  input: PushInstallationInput,
) {
  if (input.userId !== authenticatedUserId) return Promise.resolve(false);

  return withCurrentRefreshFamily(refreshToken, authenticatedUserId, (tx, familyId) => {
    tx.delete(pushInstallations)
      .where(and(eq(pushInstallations.familyId, familyId), ne(pushInstallations.fid, input.fid)))
      .run();
    tx.insert(pushInstallations)
      .values({ fid: input.fid, userId: authenticatedUserId, familyId })
      .onConflictDoUpdate({
        target: pushInstallations.fid,
        set: { userId: authenticatedUserId, familyId, updatedAt: new Date() },
      })
      .run();
  });
}

export function deletePushInstallation(
  authenticatedUserId: string,
  refreshToken: string | undefined,
  input: PushInstallationInput,
) {
  if (input.userId !== authenticatedUserId) return Promise.resolve(false);

  return withCurrentRefreshFamily(refreshToken, authenticatedUserId, (tx, familyId) => {
    tx.delete(pushInstallations)
      .where(
        and(
          eq(pushInstallations.fid, input.fid),
          eq(pushInstallations.userId, authenticatedUserId),
          eq(pushInstallations.familyId, familyId),
        ),
      )
      .run();
  });
}
