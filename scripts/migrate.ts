import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";

const migrationsFolder = "./drizzle";

async function main() {
  if (process.env.DATABASE_URL) {
    const ssl = process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: true } : process.env.DATABASE_SSL === "no-verify" ? { rejectUnauthorized: false } : false;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
    await migratePg(drizzlePg(pool), { migrationsFolder });
    await pool.end();
  } else {
    const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    await migratePglite(drizzlePglite(client), { migrationsFolder });
    await client.close();
  }
  console.log("✓ migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
