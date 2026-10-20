import Link from "next/link";
import type { Lang } from "@/db/schema";
import { dict } from "@/lib/i18n";
import { questionTitleTranslations, type listQuestions } from "@/server/queries";
import { AuthorChip, LangBadge } from "./ui";

type Row = Awaited<ReturnType<typeof listQuestions>>[number];

export async function QuestionList({ rows, lang }: { rows: Row[]; lang: Lang }) {
  const t = dict(lang);
  if (rows.length === 0) return <p className="card p-6 text-center text-muted">{t.q.noResults}</p>;

  const foreign = rows.filter((r) => r.lang !== lang).map((r) => r.id);
  const titles = await questionTitleTranslations(foreign, lang);

  return (
    <ul className="card divide-y divide-border">
      {rows.map((q) => (
        <li key={q.id} className="flex gap-4 p-4">
          <div className="hidden w-20 shrink-0 flex-col items-end gap-1 text-sm text-muted sm:flex">
            <span><b className="font-mono text-text">{q.score}</b> {t.q.votes}</span>
            <span className={q.accepted ? "rounded bg-green px-1.5 text-white" : q.answerCount > 0 ? "rounded border border-green px-1.5 text-green" : ""}>
              <b className="font-mono">{q.answerCount}</b> {t.q.answers}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/questions/${q.id}`} className="font-semibold hover:text-accent">
              {titles.get(q.id) ?? q.title}
            </Link>{" "}
            <LangBadge lang={q.lang} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {q.tags.map((tag) => (
                  <Link key={tag} href={`/questions?tag=${encodeURIComponent(tag)}`} className="tag hover:opacity-80">{tag}</Link>
                ))}
              </div>
              <AuthorChip author={q.author} lang={lang} date={q.createdAt} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
