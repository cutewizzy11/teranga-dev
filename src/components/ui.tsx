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

// Gradient pairs for avatars, picked deterministically from the name.
const AVATAR_GRADIENTS = [
  ["#8b5cf6", "#e0609b"],
  ["#e0609b", "#ff8a4c"],
  ["#3b82f6", "#8b5cf6"],
  ["#10b981", "#3b82f6"],
  ["#ff8a4c", "#f5c542"],
  ["#06b6d4", "#10b981"],
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-1 ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {initials}
    </span>
  );
}

export function AuthorChip({ author, lang, date }: { author: { username: string; name: string; country: string; reputation: number }; lang: Lang; date: Date }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Avatar name={author.name} size={18} />
      <Link href={`/u/${author.username}`} className="font-medium text-text/90 hover:text-white">{author.username}</Link>
      <span title={author.country}>{flag(author.country)}</span>
      <span className="font-mono">{author.reputation}</span>
      <span>· {timeAgo(date, lang)}</span>
    </span>
  );
}

/** Shows the post's original language, and the arrow to the reader's language when a translation is displayed. */
export function LangFlow({ from, to }: { from: Lang; to: Lang | null }) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase">
      <span className="rounded border border-border px-1.5 py-px text-muted">{from}</span>
      {to && (
        <>
          <span className="text-muted">→</span>
          <span className="rounded border border-accent/40 bg-accent-soft px-1.5 py-px text-accent-strong">{to}</span>
        </>
      )}
    </span>
  );
}

/** Up/down vote controls. Plain forms, so voting works without JavaScript. Clicking your current vote clears it. */
export function VoteControls({
  entity, id, questionId, score, myVote, canVote,
}: { entity: "question" | "answer"; id: number; questionId: number; score: number; myVote: number; canVote: boolean }) {
  const btn = (value: 1 | -1, label: string, path: string) => (
    <form action={vote}>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="value" value={myVote === value ? 0 : value} />
      <button
        disabled={!canVote}
        aria-label={label}
        aria-pressed={myVote === value}
        className={`grid h-8 w-8 place-items-center rounded-md border transition disabled:opacity-30 ${
          myVote === value
            ? value === 1 ? "border-accent bg-accent/20 text-accent-strong" : "border-orange bg-orange-soft text-orange"
            : "border-border bg-surface text-muted hover:border-border-strong hover:text-text"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden><path d={path} fill="currentColor" /></svg>
      </button>
    </form>
  );
  return (
    <div className="flex flex-col items-center gap-1">
      {btn(1, "Upvote", "M8 3l6 8H2z")}
      <span className="py-0.5 font-mono text-sm font-semibold">{score}</span>
      {btn(-1, "Downvote", "M8 13L2 5h12z")}
    </div>
  );
}
