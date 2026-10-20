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
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="glow-panel relative h-28 sm:h-36"><div className="grid-lines absolute inset-0" aria-hidden /></div>
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
          <div className="-mt-12 rounded-full border-4 border-surface">
            <Avatar name={user.name} size={88} />
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
            <p className="text-muted">
              @{user.username} · {flag(user.country)} {COUNTRIES[user.country] ?? user.country} ·{" "}
              <span className="font-mono text-xs uppercase">{user.lang}</span>
            </p>
          </div>
          <dl className="flex gap-3">
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-center">
              <dd className="text-gradient font-mono text-2xl font-semibold">{user.reputation}</dd>
              <dt className="text-xs text-muted">{t.profile.reputation}</dt>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-center">
              <dd className="text-2xl font-semibold">{answerCount}</dd>
              <dt className="text-xs text-muted">{t.profile.answers}</dt>
            </div>
          </dl>
        </div>
        {(user.bio || user.skills.length > 0) && (
          <div className="space-y-3 border-t border-dashed border-border px-6 py-5">
            {user.bio && <p className="text-lg">{user.bio}</p>}
            {user.skills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="eyebrow mr-1">{t.profile.skills}</span>
                {user.skills.map((s) => <span key={s} className="tag">{s}</span>)}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">{t.profile.questions}</h2>
          <QuestionList rows={recentQuestions} lang={lang} />
        </section>

        {!isSelf && (
          <aside className="card h-fit overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-xl font-bold">🤝 {t.profile.book}</h2>
              <p className="mt-1 text-sm text-muted">{t.how.s3}</p>
            </div>
            <div className="p-5">
              {!viewer ? (
                <p className="text-sm text-muted">{t.profile.loginToBook}</p>
              ) : maxOffer < RULES.helpSession.minCredits ? (
                <p className="text-sm text-muted">{t.profile.noCredits}</p>
              ) : (
                <>
                  <p className="mb-4 inline-flex rounded-md border border-orange/30 bg-orange-soft px-2.5 py-1 font-mono text-xs text-orange">◆ {viewer.credits} {t.profile.credits}</p>
                  <BookForm t={t.profile} mentorId={user.id} maxCredits={maxOffer} />
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
