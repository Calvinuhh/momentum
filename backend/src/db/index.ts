import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "../config/env.js";

const sqlitePath = env.DATABASE_URL.replace(/^file:/, "");
export const sqlite = new Database(sqlitePath);

// Pragmas para producción (WAL + FK)
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 5000;");

export const db = drizzle({ client: sqlite });
