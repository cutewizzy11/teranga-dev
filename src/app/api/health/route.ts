import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Liveness + database check, used by the container healthcheck on Datacloud. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
