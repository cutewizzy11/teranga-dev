import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const langEnum = pgEnum("lang", ["fr", "en"]);
export const entityEnum = pgEnum("entity", ["question", "answer"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "pending",
  "accepted",
  "completed",
  "declined",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 32 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
    lang: langEnum("lang").notNull().default("fr"),
    bio: text("bio").notNull().default(""),
    skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
    reputation: integer("reputation").notNull().default(0),
    credits: integer("credits").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_username_idx").on(sql`lower(${t.username})`),
    uniqueIndex("users_email_idx").on(sql`lower(${t.email})`),
    index("users_country_rep_idx").on(t.country, t.reputation),
    check("users_credits_nonneg", sql`${t.credits} >= 0`),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    lang: langEnum("lang").notNull(),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    score: integer("score").notNull().default(0),
    answerCount: integer("answer_count").notNull().default(0),
    acceptedAnswerId: integer("accepted_answer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("questions_created_idx").on(t.createdAt),
    index("questions_tags_idx").using("gin", t.tags),
  ],
);

export const answers = pgTable(
  "answers",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    lang: langEnum("lang").notNull(),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("answers_question_idx").on(t.questionId)],
);

/** Cached machine translations, one row per (entity, target language). */
export const translations = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    entityType: entityEnum("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    targetLang: langEnum("target_lang").notNull(),
    title: varchar("title", { length: 200 }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("translations_entity_idx").on(t.entityType, t.entityId, t.targetLang)],
);

export const votes = pgTable(
  "votes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: entityEnum("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.entityType, t.entityId] }),
    check("votes_value_check", sql`${t.value} in (-1, 1)`),
  ],
);

/** Peer help sessions: a requester spends credits (held in escrow) for a mentor's time. */
export const helpSessions = pgTable(
  "help_sessions",
  {
    id: serial("id").primaryKey(),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mentorId: integer("mentor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: varchar("topic", { length: 200 }).notNull(),
    message: text("message").notNull().default(""),
    credits: integer("credits").notNull(),
    status: sessionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("help_sessions_mentor_idx").on(t.mentorId, t.status),
    index("help_sessions_requester_idx").on(t.requesterId, t.status),
    check("help_sessions_credits_pos", sql`${t.credits} > 0`),
  ],
);

/** Append-only audit trail of every credit movement. */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(),
    refId: integer("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("credit_ledger_user_idx").on(t.userId, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type HelpSession = typeof helpSessions.$inferSelect;
export type Lang = (typeof langEnum.enumValues)[number];
