import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { RULES, reputationDelta } from "@/server/rules";
import { DomainError, acceptAnswer, castVote, requestHelpSession, transitionHelpSession } from "@/server/services";

let db: Db;
let alice: number, bob: number, carol: number;

async function user(username: string) {
  const [u] = await db
    .insert(schema.users)
    .values({ username, name: username, email: `${username}@test.dev`, passwordHash: "x", country: "SN", credits: RULES.startingCredits })
    .returning({ id: schema.users.id });
  return u.id;
}

async function get(id: number) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return u;
}

async function question(authorId: number) {
  const [q] = await db.insert(schema.questions).values({ authorId, title: "A question title", body: "Body of the question", lang: "fr" }).returning();
  return q.id;
}

async function answer(questionId: number, authorId: number) {
  const [a] = await db.insert(schema.answers).values({ questionId, authorId, body: "An answer body", lang: "en" }).returning();
  return a.id;
}

beforeEach(async () => {
  const client = new PGlite(); // fresh in-memory Postgres per test
  db = drizzle(client, { schema }) as unknown as Db;
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  [alice, bob, carol] = [await user("alice"), await user("bob"), await user("carol")];
});

describe("reputationDelta", () => {
  it("handles new votes, flips and clears", () => {
    expect(reputationDelta("answer", 0, 1)).toBe(RULES.reputation.answerUpvote);
    expect(reputationDelta("answer", 1, -1)).toBe(RULES.reputation.downvote - RULES.reputation.answerUpvote);
    expect(reputationDelta("question", 1, 0)).toBe(-RULES.reputation.questionUpvote);
    expect(reputationDelta("question", 0, 0)).toBe(0);
  });
});

describe("castVote", () => {
  it("updates score and author reputation, and is idempotent", async () => {
    const q = await question(alice);
    expect(await castVote(db, bob, "question", q, 1)).toBe(1);
    expect(await castVote(db, bob, "question", q, 1)).toBeNull(); // same vote twice: no-op
    expect(await castVote(db, carol, "question", q, 1)).toBe(2);
    expect((await get(alice)).reputation).toBe(2 * RULES.reputation.questionUpvote);
  });

  it("switching a vote reverses the earlier effect", async () => {
    const q = await question(alice);
    await castVote(db, bob, "question", q, 1);
    expect(await castVote(db, bob, "question", q, -1)).toBe(-1);
    expect(await castVote(db, bob, "question", q, 0)).toBe(0);
    expect((await get(alice)).reputation).toBe(0);
  });

  it("downvote then clear restores reputation exactly (no farming)", async () => {
    const q = await question(alice);
    for (let i = 0; i < 3; i++) {
      await castVote(db, bob, "question", q, -1);
      await castVote(db, bob, "question", q, 0);
    }
    expect((await get(alice)).reputation).toBe(0);
  });

  it("rejects voting on your own post", async () => {
    const q = await question(alice);
    await expect(castVote(db, alice, "question", q, 1)).rejects.toMatchObject({ code: "own_content" });
  });
});

describe("acceptAnswer", () => {
  it("rewards the answerer with reputation and credits, recorded in the ledger", async () => {
    const q = await question(alice);
    const a = await answer(q, bob);
    await acceptAnswer(db, alice, a);
    const b = await get(bob);
    expect(b.reputation).toBe(RULES.reputation.answerAccepted);
    expect(b.credits).toBe(RULES.startingCredits + RULES.credits.answerAccepted);
    const ledger = await db.select().from(schema.creditLedger).where(eq(schema.creditLedger.userId, bob));
    expect(ledger).toHaveLength(1);
  });

  it("only the question author can accept, and only once", async () => {
    const q = await question(alice);
    const a1 = await answer(q, bob);
    const a2 = await answer(q, carol);
    await expect(acceptAnswer(db, carol, a1)).rejects.toMatchObject({ code: "forbidden" });
    await acceptAnswer(db, alice, a1);
    await expect(acceptAnswer(db, alice, a2)).rejects.toMatchObject({ code: "invalid_state" });
  });
});

describe("help sessions (credit escrow)", () => {
  it("holds credits in escrow, then pays the mentor on completion", async () => {
    const s = await requestHelpSession(db, alice, { mentorId: bob, topic: "Review my API", message: "", credits: 3 });
    expect((await get(alice)).credits).toBe(RULES.startingCredits - 3);
    await transitionHelpSession(db, bob, s.id, "accept");
    await transitionHelpSession(db, alice, s.id, "complete");
    expect((await get(bob)).credits).toBe(RULES.startingCredits + 3);
    expect((await get(alice)).credits).toBe(RULES.startingCredits - 3);
  });

  it("refunds the requester when the mentor declines", async () => {
    const s = await requestHelpSession(db, alice, { mentorId: bob, topic: "Review my API", message: "", credits: 2 });
    await transitionHelpSession(db, bob, s.id, "decline");
    expect((await get(alice)).credits).toBe(RULES.startingCredits);
  });

  it("refuses to overdraw and refuses invalid transitions", async () => {
    await expect(
      requestHelpSession(db, alice, { mentorId: bob, topic: "Too expensive", message: "", credits: RULES.startingCredits + 1 }),
    ).rejects.toBeInstanceOf(DomainError);
    const s = await requestHelpSession(db, alice, { mentorId: bob, topic: "Review my API", message: "", credits: 1 });
    await expect(transitionHelpSession(db, alice, s.id, "accept")).rejects.toMatchObject({ code: "invalid_state" });
    await expect(transitionHelpSession(db, carol, s.id, "decline")).rejects.toMatchObject({ code: "forbidden" });
    await expect(transitionHelpSession(db, alice, s.id, "complete")).rejects.toMatchObject({ code: "invalid_state" });
  });

  it("credits balance never goes negative across many requests", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => requestHelpSession(db, alice, { mentorId: bob, topic: "Parallel request", message: "", credits: 1 })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(RULES.startingCredits);
    expect((await get(alice)).credits).toBe(0);
  });
});
