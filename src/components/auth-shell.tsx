import type { ReactNode } from "react";
import { LogoMark } from "./logo";

/** Centered auth card on the glow backdrop, with a short brand pitch above it. */
export function AuthShell({ title, aside, children }: { title: string; aside: { headline: string; body: string }; children: ReactNode }) {
  return (
    <div className="glow-panel relative -mx-4 -mt-8 min-h-[calc(100vh-10rem)] px-4 pt-14 sm:-mt-12">
      <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 w-fit"><LogoMark size={40} /></div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{aside.headline}</p>
        </div>
        <div className="card p-6 shadow-2xl shadow-black/50 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted">{aside.body}</p>
      </div>
    </div>
  );
}
