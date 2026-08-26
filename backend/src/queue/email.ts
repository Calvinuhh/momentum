import { RedisClient } from "bun";
import { createBunRedisClient, Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { sendVerificationEmail } from "../integrations/email.js";
import { logger } from "../utils/logger.js";

const EMAIL_QUEUE_NAME = "emails";

export type VerificationEmailJob = { email: string; code: string };
type RedisConnection = ReturnType<typeof createBunRedisClient>;

let connection: RedisConnection | undefined;
let queue: Queue<VerificationEmailJob> | undefined;

function getConnection(): RedisConnection {
  return (connection ??= createBunRedisClient(new RedisClient(env.REDIS_URL)));
}

function getQueue(): Queue<VerificationEmailJob> {
  return (queue ??= new Queue<VerificationEmailJob>(EMAIL_QUEUE_NAME, { connection: getConnection() }));
}

export function enqueueVerificationEmail(data: VerificationEmailJob) {
  return getQueue().add("verify-email", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
    removeOnFail: { count: 1000 },
  });
}

export function startEmailWorker() {
  const worker = new Worker<VerificationEmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      if (job.name !== "verify-email") throw new Error(`Unknown email job: ${job.name}`);
      await sendVerificationEmail(job.data.email, job.data.code);
    },
    { connection: getConnection() },
  );

  worker.on("error", (error) => logger.error("Email worker error", { message: error.message }));
  return worker;
}
