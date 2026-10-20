import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { getLang } from "@/lib/auth";
import { COUNTRIES, dict, flag } from "@/lib/i18n";
import { countryRanking, leaderboard } from "@/server/queries";

export const metadata: Metadata = { title: "Leaderboard" };

// Display order left→right: 2nd, 1st, 3rd
const PODIUM = [
  { place: 2, height: "h-20", ring: "ring-[#c0c4cc]/40" },
  { place: 1, height: "h-28", ring: "ring-accent/60" },
  { place: 3, height: "h-14", ring: "ring-orange/40" },
];

export default async function LeaderboardPage(props: PageProps<"/leaderboard">) {
  const sp = await props.searchParams;
  const country = typeof sp.country === "string" && sp.country in COUNTRIES ? sp.country : undefined;
  const [lang, devs, countries] = await Promise.all([getLang(), leaderboard(country), countryRanking()]);
  const t = dict(lang);
  const maxRep = Math.max(1, ...countries.map((c) => c.reputation));

  return (
    <div className="space-y-10">
      <header className="glow-panel relative -mx-4 -mt-8 overflow-hidden px-4 pt-14 sm:-mt-12">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative text-center">
          <p className="eyebrow">{t.board.title}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {country ? `${flag(country)} ${COUNTRIES[country]}` : <>🌍 <span className="text-gradient">{t.board.global}</span></>}
          </h1>
          {country && <Link href="/leaderboard" className="mt-3 inline-block text-sm text-muted hover:text-text">← {t.board.global}</Link>}
        </div>

        {/* Podium for the top three */}
        <div className="relative mx-auto mt-12 grid max-w-lg grid-cols-3 items-end gap-3">
          {PODIUM.map((p) => {
            const d = devs[p.place - 1];
            if (!d) return <div key={p.place} />;
            return (
              <div key={p.place} className="flex flex-col items-center text-center">
                <span className={`rounded-full ring-4 ${p.ring}`}>
                  <Avatar name={d.name} size={p.place === 1 ? 60 : 46} />
                </span>
                <Link href={`/u/${d.username}`} className="mt-3 line-clamp-1 text-sm font-medium hover:text-white">{d.name}</Link>
                <span className="font-mono text-xs text-muted">{flag(d.country)} {d.reputation}</span>
                <div className={`mt-3 w-full ${p.height} grid place-items-center rounded-t-lg border border-b-0 border-border bg-surface/80 font-mono text-2xl font-semibold backdrop-blur ${p.place === 1 ? "text-gradient" : "text-muted"}`}>
                  {p.place}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {devs.slice(3).map((d, i) => (
              <li key={d.username} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-surface-2/50">
                <span className="w-5 font-mono text-sm text-muted">{i + 4}</span>
                <Avatar name={d.name} size={34} />
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${d.username}`} className="text-sm font-medium hover:text-white">{d.name}</Link>{" "}
                  <span className="text-xs text-muted">{flag(d.country)} @{d.username}</span>
                  <div className="mt-1 flex flex-wrap gap-1">{d.skills.slice(0, 4).map((s) => <span key={s} className="tag">{s}</span>)}</div>
                </div>
                <span className="font-mono text-sm font-semibold">{d.reputation}</span>
              </li>
            ))}
            {devs.length <= 3 && <li className="p-6 text-center text-sm text-muted">—</li>}
          </ol>
        </section>

        <aside>
          <h2 className="mb-3 text-sm font-semibold">{t.board.byCountry}</h2>
          <ol className="space-y-1.5">
            {countries.map((c, i) => (
              <li key={c.country}>
                <Link
                  href={`/leaderboard?country=${c.country}`}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-sm transition ${c.country === country ? "border-accent/60 bg-accent-soft" : "border-border bg-surface hover:border-border-strong"}`}
                >
                  {/* bar shows the country's share of the top score */}
                  <span className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/15 to-orange/10" style={{ width: `${(c.reputation / maxRep) * 100}%` }} aria-hidden />
                  <span className="relative w-4 font-mono text-xs text-muted">{i + 1}</span>
                  <span className="relative text-lg">{flag(c.country)}</span>
                  <span className="relative flex-1">
                    {COUNTRIES[c.country] ?? c.country}
                    <span className="ml-2 text-xs text-muted">{c.devs} {t.board.devs}</span>
                  </span>
                  <span className="relative font-mono text-xs">{c.reputation}</span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
