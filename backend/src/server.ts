import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import { startEmailWorker } from "./queue/email.js";

startEmailWorker();
logger.info("Email worker started");

const server = Bun.serve({
  port: env.PORT,
  hostname: env.HOST,
  fetch: app.fetch,
});

logger.info(`API listening on http://${server.hostname}:${server.port} [${env.NODE_ENV}]`);
