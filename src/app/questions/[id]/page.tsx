import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accept } from "@/app/actions";
import { AnswerForm } from "@/components/forms";
import { Markdown } from "@/components/markdown";
import { Translatable } from "@/components/translatable";
import { AuthorChip, LangFlow, VoteControls } from "@/components/ui";
import { getCurrentUser, getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { getQuestion, getTranslations } from "@/server/queries";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

export async function generateMetadata(props: PageProps<"/questions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const data = await getQuestion(parseId(id), null);
  return { title: data?.question.title ?? "Question" };
}

export default async function QuestionPage(props: PageProps<"/questions/[id]">) {
  const id = parseId((await props.params).id);
  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  const data = await getQuestion(id, user?.id ?? null);
  if (!data) notFound();
  const { question, answers, myVotes } = data;
  const t = dict(lang);

  // Translations are only needed for posts written in the other language.
  const translations = await getTranslations(
    [
      ...(question.lang !== lang ? [{ type: "question" as const, id: question.id }] : []),
      ...answers.filter((a) => a.lang !== lang).map((a) => ({ type: "answer" as const, id: a.id })),
    ],
    lang,
  );
  const labels = { translated: t.q.translated, showOriginal: t.q.showOriginal, showTranslation: t.q.showTranslation };
  const qt = translations.get(`question:${question.id}`);
  const isAuthor = user?.id === question.authorId;

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-8">
        <header className="space-y-4">
          <Link href="/questions" className="text-sm font-semibold text-muted hover:text-accent-strong">← {t.nav.questions}</Link>
          <div className="flex flex-wrap items-center gap-2">
            <LangFlow from={question.lang} to={qt ? lang : null} />
            {question.tags.map((tag) => (
              <Link key={tag} href={`/questions?tag=${encodeURIComponent(tag)}`} className="tag">{tag}</Link>
            ))}
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{qt?.title ?? question.title}</h1>
          <AuthorChip author={question.author} lang={lang} date={question.createdAt} />
        </header>

        <section className="flex gap-4">
          <VoteControls entity="question" id={question.id} questionId={question.id} score={question.score}
            myVote={myVotes.get(`question:${question.id}`) ?? 0} canVote={!!user && !isAuthor} />
          <div className="card min-w-0 flex-1 p-5 sm:p-6">
            <Translatable labels={labels} original={<Markdown>{question.body}</Markdown>} translated={qt ? <Markdown>{qt.body}</Markdown> : null} />
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
            <span className="grid h-7 min-w-7 place-items-center rounded-md border border-border bg-surface-2 px-1.5 font-mono text-sm">{answers.length}</span>
            {t.q.answers}
          </h2>
          {answers.length === 0 && (
            <div className="card border-dashed p-8 text-center text-sm text-muted">{t.q.unanswered} — {t.q.yourAnswer.toLowerCase()} ?</div>
          )}
          {answers.map((a) => {
            const at = translations.get(`answer:${a.id}`);
            const isAccepted = question.acceptedAnswerId === a.id;
            return (
              <div key={a.id} className="flex gap-4">
                <VoteControls entity="answer" id={a.id} questionId={question.id} score={a.score}
                  myVote={myVotes.get(`answer:${a.id}`) ?? 0} canVote={!!user && user.id !== a.authorId} />
                <div className={`card min-w-0 flex-1 overflow-hidden ${isAccepted ? "border-green/50" : ""}`}>
                  {isAccepted && (
                    <div className="flex items-center gap-2 border-b border-green/30 bg-green-soft px-5 py-2 text-xs font-medium text-green">
                      <span aria-hidden>✓</span> {t.q.accepted}
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    <div className="mb-3"><LangFlow from={a.lang} to={at ? lang : null} /></div>
                    <Translatable labels={labels} original={<Markdown>{a.body}</Markdown>} translated={at ? <Markdown>{at.body}</Markdown> : null} />
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-border pt-4">
                      <AuthorChip author={a.author} lang={lang} date={a.createdAt} />
                      {isAuthor && question.acceptedAnswerId === null && a.authorId !== user?.id && (
                        <form action={accept}>
                          <input type="hidden" name="answerId" value={a.id} />
                          <input type="hidden" name="questionId" value={question.id} />
                          <button className="btn border border-green/50 text-green hover:bg-green-soft">✓ {t.q.accept}</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {user ? (
          <AnswerForm t={t.q} lang={user.lang} questionId={question.id} />
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="font-semibold">{t.q.loginToAnswer}</p>
            <Link href={`/login?next=/questions/${question.id}`} className="btn-primary">{t.nav.login}</Link>
          </div>
        )}
      </div>

      {/* Sidebar: how the bilingual exchange works, and a nudge to book the answerer */}
      <aside className="hidden space-y-4 lg:block">
        <div className="gradient-border sticky top-24 overflow-hidden rounded-xl">
          <div className="space-y-3 p-5 text-sm">
            <p className="eyebrow">FR ⇄ EN</p>
            <p className="font-medium leading-snug">{t.how.s1}</p>
            <p className="text-muted">{t.how.s3}</p>
            {answers[0] && (
              <Link href={`/u/${answers[0].author.username}`} className="btn-gradient w-full">🤝 {t.profile.book}</Link>
            )}
          </div>
        </div>
      </aside>
    </article>
  );
}
