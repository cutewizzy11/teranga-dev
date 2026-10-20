import type { Metadata } from "next";
import Link from "next/link";
import { QuestionList } from "@/components/question-list";
import { getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { listQuestions, popularTags } from "@/server/queries";

export const metadata: Metadata = { title: "Questions" };

export default async function QuestionsPage(props: PageProps<"/questions">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag.slice(0, 40) : undefined;
  const unanswered = sp.filter === "unanswered";

  const [lang, rows, tags] = await Promise.all([getLang(), listQuestions({ q, tag, unanswered, limit: 50 }), popularTags(16)]);
  const t = dict(lang);

  const chip = (href: string, label: string, active: boolean) => (
    <Link href={href} className={`rounded-md border px-3 py-1 text-sm transition ${active ? "border-border-strong bg-surface-2 text-text" : "border-border text-muted hover:border-border-strong hover:text-text"}`}>
      {label}
    </Link>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">FR ⇄ EN</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {tag ? <span className="font-mono">#{tag}</span> : t.nav.questions}
            </h1>
          </div>
          <Link href="/questions/ask" className="btn-primary">{t.nav.ask}</Link>
        </div>

        <form role="search" className="relative">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input name="q" defaultValue={q} placeholder={t.q.search} className="input py-3 pl-11 text-base" aria-label={t.q.search} />
          {tag && <input type="hidden" name="tag" value={tag} />}
        </form>

        <div className="flex flex-wrap gap-2">
          {chip("/questions", t.home.viewAll, !unanswered && !tag)}
          {chip("/questions?filter=unanswered", t.q.unanswered, unanswered)}
          {tag && chip("/questions", `#${tag} ✕`, true)}
        </div>

        <QuestionList rows={rows} lang={lang} />
      </div>

      <aside className="hidden lg:block">
        <div className="card sticky top-24 p-5">
          <h2 className="text-sm font-semibold">{t.home.popular}</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tg) => (
              <Link key={tg.tag} href={`/questions?tag=${encodeURIComponent(tg.tag)}`} className={`tag ${tg.tag === tag ? "!border-accent/60 !text-text" : ""}`}>
                {tg.tag} <span className="opacity-60">{tg.n}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
