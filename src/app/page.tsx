import Link from "next/link";
import { QuestionList } from "@/components/question-list";
import { getCurrentUser, getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";
import { translationEnabled } from "@/lib/translate";
import { listQuestions, platformStats, popularTags } from "@/server/queries";

export default async function Home() {
  const [lang, user, stats, latest, tags] = await Promise.all([
    getLang(),
    getCurrentUser(),
    platformStats(),
    listQuestions({ limit: 6 }),
    popularTags(10),
  ]);
  const t = dict(lang);

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
            FR ⇄ EN {translationEnabled() ? "· auto" : ""}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t.hero.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t.hero.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={user ? "/questions/ask" : "/signup"} className="btn-primary px-5 py-2.5 text-base">
              {user ? t.nav.ask : t.hero.cta}
            </Link>
            <Link href="/questions" className="btn-ghost px-5 py-2.5 text-base">{t.hero.browse}</Link>
          </div>
        </div>

        {/* Illustrates the core idea: one question, two languages, code untouched */}
        <div className="card overflow-hidden shadow-sm" aria-hidden>
          <div className="border-b border-border bg-surface-2 px-4 py-2 font-mono text-xs text-muted">🇸🇳 awa_dev · FR</div>
          <div className="p-4 text-sm">
            <p className="font-semibold">Pourquoi mon <code className="rounded bg-surface-2 px-1">useEffect</code> s&apos;exécute deux fois ?</p>
          </div>
          <div className="border-y border-border bg-surface-2 px-4 py-2 font-mono text-xs text-muted">↓ 🇳🇬 seen by chidi_codes · EN</div>
          <div className="p-4 text-sm">
            <p className="font-semibold">Why does my <code className="rounded bg-surface-2 px-1">useEffect</code> run twice?</p>
            <p className="mt-2 text-muted">✓ Answered in English · translated back to French</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [stats.devs, t.stats.devs],
          [stats.countries, t.stats.countries],
          [stats.questions, t.stats.questions],
          [stats.answers, t.stats.answers],
        ].map(([n, label]) => (
          <div key={String(label)} className="card p-4 text-center">
            <div className="font-mono text-3xl font-bold text-accent">{n}</div>
            <div className="text-sm text-muted">{label}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">{t.how.title}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["1", t.how.s1t, t.how.s1],
            ["2", t.how.s2t, t.how.s2],
            ["3", t.how.s3t, t.how.s3],
          ].map(([n, title, body]) => (
            <div key={n} className="card p-5">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-accent font-bold text-white">{n}</div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold">{t.q.latest}</h2>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Link key={tag.tag} href={`/questions?tag=${encodeURIComponent(tag.tag)}`} className="tag hover:opacity-80">
                {tag.tag} <span className="ml-1 opacity-60">{tag.n}</span>
              </Link>
            ))}
          </div>
        </div>
        <QuestionList rows={latest} lang={lang} />
      </section>
    </div>
  );
}
