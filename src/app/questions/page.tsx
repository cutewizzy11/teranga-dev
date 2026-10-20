import type { Metadata } from "next";
import Link from "next/link";
import { QuestionList } from "@/components/question-list";
import { getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { listQuestions } from "@/server/queries";

export const metadata: Metadata = { title: "Questions" };

export default async function QuestionsPage(props: PageProps<"/questions">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag.slice(0, 40) : undefined;
  const unanswered = sp.filter === "unanswered";

  const [lang, rows] = await Promise.all([getLang(), listQuestions({ q, tag, unanswered, limit: 50 })]);
  const t = dict(lang);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          {t.nav.questions}
          {tag && <span className="tag ml-3 align-middle text-sm">{tag}</span>}
        </h1>
        <Link href="/questions/ask" className="btn-primary">{t.nav.ask}</Link>
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder={t.q.search} className="input max-w-md flex-1" aria-label={t.q.search} />
        {tag && <input type="hidden" name="tag" value={tag} />}
        <button className="btn-ghost">🔍</button>
        <Link href={unanswered ? "/questions" : "/questions?filter=unanswered"} className={unanswered ? "btn-primary" : "btn-ghost"}>
          {t.q.unanswered}
        </Link>
      </form>

      <QuestionList rows={rows} lang={lang} />
    </div>
  );
}
