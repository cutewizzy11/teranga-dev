import type { Metadata } from "next";
import { AskForm } from "@/components/forms";
import { getLang, requireUser } from "@/lib/auth";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Ask" };

export default async function AskPage() {
  const user = await requireUser();
  const t = dict(await getLang());
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="eyebrow">FR ⇄ EN</p>
      <h1 className="text-4xl font-semibold tracking-tight">{t.nav.ask}</h1>
      <p className="text-muted">
        {user.lang === "fr"
          ? "Écris dans ta langue : ta question sera traduite automatiquement en anglais. Le code reste intact."
          : "Write in your language: your question is translated to French automatically. Code stays untouched."}
      </p>
      <AskForm t={t.q} lang={user.lang} />
    </div>
  );
}
