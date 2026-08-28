import { RedisClient } from "bun";
import { createBunRedisClient, Queue, Worker } from "bullmq";
import { and, eq, gt, isNull } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { invitations } from "../db/schema/invitations.js";
import { notifications } from "../db/schema/notifications.js";
import { users } from "../db/schema/users.js";
import { sendVerificationEmail, sendWorkspaceInvitationEmail } from "../integrations/email.js";
import { logger } from "../utils/logger.js";

const EMAIL_QUEUE_NAME = "emails";

type EmailJob =
  | { type: "verify-email"; email: string; code: string }
  | {
      type: "workspace-invitation";
      email: string;
      invitationId: string;
      token: string;
      workspaceName: string;
      recipientExists: boolean;
    };
type LegacyVerificationEmailJob = { email: string; code: string };
type RedisConnection = ReturnType<typeof createBunRedisClient>;

let connection: RedisConnection | undefined;
let queue: Queue<EmailJob> | undefined;

function getConnection(): RedisConnection {
  return (connection ??= createBunRedisClient(new RedisClient(env.REDIS_URL)));
}

function getQueue(): Queue<EmailJob> {
  return (queue ??= new Queue<EmailJob>(EMAIL_QUEUE_NAME, { connection: getConnection() }));
}

const jobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 1000 },
  removeOnComplete: true,
  removeOnFail: { count: 1000 },
};

export function enqueueVerificationEmail(data: { email: string; code: string }) {
  return getQueue().add("verify-email", { type: "verify-email", ...data }, jobOptions);
}

export function enqueueWorkspaceInvitationEmail(
  data: Omit<Extract<EmailJob, { type: "workspace-invitation" }>, "type">,
) {
  return getQueue().add("workspace-invitation", { type: "workspace-invitation", ...data }, {
    ...jobOptions,
    jobId: data.invitationId,
    removeOnFail: true,
  });
}

export function startEmailWorker() {
  const worker = new Worker<EmailJob | LegacyVerificationEmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      if (job.name === "verify-email" && "code" in job.data) {
        await sendVerificationEmail(job.data.email, job.data.code);
        return;
      }
      if ("type" in job.data && job.data.type === "workspace-invitation") {
        const invitation = db
          .select({ id: invitations.id, inviterEmail: users.email })
          .from(invitations)
          .innerJoin(users, eq(users.id, invitations.invitedBy))
          .where(
            and(
              eq(invitations.id, job.data.invitationId),
              gt(invitations.expiresAt, new Date()),
              isNull(invitations.acceptedAt),
            ),
          )
          .get();
        if (!invitation) return;

        await sendWorkspaceInvitationEmail(
          job.data.email,
          job.data.token,
          job.data.workspaceName,
          invitation.inviterEmail,
          job.data.recipientExists,
        );
        return;
      }
      throw new Error(`Unknown email job: ${job.name}`);
    },
    { connection: getConnection() },
  );

  worker.on("failed", (job, error) => {
    logger.error("Email job failed", { jobId: job?.id, message: error.message });
    if (
      job &&
      "type" in job.data &&
      job.data.type === "workspace-invitation" &&
      job.attemptsMade >= (job.opts.attempts ?? 1)
    ) {
      const invitationId = job.data.invitationId;
      db.transaction((tx) => {
        const deleted = tx
          .delete(invitations)
          .where(
            and(
              eq(invitations.id, invitationId),
              isNull(invitations.acceptedAt),
            ),
          )
          .returning({ id: invitations.id })
          .get();
        if (deleted) {
          tx.delete(notifications)
            .where(
              and(
                eq(notifications.type, "WORKSPACE_INVITATION"),
                eq(notifications.resourceId, deleted.id),
              ),
            )
            .run();
        }
      });
    }
  });
  worker.on("error", (error) => logger.error("Email worker error", { message: error.message }));
  return worker;
}
