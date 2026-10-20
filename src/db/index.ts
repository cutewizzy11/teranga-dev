import "server-only";
import { createDb, type Db } from "./client";

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: Db };

export const db: Db = globalForDb.__db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export * as schema from "./schema";
