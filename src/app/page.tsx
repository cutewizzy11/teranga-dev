import Link from "next/link";
import { QuestionList } from "@/components/question-list";
import { TranslationDemo } from "@/components/translation-demo";
import { Avatar } from "@/components/ui";
import { getCurrentUser, getLang } from "@/lib/auth";
import { COUNTRIES, dict, flag } from "@/lib/i18n";
import { leaderboard, listQuestions, platformStats, popularTags } from "@/server/queries";

const FEATURE_ICONS = [
  // chat bubble
  "M4 5h16v11H8l-4 4z",
  // check badge
  "M12 3l2.5 2 3.2-.3.9 3.1 2.6 1.9-1.3 2.9 1.3 2.9-2.6 1.9-.9 3.1-3.2-.3L12 21l-2.5-2-3.2.3-.9-3.1-2.6-1.9 1.3-2.9-1.3-2.9 2.6-1.9.9-3.1 3.2.3z M8.5 12l2.5 2.5 4.5-5",
  // exchange arrows
  "M7 7h11l-3-3M17 17H6l3 3",
];

export default async function Home() {
  const [lang, user, stats, latest, tags, top] = await Promise.all([
    getLang(),
    getCurrentUser(),
    platformStats(),
    listQuestions({ limit: 5 }),
    popularTags(12),
    leaderboard(),
  ]);
  const t = dict(lang);
  const countries = Object.keys(COUNTRIES);

  return (
    <div className="space-y-24">
      {/* ---------- Hero ---------- */}
      <section className="glow-panel relative -mx-4 -mt-8 overflow-hidden px-4 pb-16 pt-16 sm:-mt-12 sm:pt-24">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-up">
            <Link href="/questions" className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur transition hover:border-border-strong hover:text-text">
              <span className="rounded-full bg-accent/20 px-1.5 py-px font-mono text-[10px] text-accent-strong">NEW</span>
              {t.home.eyebrow} <span aria-hidden>→</span>
            </Link>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
              {t.home.titleA}
              <br />
              <span className="text-gradient">{t.home.titleB}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/questions/ask" : "/signup"} className="btn-gradient h-11 px-6 text-base">
                {user ? t.nav.ask : t.hero.cta} <span aria-hidden>→</span>
              </Link>
              <Link href="/questions" className="btn-ghost h-11 px-6 text-base">{t.hero.browse}</Link>
            </div>
          </div>
          <TranslationDemo />
        </div>

        <dl className="relative mx-auto mt-16 grid max-w-6xl grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface/60 backdrop-blur sm:grid-cols-4">
          {[
            [stats.devs, t.stats.devs],
            [stats.countries, t.stats.countries],
            [stats.questions, t.stats.questions],
            [stats.answers, t.stats.answers],
          ].map(([n, label], i) => (
            <div key={String(label)} className={`px-6 py-5 ${i > 0 ? "border-l border-border" : ""} ${i === 2 ? "max-sm:border-l-0 max-sm:border-t" : ""} ${i === 3 ? "max-sm:border-t" : ""}`}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 font-mono text-3xl font-semibold tracking-tight">{n}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Countries ---------- */}
      <section aria-label={t.home.from} className="-mt-8">
        <p className="mb-5 text-center text-sm text-muted">{t.home.from} {countries.length} {t.stats.countries}</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee flex w-max gap-8">
            {[...countries, ...countries].map((c, i) => (
              <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm text-muted">
                <span className="text-xl grayscale-[30%]">{flag(c)}</span> {COUNTRIES[c]}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t.how.title}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.tagline}</h2>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {[
            { title: t.how.s1t, body: t.how.s1 },
            { title: t.how.s2t, body: t.how.s2 },
            { title: t.how.s3t, body: t.how.s3 },
          ].map((f, i) => (
            <div key={f.title} className="group bg-surface p-8 transition hover:bg-surface-2/60">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface-2 text-accent-strong transition group-hover:border-accent/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={FEATURE_ICONS[i]} />
                </svg>
              </div>
              <h3 className="mt-5 font-semibold">
                <span className="mr-2 font-mono text-xs text-muted">0{i + 1}</span>
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Latest questions + sidebar ---------- */}
      <section className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{t.q.latest}</h2>
            <Link href="/questions" className="text-sm text-muted hover:text-text">{t.home.viewAll} →</Link>
          </div>
          <QuestionList rows={latest} lang={lang} />
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold">{t.home.topDevs}</h3>
            <ol className="mt-4 space-y-3">
              {top.slice(0, 5).map((d, i) => (
                <li key={d.username} className="flex items-center gap-3">
                  <span className="w-3 font-mono text-xs text-muted">{i + 1}</span>
                  <Avatar name={d.name} size={28} />
                  <Link href={`/u/${d.username}`} className="min-w-0 flex-1 truncate text-sm hover:text-accent-strong">
                    {d.name} <span>{flag(d.country)}</span>
                  </Link>
                  <span className="font-mono text-xs text-muted">{d.reputation}</span>
                </li>
              ))}
            </ol>
            <Link href="/leaderboard" className="mt-5 block border-t border-border pt-4 text-sm text-muted hover:text-text">{t.home.allRanking} →</Link>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold">{t.home.popular}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link key={tag.tag} href={`/questions?tag=${encodeURIComponent(tag.tag)}`} className="tag">
                  {tag.tag} <span className="opacity-60">{tag.n}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* ---------- Closing CTA ---------- */}
      {!user && (
        <section className="glow-panel relative overflow-hidden rounded-2xl border border-border px-6 py-16 text-center">
          <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">{t.home.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted">{t.home.ctaBody}</p>
            <Link href="/signup" className="btn-primary mt-8 h-11 px-6 text-base">{t.hero.cta} →</Link>
          </div>
        </section>
      )}
    </div>
  );
}
