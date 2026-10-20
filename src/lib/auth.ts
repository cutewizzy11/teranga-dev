import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, type Lang } from "@/db/schema";
import { getSessionUserId } from "./session";

export type CurrentUser = Pick<typeof users.$inferSelect, "id" | "username" | "name" | "country" | "lang" | "credits" | "reputation">;

/** Data Access Layer entry point: the signed-in user (narrow fields only), memoized per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const id = await getSessionUserId();
  if (!id) return null;
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      country: users.country,
      lang: users.lang,
      credits: users.credits,
      reputation: users.reputation,
    })
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export const LANG_COOKIE = "td_lang";

/** UI language: explicit choice (cookie) > account preference > browser Accept-Language > French. */
export const getLang = cache(async (): Promise<Lang> => {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (chosen === "fr" || chosen === "en") return chosen;
  const user = await getCurrentUser();
  if (user) return user.lang;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^en\b/i.test(accept.trim()) ? "en" : "fr";
});
