import Link from "next/link";
import type { Lang } from "@/db/schema";
import { dict } from "@/lib/i18n";
import { questionTitleTranslations, type listQuestions } from "@/server/queries";
import { AuthorChip, LangFlow } from "./ui";

type Row = Awaited<ReturnType<typeof listQuestions>>[number];

export async function QuestionList({ rows, lang }: { rows: Row[]; lang: Lang }) {
  const t = dict(lang);
  if (rows.length === 0) {
    return (
      <div className="card grid place-items-center gap-2 border-dashed p-12 text-center">
        <span className="font-mono text-2xl text-muted">{"{ }"}</span>
        <p className="text-sm text-muted">{t.q.noResults}</p>
      </div>
    );
  }

  const foreign = rows.filter((r) => r.lang !== lang).map((r) => r.id);
  const titles = await questionTitleTranslations(foreign, lang);

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {rows.map((q) => {
        const translatedTitle = titles.get(q.id);
        return (
          <li key={q.id} className="group relative flex gap-5 p-4 transition hover:bg-surface-2/50 sm:px-5">
            <div className="hidden w-16 shrink-0 flex-col items-end gap-1 pt-0.5 font-mono text-xs text-muted sm:flex">
              <span><span className="text-text">{q.score}</span> {t.q.votes}</span>
              <span
                className={`rounded px-1.5 py-0.5 ${
                  q.accepted ? "bg-green-soft text-green" : q.answerCount > 0 ? "text-green" : ""
                }`}
              >
                {q.accepted && "✓ "}
                {q.answerCount} {t.q.answers}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-medium leading-snug tracking-tight">
                {/* Stretched link: the whole row is clickable */}
                <Link href={`/questions/${q.id}`} className="after:absolute after:inset-0 group-hover:text-white">
                  {translatedTitle ?? q.title}
                </Link>
              </h3>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <LangFlow from={q.lang} to={translatedTitle ? lang : null} />
                <div className="relative z-10 flex flex-wrap gap-1">
                  {q.tags.map((tag) => (
                    <Link key={tag} href={`/questions?tag=${encodeURIComponent(tag)}`} className="tag">{tag}</Link>
                  ))}
                </div>
                <div className="relative z-10 ml-auto">
                  <AuthorChip author={q.author} lang={lang} date={q.createdAt} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
