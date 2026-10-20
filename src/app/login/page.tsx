import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms";
import { getLang } from "@/lib/auth";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const t = dict(await getLang());
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <h1 className="text-center text-3xl font-bold">{t.auth.login}</h1>
      <div className="card p-6">
        <LoginForm t={t.auth} next={next} />
      </div>
      {process.env.DEMO_ACCOUNT_HINT !== "off" && (
        <p className="card bg-green-soft p-4 text-center text-sm text-green">
          {t.auth.demo}: <code className="font-mono">demo@teranga.dev</code> / <code className="font-mono">Demo2026!</code>
        </p>
      )}
      <p className="text-center text-sm text-muted">
        {t.auth.noAccount} <Link href="/signup" className="font-semibold text-accent">{t.nav.signup}</Link>
      </p>
    </div>
  );
}
