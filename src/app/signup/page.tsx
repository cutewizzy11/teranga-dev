import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms";
import { getLang } from "@/lib/auth";
import { COUNTRIES, dict, flag } from "@/lib/i18n";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  const lang = await getLang();
  const t = dict(lang);
  const countries = Object.entries(COUNTRIES)
    .sort((a, b) => a[1].localeCompare(b[1], lang))
    .map(([code, name]) => [code, `${flag(code)} ${name}`] as [string, string]);
  return (
    <div className="mx-auto max-w-lg space-y-6 pt-6">
      <h1 className="text-center text-3xl font-bold">{t.hero.cta}</h1>
      <div className="card p-6">
        <SignupForm t={t.auth} lang={lang} countries={countries} />
      </div>
      <p className="text-center text-sm text-muted">
        {t.auth.haveAccount} <Link href="/login" className="font-semibold text-accent">{t.nav.login}</Link>
      </p>
    </div>
  );
}
