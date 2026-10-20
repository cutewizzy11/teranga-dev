import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/forms";
import { getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const t = dict(await getLang());
  return (
    <AuthShell title={t.auth.login} aside={{ headline: t.home.ctaTitle, body: t.hero.subtitle }}>
      <LoginForm t={t.auth} next={next} />
      {process.env.DEMO_ACCOUNT_HINT !== "off" && (
        <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-surface-2/50 p-4 text-sm">
          <p className="font-medium">{t.auth.demo}</p>
          <p className="mt-1.5 flex flex-wrap gap-2 font-mono text-xs"><span className="kbd">demo@teranga.dev</span><span className="kbd">Demo2026!</span></p>
        </div>
      )}
      <p className="mt-6 text-sm text-muted">
        {t.auth.noAccount} <Link href="/signup" className="font-medium text-text hover:underline">{t.nav.signup}</Link>
      </p>
    </AuthShell>
  );
}
