import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

type Level = "info" | "warn" | "error";

// ponytail: append without locking or size rotation; add pino/winston if throughput exceeds 1k req/s or centralized aggregation is needed
const LOG_DIR = path.resolve(process.cwd(), "logs");

async function ensureDir() {
  await mkdir(LOG_DIR, { recursive: true });
}

function fileForToday(): string {
  const d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `${d}.log`);
}

function format(level: Level, message: string, timestamp: string, meta?: Record<string, unknown>): string {
  const base = `[${timestamp}] ${level.toUpperCase()} ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

async function write(
  level: Level,
  message: string,
  meta?: Record<string, unknown>,
  fileDetails?: string,
) {
  const line = format(level, message, new Date().toISOString(), meta);
  // Always log to the console.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  if (!env.SHOW_LOGS) return;

  // Date-based file, fire-and-forget; it does not block the request.
  const fileEntry = `${line}${fileDetails ? `\n${fileDetails}` : ""}\n\n`;
  ensureDir().then(() => appendFile(fileForToday(), fileEntry).catch(() => {})).catch(() => {});
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>, fileDetails?: string) =>
    write("info", msg, meta, fileDetails),
  warn: (msg: string, meta?: Record<string, unknown>, fileDetails?: string) =>
    write("warn", msg, meta, fileDetails),
  error: (msg: string, meta?: Record<string, unknown>, fileDetails?: string) =>
    write("error", msg, meta, fileDetails),
};
