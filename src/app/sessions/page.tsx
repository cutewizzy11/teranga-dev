import type { Metadata } from "next";
import Link from "next/link";
import { updateSession } from "@/app/actions";
import { timeAgo } from "@/components/ui";
import { getLang, requireUser } from "@/lib/auth";
import { dict, flag } from "@/lib/i18n";
import { mySessions } from "@/server/queries";

export const metadata: Metadata = { title: "Sessions" };

const STATUS_STYLE: Record<string, string> = {
  pending: "border border-orange/30 bg-orange-soft text-orange",
  accepted: "border border-accent/40 bg-accent-soft text-accent-strong",
  completed: "border border-green/40 bg-green-soft text-green",
  declined: "border border-border text-muted",
  cancelled: "border border-border text-muted",
};

export default async function SessionsPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = dict(lang);
  const sessions = await mySessions(user.id);
  const incoming = sessions.filter((s) => s.mentorId === user.id);
  const outgoing = sessions.filter((s) => s.requesterId === user.id);

  const action = (id: number, name: string, label: string, primary = false) => (
    <form action={updateSession}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={name} />
      <button className={primary ? "btn-primary" : "btn-ghost"}>{label}</button>
    </form>
  );

  const list = (rows: typeof sessions, role: "mentor" | "requester") =>
    rows.length === 0 ? (
      <p className="card p-5 text-center text-muted">{t.sessions.none}</p>
    ) : (
      <ul className="space-y-3">
        {rows.map((s) => {
          const other = role === "mentor" ? s.requester : s.mentor;
          return (
            <li key={s.id} className="card space-y-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-lg font-bold">{s.topic}</div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>{t.sessions.status[s.status]}</span>
              </div>
              <div className="text-sm text-muted">
                {flag(other.country)} <Link href={`/u/${other.username}`} className="font-medium text-text hover:text-accent-strong">{other.name}</Link>
                {" · "}<span className="font-mono">{s.credits}◆</span>{" · "}{timeAgo(s.createdAt, lang)}
              </div>
              {s.message && <p className="whitespace-pre-line text-sm">{s.message}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {role === "mentor" && s.status === "pending" && (
                  <>{action(s.id, "accept", t.sessions.accept, true)}{action(s.id, "decline", t.sessions.decline)}</>
                )}
                {role === "requester" && s.status === "accepted" && action(s.id, "complete", t.sessions.complete, true)}
                {role === "requester" && (s.status === "pending" || s.status === "accepted") && action(s.id, "cancel", t.sessions.cancel)}
              </div>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">{t.nav.sessions}</h1>
        <span className="rounded-md border border-orange/30 bg-orange-soft px-3 py-1.5 font-mono text-sm text-orange">{user.credits} ◆ {t.profile.credits}</span>
      </div>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t.sessions.incoming}</h2>
        {list(incoming, "mentor")}
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">{t.sessions.outgoing}</h2>
        {list(outgoing, "requester")}
      </section>
    </div>
  );
}
