"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { answers, questions, users } from "@/db/schema";
import { LANG_COOKIE, requireUser } from "@/lib/auth";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { createSession, deleteSession } from "@/lib/session";
import { answerSchema, fieldErrors, helpRequestSchema, loginSchema, questionSchema, signupSchema } from "@/lib/validation";
import { DomainError, acceptAnswer, castVote, requestHelpSession, transitionHelpSession } from "@/server/services";
import { RULES } from "@/server/rules";
import { storeTranslation } from "@/server/translation";

// Same cost factor as real hashes, used to keep login timing constant for unknown emails.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 12);

export type FormState = { errors?: Record<string, string>; message?: string } | undefined;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

function domainMessage(err: unknown): FormState {
  if (err instanceof DomainError) return { message: err.message };
  throw err;
}

// ---------- Auth ----------

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  if (!rateLimit(`signup:${await clientIp()}`, LIMITS.signup.limit, LIMITS.signup.windowMs)) {
    return { message: "Too many attempts, try again later" };
  }
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const [clash] = await db
    .select({ username: users.username, email: users.email })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${data.username}) or lower(${users.email}) = ${data.email}`);
  if (clash) {
    return clash.email.toLowerCase() === data.email
      ? { errors: { email: "This email is already registered" } }
      : { errors: { username: "This username is taken" } };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const [user] = await db
    .insert(users)
    .values({ username: data.username, name: data.name, email: data.email, passwordHash, country: data.country, lang: data.lang, credits: RULES.startingCredits })
    .returning({ id: users.id });
  await createSession(user.id);
  redirect("/questions");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Invalid email or password" };
  const { email, password } = parsed.data;
  if (!rateLimit(`login:${await clientIp()}:${email}`, LIMITS.login.limit, LIMITS.login.windowMs)) {
    return { message: "Too many attempts, try again in 15 minutes" };
  }

  const [user] = await db.select({ id: users.id, hash: users.passwordHash }).from(users).where(sql`lower(${users.email}) = ${email}`);
  // Compare against a dummy hash when the user does not exist so response time does not reveal registered emails.
  const ok = await bcrypt.compare(password, user?.hash ?? DUMMY_HASH);
  if (!user || !ok) return { message: "Invalid email or password" };

  await createSession(user.id);
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/questions");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function setLang(formData: FormData) {
  const lang = formData.get("lang") === "en" ? "en" : "fr";
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// ---------- Questions & answers ----------

export async function askQuestion(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`post:${user.id}`, LIMITS.post.limit, LIMITS.post.windowMs)) return { message: "You are posting too fast" };
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const [q] = await db
    .insert(questions)
    .values({ authorId: user.id, ...parsed.data })
    .returning({ id: questions.id });
  after(() => storeTranslation(db, "question", q.id, parsed.data));
  revalidatePath("/questions");
  redirect(`/questions/${q.id}`);
}

export async function postAnswer(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`post:${user.id}`, LIMITS.post.limit, LIMITS.post.windowMs)) return { message: "You are posting too fast" };
  const parsed = answerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { questionId, body, lang } = parsed.data;

  const created = await db.transaction(async (tx) => {
    const bumped = await tx
      .update(questions)
      .set({ answerCount: sql`${questions.answerCount} + 1` })
      .where(eq(questions.id, questionId))
      .returning({ id: questions.id });
    if (bumped.length === 0) return null;
    const [a] = await tx.insert(answers).values({ questionId, authorId: user.id, body, lang }).returning({ id: answers.id });
    return a;
  });
  if (!created) return { message: "Question not found" };

  after(() => storeTranslation(db, "answer", created.id, { body, lang }));
  revalidatePath(`/questions/${questionId}`);
  return { message: "ok" };
}

export async function vote(formData: FormData) {
  const user = await requireUser();
  if (!rateLimit(`vote:${user.id}`, LIMITS.vote.limit, LIMITS.vote.windowMs)) return;
  const entity = formData.get("entity") === "answer" ? "answer" : "question";
  const id = Number(formData.get("id"));
  const raw = Number(formData.get("value"));
  const value = raw === 1 ? 1 : raw === -1 ? -1 : 0;
  const questionId = Number(formData.get("questionId"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await castVote(db, user.id, entity, id, value);
  } catch (err) {
    if (!(err instanceof DomainError)) throw err;
  }
  revalidatePath(`/questions/${questionId}`);
}

export async function accept(formData: FormData) {
  const user = await requireUser();
  const answerId = Number(formData.get("answerId"));
  const questionId = Number(formData.get("questionId"));
  try {
    await acceptAnswer(db, user.id, answerId);
  } catch (err) {
    if (!(err instanceof DomainError)) throw err;
  }
  revalidatePath(`/questions/${questionId}`);
}

// ---------- Help sessions ----------

export async function requestSession(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = helpRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    await requestHelpSession(db, user.id, parsed.data);
  } catch (err) {
    return domainMessage(err);
  }
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function updateSession(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const action = String(formData.get("action"));
  if (!["accept", "decline", "cancel", "complete"].includes(action)) return;
  try {
    await transitionHelpSession(db, user.id, id, action as "accept" | "decline" | "cancel" | "complete");
  } catch (err) {
    if (!(err instanceof DomainError)) throw err;
  }
  revalidatePath("/sessions");
}
