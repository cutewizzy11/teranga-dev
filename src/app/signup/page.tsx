import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell title={t.hero.cta} aside={{ headline: `${t.home.titleA} ${t.home.titleB}`, body: `${t.how.s2} ${t.how.s3}` }}>
      <SignupForm t={t.auth} lang={lang} countries={countries} />
      <p className="mt-6 text-sm text-muted">
        {t.auth.haveAccount} <Link href="/login" className="font-medium text-text hover:underline">{t.nav.login}</Link>
      </p>
    </AuthShell>
  );
}
