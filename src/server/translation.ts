import type { Db } from "@/db/client";
import { translations, type Lang } from "@/db/schema";
import { translatePost } from "@/lib/translate";

const other = (l: Lang): Lang => (l === "fr" ? "en" : "fr");

/**
 * Translates a freshly created post into the other platform language and caches it.
 * Runs after the response is sent (via `after()`), so posting never waits on the model.
 */
export async function storeTranslation(
  db: Db,
  entity: "question" | "answer",
  entityId: number,
  post: { title?: string; body: string; lang: Lang },
) {
  const target = other(post.lang);
  const result = await translatePost({ title: post.title, body: post.body }, post.lang, target);
  if (!result) return;
  await db
    .insert(translations)
    .values({ entityType: entity, entityId, targetLang: target, title: result.title?.slice(0, 200) ?? null, body: result.body })
    .onConflictDoNothing();
}
