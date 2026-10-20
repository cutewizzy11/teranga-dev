import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { getLang } from "@/lib/auth";
import { COUNTRIES, dict, flag } from "@/lib/i18n";
import { countryRanking, leaderboard } from "@/server/queries";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage(props: PageProps<"/leaderboard">) {
  const sp = await props.searchParams;
  const country = typeof sp.country === "string" && sp.country in COUNTRIES ? sp.country : undefined;
  const [lang, devs, countries] = await Promise.all([getLang(), leaderboard(country), countryRanking()]);
  const t = dict(lang);
  const medal = (i: number) => ["🥇", "🥈", "🥉"][i] ?? <span className="font-mono text-muted">{i + 1}</span>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">
          {t.board.title} · {country ? `${flag(country)} ${COUNTRIES[country]}` : `🌍 ${t.board.global}`}
        </h1>
        {country && <Link href="/leaderboard" className="text-sm text-accent underline">← {t.board.global}</Link>}
        <ol className="card divide-y divide-border">
          {devs.map((d, i) => (
            <li key={d.username} className="flex items-center gap-3 p-3">
              <span className="w-7 text-center text-lg">{medal(i)}</span>
              <Avatar name={d.name} />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${d.username}`} className="font-semibold hover:text-accent">{d.name}</Link>{" "}
                <span className="text-sm text-muted">{flag(d.country)} @{d.username}</span>
                <div className="mt-1 flex flex-wrap gap-1">{d.skills.slice(0, 4).map((s) => <span key={s} className="tag">{s}</span>)}</div>
              </div>
              <span className="font-mono font-bold text-accent">{d.reputation}</span>
            </li>
          ))}
        </ol>
      </section>

      <aside className="space-y-3">
        <h2 className="text-xl font-semibold">{t.board.byCountry}</h2>
        <ol className="card divide-y divide-border">
          {countries.map((c, i) => (
            <li key={c.country}>
              <Link href={`/leaderboard?country=${c.country}`} className={`flex items-center gap-3 p-3 hover:bg-surface-2 ${c.country === country ? "bg-accent-soft" : ""}`}>
                <span className="w-6 text-center font-mono text-sm text-muted">{i + 1}</span>
                <span className="text-xl">{flag(c.country)}</span>
                <span className="flex-1">{COUNTRIES[c.country] ?? c.country}<span className="block text-xs text-muted">{c.devs} {t.board.devs}</span></span>
                <span className="font-mono font-semibold">{c.reputation}</span>
              </Link>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
