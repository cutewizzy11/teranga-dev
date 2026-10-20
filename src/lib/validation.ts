import { z } from "zod";
import { COUNTRIES } from "./i18n";

const lang = z.enum(["fr", "en"]);

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,32}$/, "3–32 characters: letters, digits, underscore"),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "At least 8 characters").max(128),
  country: z.string().refine((c) => c in COUNTRIES, "Unknown country"),
  lang,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const tagsSchema = z
  .string()
  .max(200)
  .transform((s) =>
    [...new Set(s.split(",").map((t) => t.trim().toLowerCase().replace(/[^a-z0-9.+#-]/g, "")).filter(Boolean))].slice(0, 5),
  );

export const questionSchema = z.object({
  title: z.string().trim().min(10, "At least 10 characters").max(160),
  body: z.string().trim().min(20, "At least 20 characters").max(20000),
  tags: tagsSchema,
  lang,
});

export const answerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  body: z.string().trim().min(10, "At least 10 characters").max(20000),
  lang,
});

export const helpRequestSchema = z.object({
  mentorId: z.coerce.number().int().positive(),
  topic: z.string().trim().min(5).max(200),
  message: z.string().trim().max(2000).default(""),
  credits: z.coerce.number().int(),
});

/** Turns a zod error into { field: firstMessage } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
