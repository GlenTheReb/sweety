import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { config } from "./config.js";

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
if (process.env.VERCEL) attachDatabasePool(pool);
export function createMigrationPool() {
  return new pg.Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL || config.databaseUrl,
    max: 1,
  });
}
pool.on("error", (error) =>
  console.error("Idle database connection lost:", error.message),
);
