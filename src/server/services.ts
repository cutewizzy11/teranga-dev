import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { answers, creditLedger, helpSessions, questions, users, votes } from "@/db/schema";
import { RULES, reputationDelta, type EntityType } from "./rules";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export class DomainError extends Error {
  constructor(
    public code:
      | "not_found"
      | "forbidden"
      | "own_content"
      | "insufficient_credits"
      | "invalid_state"
      | "invalid_input",
    message: string,
  ) {
    super(message);
  }
}

async function adjustUser(tx: Tx, userId: number, rep: number, credits: number, reason: string, refId?: number) {
  if (rep === 0 && credits === 0) return;
  await tx
    .update(users)
    .set({
      reputation: sql`${users.reputation} + ${rep}`,
      credits: sql`${users.credits} + ${credits}`,
    })
    .where(eq(users.id, userId));
  if (credits !== 0) {
    await tx.insert(creditLedger).values({ userId, delta: credits, reason, refId });
  }
}

async function contentAuthor(tx: Tx, entity: EntityType, id: number): Promise<number> {
  const table = entity === "question" ? questions : answers;
  const [row] = await tx.select({ authorId: table.authorId }).from(table).where(eq(table.id, id));
  if (!row) throw new DomainError("not_found", `${entity} not found`);
  return row.authorId;
}

/**
 * Casts, changes or clears a vote. value = 1, -1, or 0 (clear).
 * Updates the content score and the author's reputation atomically. Returns the new score.
 */
export async function castVote(db: Db, voterId: number, entity: EntityType, entityId: number, value: -1 | 0 | 1) {
  return db.transaction(async (tx) => {
    const authorId = await contentAuthor(tx, entity, entityId);
    if (authorId === voterId) throw new DomainError("own_content", "You cannot vote on your own post");

    const key = and(eq(votes.userId, voterId), eq(votes.entityType, entity), eq(votes.entityId, entityId));
    const [existing] = await tx.select({ value: votes.value }).from(votes).where(key);
    const oldValue = existing?.value ?? 0;
    if (oldValue === value) return null;

    if (value === 0) await tx.delete(votes).where(key);
    else if (existing) await tx.update(votes).set({ value }).where(key);
    else await tx.insert(votes).values({ userId: voterId, entityType: entity, entityId, value });

    const table = entity === "question" ? questions : answers;
    const [updated] = await tx
      .update(table)
      .set({ score: sql`${table.score} + ${value - oldValue}` })
      .where(eq(table.id, entityId))
      .returning({ score: table.score });

    await adjustUser(tx, authorId, reputationDelta(entity, oldValue, value), 0, "vote");
    return updated.score;
  });
}

/** The question author marks one answer as the solution. Rewards the answerer with reputation and credits. */
export async function acceptAnswer(db: Db, userId: number, answerId: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        questionId: answers.questionId,
        answerAuthor: answers.authorId,
        questionAuthor: questions.authorId,
        currentAccepted: questions.acceptedAnswerId,
      })
      .from(answers)
      .innerJoin(questions, eq(questions.id, answers.questionId))
      .where(eq(answers.id, answerId));
    if (!row) throw new DomainError("not_found", "Answer not found");
    if (row.questionAuthor !== userId) throw new DomainError("forbidden", "Only the question author can accept an answer");
    if (row.currentAccepted === answerId) return;
    if (row.currentAccepted !== null) throw new DomainError("invalid_state", "An answer is already accepted");

    await tx.update(questions).set({ acceptedAnswerId: answerId }).where(eq(questions.id, row.questionId));
    if (row.answerAuthor !== userId) {
      await adjustUser(tx, row.answerAuthor, RULES.reputation.answerAccepted, RULES.credits.answerAccepted, "answer_accepted", answerId);
      await adjustUser(tx, userId, RULES.reputation.acceptingAnswer, 0, "accepting_answer");
    }
  });
}

/** Requests a help session. The credits leave the requester's balance immediately and are held in escrow. */
export async function requestHelpSession(
  db: Db,
  requesterId: number,
  input: { mentorId: number; topic: string; message: string; credits: number },
) {
  const { minCredits, maxCredits } = RULES.helpSession;
  if (!Number.isInteger(input.credits) || input.credits < minCredits || input.credits > maxCredits) {
    throw new DomainError("invalid_input", `Offer between ${minCredits} and ${maxCredits} credits`);
  }
  if (input.mentorId === requesterId) throw new DomainError("own_content", "You cannot book yourself");

  return db.transaction(async (tx) => {
    const [mentor] = await tx.select({ id: users.id }).from(users).where(eq(users.id, input.mentorId));
    if (!mentor) throw new DomainError("not_found", "Mentor not found");

    // Conditional update: only succeeds if the balance covers the offer, so concurrent requests cannot overdraw.
    const debited = await tx
      .update(users)
      .set({ credits: sql`${users.credits} - ${input.credits}` })
      .where(and(eq(users.id, requesterId), sql`${users.credits} >= ${input.credits}`))
      .returning({ id: users.id });
    if (debited.length === 0) throw new DomainError("insufficient_credits", "Not enough credits");

    const [session] = await tx
      .insert(helpSessions)
      .values({ requesterId, mentorId: input.mentorId, topic: input.topic, message: input.message, credits: input.credits })
      .returning();
    await tx.insert(creditLedger).values({ userId: requesterId, delta: -input.credits, reason: "session_escrow", refId: session.id });
    return session;
  });
}

type Transition = "accept" | "decline" | "cancel" | "complete";

/**
 * State machine for help sessions:
 *   pending  --accept (mentor)--> accepted --complete (requester)--> completed (mentor paid)
 *   pending  --decline (mentor) / cancel (requester)--> declined/cancelled (requester refunded)
 *   accepted --cancel (requester)--> cancelled (requester refunded)
 */
export async function transitionHelpSession(db: Db, userId: number, sessionId: number, action: Transition) {
  return db.transaction(async (tx) => {
    const [s] = await tx.select().from(helpSessions).where(eq(helpSessions.id, sessionId)).for("update");
    if (!s) throw new DomainError("not_found", "Session not found");

    const isMentor = s.mentorId === userId;
    const isRequester = s.requesterId === userId;
    let next: typeof s.status;
    if (action === "accept" && isMentor && s.status === "pending") next = "accepted";
    else if (action === "decline" && isMentor && s.status === "pending") next = "declined";
    else if (action === "cancel" && isRequester && (s.status === "pending" || s.status === "accepted")) next = "cancelled";
    else if (action === "complete" && isRequester && s.status === "accepted") next = "completed";
    else if (!isMentor && !isRequester) throw new DomainError("forbidden", "Not your session");
    else throw new DomainError("invalid_state", `Cannot ${action} a ${s.status} session`);

    await tx.update(helpSessions).set({ status: next, updatedAt: new Date() }).where(eq(helpSessions.id, s.id));
    if (next === "completed") await adjustUser(tx, s.mentorId, 0, s.credits, "session_earned", s.id);
    if (next === "declined" || next === "cancelled") await adjustUser(tx, s.requesterId, 0, s.credits, "session_refund", s.id);
    return next;
  });
}
