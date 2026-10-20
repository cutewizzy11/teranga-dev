import "server-only";
import { and, count, countDistinct, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { answers, helpSessions, questions, translations, users, votes, type Lang } from "@/db/schema";

const author = {
  username: users.username,
  name: users.name,
  country: users.country,
  reputation: users.reputation,
};

export async function listQuestions(opts: { q?: string; tag?: string; unanswered?: boolean; limit?: number; authorId?: number }) {
  const filters = [];
  if (opts.q) {
    const term = `%${opts.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    filters.push(or(ilike(questions.title, term), ilike(questions.body, term)));
  }
  if (opts.tag) filters.push(sql`${opts.tag} = any(${questions.tags})`);
  if (opts.unanswered) filters.push(eq(questions.answerCount, 0));
  if (opts.authorId) filters.push(eq(questions.authorId, opts.authorId));

  return db
    .select({
      id: questions.id,
      title: questions.title,
      lang: questions.lang,
      tags: questions.tags,
      score: questions.score,
      answerCount: questions.answerCount,
      accepted: sql<boolean>`${questions.acceptedAnswerId} is not null`,
      createdAt: questions.createdAt,
      author,
    })
    .from(questions)
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(opts.limit ?? 30);
}

/** Title translations for a list of questions, keyed by question id. */
export async function questionTitleTranslations(ids: number[], lang: Lang) {
  if (ids.length === 0) return new Map<number, string>();
  const rows = await db
    .select({ id: translations.entityId, title: translations.title })
    .from(translations)
    .where(and(eq(translations.entityType, "question"), eq(translations.targetLang, lang), inArray(translations.entityId, ids)));
  return new Map(rows.filter((r) => r.title).map((r) => [r.id, r.title!]));
}

export async function getQuestion(id: number, viewerId: number | null) {
  const [question] = await db
    .select({
      id: questions.id,
      title: questions.title,
      body: questions.body,
      lang: questions.lang,
      tags: questions.tags,
      score: questions.score,
      acceptedAnswerId: questions.acceptedAnswerId,
      authorId: questions.authorId,
      createdAt: questions.createdAt,
      author,
    })
    .from(questions)
    .innerJoin(users, eq(users.id, questions.authorId))
    .where(eq(questions.id, id));
  if (!question) return null;

  const answerRows = await db
    .select({
      id: answers.id,
      body: answers.body,
      lang: answers.lang,
      score: answers.score,
      authorId: answers.authorId,
      createdAt: answers.createdAt,
      author,
    })
    .from(answers)
    .innerJoin(users, eq(users.id, answers.authorId))
    .where(eq(answers.questionId, id))
    .orderBy(desc(sql`${answers.id} = ${question.acceptedAnswerId ?? 0}`), desc(answers.score), answers.createdAt);

  const myVotes = new Map<string, number>();
  if (viewerId) {
    const rows = await db
      .select({ type: votes.entityType, id: votes.entityId, value: votes.value })
      .from(votes)
      .where(
        and(
          eq(votes.userId, viewerId),
          or(
            and(eq(votes.entityType, "question"), eq(votes.entityId, id)),
            answerRows.length ? and(eq(votes.entityType, "answer"), inArray(votes.entityId, answerRows.map((a) => a.id))) : undefined,
          ),
        ),
      );
    for (const r of rows) myVotes.set(`${r.type}:${r.id}`, r.value);
  }

  return { question, answers: answerRows, myVotes };
}

export async function getTranslations(entries: { type: "question" | "answer"; id: number }[], lang: Lang) {
  const out = new Map<string, { title: string | null; body: string }>();
  if (entries.length === 0) return out;
  const rows = await db
    .select()
    .from(translations)
    .where(
      and(
        eq(translations.targetLang, lang),
        or(...entries.map((e) => and(eq(translations.entityType, e.type), eq(translations.entityId, e.id)))),
      ),
    );
  for (const r of rows) out.set(`${r.entityType}:${r.entityId}`, { title: r.title, body: r.body });
  return out;
}

export async function getProfile(username: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      country: users.country,
      lang: users.lang,
      bio: users.bio,
      skills: users.skills,
      reputation: users.reputation,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`);
  if (!user) return null;
  const [[{ answerCount }], recentQuestions] = await Promise.all([
    db.select({ answerCount: count() }).from(answers).where(eq(answers.authorId, user.id)),
    listQuestions({ authorId: user.id, limit: 10 }),
  ]);
  return { user, answerCount, recentQuestions };
}

export async function leaderboard(country?: string) {
  return db
    .select({ ...author, skills: users.skills })
    .from(users)
    .where(country ? eq(users.country, country) : undefined)
    .orderBy(desc(users.reputation), users.id)
    .limit(25);
}

export async function countryRanking() {
  return db
    .select({ country: users.country, devs: count(), reputation: sql<number>`sum(${users.reputation})::int` })
    .from(users)
    .groupBy(users.country)
    .orderBy(desc(sql`sum(${users.reputation})`))
    .limit(20);
}

export async function platformStats() {
  const [[u], [q], [a]] = await Promise.all([
    db.select({ devs: count(), countries: countDistinct(users.country) }).from(users),
    db.select({ n: count() }).from(questions),
    db.select({ n: count() }).from(answers),
  ]);
  return { devs: u.devs, countries: u.countries, questions: q.n, answers: a.n };
}

export async function popularTags(limit = 12) {
  const rows = await db.execute<{ tag: string; n: number }>(
    sql`select tag, count(*)::int as n from ${questions}, unnest(${questions.tags}) as tag group by tag order by n desc limit ${limit}`,
  );
  return rows.rows;
}

export async function mySessions(userId: number) {
  const rows = await db
    .select({
      id: helpSessions.id,
      topic: helpSessions.topic,
      message: helpSessions.message,
      credits: helpSessions.credits,
      status: helpSessions.status,
      createdAt: helpSessions.createdAt,
      requesterId: helpSessions.requesterId,
      mentorId: helpSessions.mentorId,
    })
    .from(helpSessions)
    .where(or(eq(helpSessions.requesterId, userId), eq(helpSessions.mentorId, userId)))
    .orderBy(desc(helpSessions.createdAt))
    .limit(50);

  const ids = [...new Set(rows.flatMap((r) => [r.requesterId, r.mentorId]))];
  const people = ids.length
    ? await db.select({ id: users.id, username: users.username, name: users.name, country: users.country }).from(users).where(inArray(users.id, ids))
    : [];
  const byId = new Map(people.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, requester: byId.get(r.requesterId)!, mentor: byId.get(r.mentorId)! }));
}
