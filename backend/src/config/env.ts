import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SHOW_LOGS: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  VAPID_PUBLIC_KEY: z.string().regex(/^[A-Za-z0-9_-]{86,88}$/).optional(),
  VAPID_PRIVATE_KEY: z.string().regex(/^[A-Za-z0-9_-]{42,44}$/).optional(),
  VAPID_SUBJECT: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).default("file:./data/momentum.db"),
  JWT_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.email(),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM_NAME: z.string().min(1),
  REDIS_URL: z.string().regex(/^rediss?:\/\//, "REDIS_URL must use redis:// or rediss://"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const raw = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
  );
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(z.treeifyError(parsed.error));
    process.exit(1);
  }
  return parsed.data;
}

export const env = validateEnv();
