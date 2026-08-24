import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

type Level = "debug" | "info" | "warn" | "error";

// ponytail: append sin lock ni rotación por tamaño, add pino/winston si throughput >1k req/s o agregación centralizada
const LOG_DIR = path.resolve(process.cwd(), "logs");

async function ensureDir() {
  await mkdir(LOG_DIR, { recursive: true });
}

function fileForToday(): string {
  const d = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `${d}.log`);
}

function format(level: Level, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase()} ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

async function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = format(level, message, meta) + "\n";
  // consola siempre
  if (level === "error") console.error(line.trim());
  else if (level === "warn") console.warn(line.trim());
  else console.log(line.trim());

  // archivo por fecha – fire-and-forget, no bloquea request
  ensureDir().then(() => appendFile(fileForToday(), line).catch(() => {})).catch(() => {});
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => write("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => write("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write("error", msg, meta),
};
