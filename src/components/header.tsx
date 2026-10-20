import Link from "next/link";
import { logout, setLang } from "@/app/actions";
import { getCurrentUser, getLang } from "@/lib/auth";
import { dict, flag } from "@/lib/i18n";

export async function Header() {
  const [user, lang] = await Promise.all([getCurrentUser(), getLang()]);
  const t = dict(lang);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-mono text-sm text-white">
            {"</>"}
          </span>
          <span>{t.brand}</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-4 text-sm">
          <Link href="/questions" className="hover:text-accent">{t.nav.questions}</Link>
          <Link href="/leaderboard" className="hover:text-accent">{t.nav.leaderboard}</Link>
          {user && <Link href="/sessions" className="hover:text-accent">{t.nav.sessions}</Link>}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <form action={setLang}>
            <input type="hidden" name="lang" value={lang === "fr" ? "en" : "fr"} />
            <button className="rounded-md border border-border px-2 py-1 font-mono text-xs hover:bg-surface-2" aria-label="Change language">
              {lang === "fr" ? "EN" : "FR"}
            </button>
          </form>
          {user ? (
            <>
              <Link href="/questions/ask" className="btn-primary hidden sm:inline-flex">{t.nav.ask}</Link>
              <Link href={`/u/${user.username}`} className="flex items-center gap-1 hover:text-accent" title={`${user.reputation} ${t.profile.reputation} · ${user.credits} ${t.profile.credits}`}>
                <span>{flag(user.country)}</span>
                <span className="font-medium">{user.username}</span>
                <span className="rounded bg-green-soft px-1.5 font-mono text-xs text-green">{user.credits}◆</span>
              </Link>
              <form action={logout}>
                <button className="text-muted hover:text-text">{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-accent">{t.nav.login}</Link>
              <Link href="/signup" className="btn-primary">{t.nav.signup}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
