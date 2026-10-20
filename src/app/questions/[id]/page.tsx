import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { accept } from "@/app/actions";
import { AnswerForm } from "@/components/forms";
import { Markdown } from "@/components/markdown";
import { Translatable } from "@/components/translatable";
import { AuthorChip, LangBadge, VoteControls } from "@/components/ui";
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
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {qt?.title ?? question.title} <LangBadge lang={question.lang} />
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <AuthorChip author={question.author} lang={lang} date={question.createdAt} />
          <div className="flex flex-wrap gap-1">
            {question.tags.map((tag) => (
              <Link key={tag} href={`/questions?tag=${encodeURIComponent(tag)}`} className="tag">{tag}</Link>
            ))}
          </div>
        </div>
      </header>

      <section className="flex gap-4">
        <VoteControls entity="question" id={question.id} questionId={question.id} score={question.score}
          myVote={myVotes.get(`question:${question.id}`) ?? 0} canVote={!!user && !isAuthor} />
        <div className="card min-w-0 flex-1 p-5">
          <Translatable labels={labels} original={<Markdown>{question.body}</Markdown>} translated={qt ? <Markdown>{qt.body}</Markdown> : null} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          {answers.length} {t.q.answers}
        </h2>
        {answers.map((a) => {
          const at = translations.get(`answer:${a.id}`);
          const isAccepted = question.acceptedAnswerId === a.id;
          return (
            <div key={a.id} className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <VoteControls entity="answer" id={a.id} questionId={question.id} score={a.score}
                  myVote={myVotes.get(`answer:${a.id}`) ?? 0} canVote={!!user && user.id !== a.authorId} />
                {isAccepted && <span title={t.q.accepted} className="text-2xl text-green">✓</span>}
              </div>
              <div className={`card min-w-0 flex-1 p-5 ${isAccepted ? "border-green ring-1 ring-green" : ""}`}>
                {isAccepted && <p className="mb-2 text-sm font-semibold text-green">✓ {t.q.accepted}</p>}
                <Translatable labels={labels} original={<Markdown>{a.body}</Markdown>} translated={at ? <Markdown>{at.body}</Markdown> : null} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <AuthorChip author={a.author} lang={lang} date={a.createdAt} />
                  {isAuthor && question.acceptedAnswerId === null && a.authorId !== user?.id && (
                    <form action={accept}>
                      <input type="hidden" name="answerId" value={a.id} />
                      <input type="hidden" name="questionId" value={question.id} />
                      <button className="btn-ghost text-green">✓ {t.q.accept}</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {user ? (
        <AnswerForm t={t.q} lang={user.lang} questionId={question.id} />
      ) : (
        <p className="card p-5 text-center">
          <Link href={`/login?next=/questions/${question.id}`} className="font-semibold text-accent underline">{t.nav.login}</Link> — {t.q.loginToAnswer}
        </p>
      )}
    </article>
  );
}
