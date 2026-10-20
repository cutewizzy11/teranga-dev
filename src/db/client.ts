import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/**
 * Production (Systalink managed PostgreSQL): set DATABASE_URL.
 * Local development without Docker: falls back to an embedded PGlite database in ./.data.
 * Both drivers expose the same Drizzle query API.
 */
/** DATABASE_SSL: "require" (verify certificate), "no-verify" (encrypt only), anything else = off (same private network). */
function sslConfig(mode: string | undefined) {
  if (mode === "require") return { rejectUnauthorized: true };
  if (mode === "no-verify") return { rejectUnauthorized: false };
  return false;
}

export function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({
      connectionString: url,
      max: 10,
      ssl: sslConfig(process.env.DATABASE_SSL),
    });
    return drizzlePg(pool, { schema });
  }
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  return drizzlePglite(client, { schema }) as unknown as Db;
}
