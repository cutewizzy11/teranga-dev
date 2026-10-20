import Link from "next/link";
import { vote } from "@/app/actions";
import { flag } from "@/lib/i18n";
import type { Lang } from "@/db/schema";

export function timeAgo(date: Date, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const s = Math.round((date.getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [unit, secs] of steps) if (Math.abs(s) >= secs) return rtf.format(Math.round(s / secs), unit);
  return rtf.format(s, "second");
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  let hue = 0;
  for (const c of name) hue = (hue * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `hsl(${hue} 45% 42%)` }}
    >
      {initials}
    </span>
  );
}

export function AuthorChip({ author, lang, date }: { author: { username: string; name: string; country: string; reputation: number }; lang: Lang; date: Date }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Avatar name={author.name} size={22} />
      <Link href={`/u/${author.username}`} className="font-medium text-text hover:text-accent">{author.username}</Link>
      <span title={author.country}>{flag(author.country)}</span>
      <span className="font-mono text-xs">{author.reputation}</span>
      <span>· {timeAgo(date, lang)}</span>
    </span>
  );
}

export function LangBadge({ lang }: { lang: Lang }) {
  return <span className="rounded border border-border px-1 font-mono text-[10px] uppercase text-muted">{lang}</span>;
}

/** Up/down vote controls. Plain forms, so voting works without JavaScript. Clicking your current vote clears it. */
export function VoteControls({
  entity, id, questionId, score, myVote, canVote,
}: { entity: "question" | "answer"; id: number; questionId: number; score: number; myVote: number; canVote: boolean }) {
  const btn = (value: 1 | -1, label: string, symbol: string) => (
    <form action={vote}>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="value" value={myVote === value ? 0 : value} />
      <button
        disabled={!canVote}
        aria-label={label}
        aria-pressed={myVote === value}
        className={`grid h-9 w-9 place-items-center rounded-full border text-lg transition disabled:opacity-40 ${
          myVote === value ? "border-accent bg-accent text-white" : "border-border hover:border-accent hover:text-accent"
        }`}
      >
        {symbol}
      </button>
    </form>
  );
  return (
    <div className="flex flex-col items-center gap-1">
      {btn(1, "Upvote", "▲")}
      <span className="font-mono text-lg font-semibold">{score}</span>
      {btn(-1, "Downvote", "▼")}
    </div>
  );
}
