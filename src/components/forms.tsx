"use client";

import { useActionState, useEffect, useRef } from "react";
import { askQuestion, login, postAnswer, requestSession, signup, type FormState } from "@/app/actions";
import type { Lang } from "@/db/schema";

type Labels = Record<string, string>;

function Err({ state, name }: { state: FormState; name: string }) {
  const msg = state?.errors?.[name];
  return msg ? <p className="field-error" id={`${name}-error`}>{msg}</p> : null;
}

function FormMessage({ state }: { state: FormState }) {
  if (!state?.message || state.message === "ok") return null;
  return <p role="alert" className="rounded-lg border border-orange/30 bg-orange-soft px-3 py-2 text-sm text-orange">{state.message}</p>;
}

function LangSelect({ name = "lang", defaultValue, label }: { name?: string; defaultValue: Lang; label: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select name={name} defaultValue={defaultValue} className="input">
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

export function AskForm({ t, lang }: { t: Labels; lang: Lang }) {
  const [state, action, pending] = useActionState(askQuestion, undefined);
  return (
    <form action={action} className="card space-y-4 p-5">
      <FormMessage state={state} />
      <label className="block">
        <span className="label">{t.title}</span>
        <input name="title" required minLength={10} maxLength={160} className="input" aria-describedby="title-error" />
        <Err state={state} name="title" />
      </label>
      <label className="block">
        <span className="label">{t.body}</span>
        <textarea name="body" required minLength={20} rows={12} className="input font-mono text-sm" aria-describedby="body-error"
          placeholder={"```js\n// code\n```"} />
        <Err state={state} name="body" />
      </label>
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <label className="block">
          <span className="label">{t.tags}</span>
          <input name="tags" placeholder="react, nextjs, mobile-money" className="input" />
          <Err state={state} name="tags" />
        </label>
        <LangSelect defaultValue={lang} label="Langue / Language" />
      </div>
      <button disabled={pending} className="btn-primary">{pending ? "…" : t.submit}</button>
    </form>
  );
}

export function AnswerForm({ t, lang, questionId }: { t: Labels; lang: Lang; questionId: number }) {
  const [state, action, pending] = useActionState(postAnswer, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.message === "ok") ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="card space-y-3 p-5">
      <h3 className="text-xl font-bold">{t.yourAnswer}</h3>
      <FormMessage state={state} />
      <input type="hidden" name="questionId" value={questionId} />
      <textarea name="body" required minLength={10} rows={8} className="input font-mono text-sm" aria-label={t.yourAnswer} />
      <Err state={state} name="body" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-48"><LangSelect defaultValue={lang} label="Langue / Language" /></div>
        <button disabled={pending} className="btn-primary">{pending ? "…" : t.postAnswer}</button>
      </div>
    </form>
  );
}

export function LoginForm({ t, next }: { t: Labels; next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <span className="label">{t.email}</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="block">
        <span className="label">{t.password}</span>
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </label>
      <button disabled={pending} className="btn-primary w-full">{pending ? "…" : t.login}</button>
    </form>
  );
}

export function SignupForm({ t, lang, countries }: { t: Labels; lang: Lang; countries: [string, string][] }) {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t.username}</span>
          <input name="username" required pattern="[a-zA-Z0-9_]{3,32}" autoComplete="username" className="input" />
          <Err state={state} name="username" />
        </label>
        <label className="block">
          <span className="label">{t.name}</span>
          <input name="name" required autoComplete="name" className="input" />
          <Err state={state} name="name" />
        </label>
      </div>
      <label className="block">
        <span className="label">{t.email}</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
        <Err state={state} name="email" />
      </label>
      <label className="block">
        <span className="label">{t.password}</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <Err state={state} name="password" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{t.country}</span>
          <select name="country" required className="input" defaultValue="SN">
            {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
          <Err state={state} name="country" />
        </label>
        <LangSelect defaultValue={lang} label={t.lang} />
      </div>
      <button disabled={pending} className="btn-primary w-full">{pending ? "…" : t.signup}</button>
    </form>
  );
}

export function BookForm({ t, mentorId, maxCredits }: { t: Labels; mentorId: number; maxCredits: number }) {
  const [state, action, pending] = useActionState(requestSession, undefined);
  return (
    <form action={action} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="mentorId" value={mentorId} />
      <label className="block">
        <span className="label">{t.topic}</span>
        <input name="topic" required minLength={5} maxLength={200} className="input" placeholder="Code review — API Express + Postgres" />
        <Err state={state} name="topic" />
      </label>
      <label className="block">
        <span className="label">{t.message}</span>
        <textarea name="message" rows={3} maxLength={2000} className="input" />
      </label>
      <label className="block">
        <span className="label">{t.offer}</span>
        <input name="credits" type="number" min={1} max={maxCredits} defaultValue={Math.min(2, maxCredits)} required className="input w-28" />
        <Err state={state} name="credits" />
      </label>
      <button disabled={pending} className="btn-primary">{pending ? "…" : t.send}</button>
    </form>
  );
}
