import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/forms";
import { QuestionList } from "@/components/question-list";
import { Avatar } from "@/components/ui";
import { getCurrentUser, getLang } from "@/lib/auth";
import { COUNTRIES, dict, flag } from "@/lib/i18n";
import { RULES } from "@/server/rules";
import { getProfile } from "@/server/queries";

export async function generateMetadata(props: PageProps<"/u/[username]">): Promise<Metadata> {
  return { title: decodeURIComponent((await props.params).username) };
}

export default async function ProfilePage(props: PageProps<"/u/[username]">) {
  const username = decodeURIComponent((await props.params).username).slice(0, 32);
  const [viewer, lang, profile] = await Promise.all([getCurrentUser(), getLang(), getProfile(username)]);
  if (!profile) notFound();
  const { user, answerCount, recentQuestions } = profile;
  const t = dict(lang);
  const isSelf = viewer?.id === user.id;
  const maxOffer = Math.min(viewer?.credits ?? 0, RULES.helpSession.maxCredits);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="card flex flex-wrap items-center gap-5 p-6">
          <Avatar name={user.name} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted">
              @{user.username} · {flag(user.country)} {COUNTRIES[user.country] ?? user.country}
            </p>
            {user.bio && <p className="mt-2">{user.bio}</p>}
          </div>
          <div className="flex gap-6 text-center">
            <div><div className="font-mono text-2xl font-bold text-accent">{user.reputation}</div><div className="text-xs text-muted">{t.profile.reputation}</div></div>
            <div><div className="font-mono text-2xl font-bold">{answerCount}</div><div className="text-xs text-muted">{t.profile.answers}</div></div>
          </div>
        </section>

        {user.skills.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold">{t.profile.skills}</h2>
            <div className="flex flex-wrap gap-1">{user.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
          </section>
        )}

        <section>
          <h2 className="mb-2 font-semibold">{t.profile.questions}</h2>
          <QuestionList rows={recentQuestions} lang={lang} />
        </section>
      </div>

      {!isSelf && (
        <aside className="card h-fit space-y-3 p-5">
          <h2 className="font-semibold">🤝 {t.profile.book}</h2>
          {!viewer ? (
            <p className="text-sm text-muted">{t.profile.loginToBook}</p>
          ) : maxOffer < RULES.helpSession.minCredits ? (
            <p className="text-sm text-muted">{t.profile.noCredits}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{viewer.credits} {t.profile.credits} ◆</p>
              <BookForm t={t.profile} mentorId={user.id} maxCredits={maxOffer} />
            </>
          )}
        </aside>
      )}
    </div>
  );
}
