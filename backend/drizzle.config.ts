import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env.js";

// DATABASE_URL is file:./data/momentum.db – extract path for drizzle-kit
const dbPath = env.DATABASE_URL.replace(/^file:/, "");

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: dbPath,
  },
});
