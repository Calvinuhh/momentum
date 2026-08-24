import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "../config/env.js";

const sqlitePath = env.DATABASE_URL.replace(/^file:/, "");
export const sqlite = new Database(sqlitePath);

// Pragmas must run before drizzle(); they apply per connection (WAL persists, FK/timeout do not).
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA foreign_keys = ON;");
sqlite.run("PRAGMA busy_timeout = 5000;");

export const db = drizzle({ client: sqlite });
