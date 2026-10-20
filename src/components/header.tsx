import Link from "next/link";
import { logout, setLang } from "@/app/actions";
import { getCurrentUser, getLang } from "@/lib/auth";
import { dict, flag } from "@/lib/i18n";
import { LogoMark, Wordmark } from "./logo";
import { Avatar } from "./ui";

export async function Header() {
  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  const t = dict(lang);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Teranga Dev">
          <LogoMark />
          <Wordmark />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 text-sm sm:flex">
          {[
            ["/questions", t.nav.questions],
            ["/leaderboard", t.nav.leaderboard],
            ...(user ? [["/sessions", t.nav.sessions]] : []),
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-muted transition hover:bg-surface-2 hover:text-text">
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <form action={setLang}>
            <input type="hidden" name="lang" value={lang === "fr" ? "en" : "fr"} />
            <button
              className="flex items-center rounded-md border border-border bg-surface p-0.5 font-mono text-[11px]"
              aria-label={lang === "fr" ? "Switch to English" : "Passer en français"}
            >
              <span className={`rounded px-1.5 py-0.5 ${lang === "fr" ? "bg-surface-2 text-text" : "text-muted"}`}>FR</span>
              <span className={`rounded px-1.5 py-0.5 ${lang === "en" ? "bg-surface-2 text-text" : "text-muted"}`}>EN</span>
            </button>
          </form>
          {user ? (
            <>
              <Link href="/questions/ask" className="btn-primary hidden h-8 py-0 sm:inline-flex">{t.nav.ask}</Link>
              <Link
                href={`/u/${user.username}`}
                className="flex items-center gap-2 rounded-full border border-border py-0.5 pl-0.5 pr-2.5 transition hover:border-border-strong"
                title={`${user.reputation} ${t.profile.reputation} · ${user.credits} ${t.profile.credits}`}
              >
                <Avatar name={user.name} size={26} />
                <span className="hidden font-medium md:inline">{flag(user.country)} {user.username}</span>
                <span className="font-mono text-xs text-orange">◆ {user.credits}</span>
              </Link>
              <form action={logout}>
                <button className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-text" aria-label={t.nav.logout} title={t.nav.logout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-1.5 text-muted hover:text-text">{t.nav.login}</Link>
              <Link href="/signup" className="btn-primary h-8 py-0">{t.nav.signup}</Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-1.5 text-sm sm:hidden">
        {[
          ["/questions", t.nav.questions],
          ["/leaderboard", t.nav.leaderboard],
          ...(user ? [["/questions/ask", t.nav.ask], ["/sessions", t.nav.sessions]] : []),
        ].map(([href, label]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-1 text-muted hover:bg-surface-2 hover:text-text">{label}</Link>
        ))}
      </nav>
    </header>
  );
}
