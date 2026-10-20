CREATE TYPE "public"."entity" AS ENUM('question', 'answer');--> statement-breakpoint
CREATE TYPE "public"."lang" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pending', 'accepted', 'completed', 'declined', 'cancelled');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"body" text NOT NULL,
	"lang" "lang" NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" varchar(40) NOT NULL,
	"ref_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer NOT NULL,
	"mentor_id" integer NOT NULL,
	"topic" varchar(200) NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"credits" integer NOT NULL,
	"status" "session_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "help_sessions_credits_pos" CHECK ("help_sessions"."credits" > 0)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"lang" "lang" NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"answer_count" integer DEFAULT 0 NOT NULL,
	"accepted_answer_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" "entity" NOT NULL,
	"entity_id" integer NOT NULL,
	"target_lang" "lang" NOT NULL,
	"title" varchar(200),
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"name" varchar(80) NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"country" varchar(2) NOT NULL,
	"lang" "lang" DEFAULT 'fr' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"credits" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_credits_nonneg" CHECK ("users"."credits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"user_id" integer NOT NULL,
	"entity_type" "entity" NOT NULL,
	"entity_id" integer NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "votes_user_id_entity_type_entity_id_pk" PRIMARY KEY("user_id","entity_type","entity_id"),
	CONSTRAINT "votes_value_check" CHECK ("votes"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_sessions" ADD CONSTRAINT "help_sessions_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_sessions" ADD CONSTRAINT "help_sessions_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answers_question_idx" ON "answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_user_idx" ON "credit_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "help_sessions_mentor_idx" ON "help_sessions" USING btree ("mentor_id","status");--> statement-breakpoint
CREATE INDEX "help_sessions_requester_idx" ON "help_sessions" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "questions_created_idx" ON "questions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "questions_tags_idx" ON "questions" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "translations_entity_idx" ON "translations" USING btree ("entity_type","entity_id","target_lang");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_country_rep_idx" ON "users" USING btree ("country","reputation");