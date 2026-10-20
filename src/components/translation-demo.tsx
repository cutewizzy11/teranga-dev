"use client";

import { useEffect, useState } from "react";

const SAMPLES = [
  {
    code: "useEffect(() => {\n  fetch('/api/paiements')\n}, [])",
    fr: { who: "🇸🇳 awa_dev", text: "Pourquoi mon useEffect s'exécute deux fois en développement ?" },
    en: { who: "🇳🇬 chidi_codes", text: "Why does my useEffect run twice in development?" },
  },
  {
    code: "INSERT INTO mpesa_callbacks (id)\nVALUES ($1)\nON CONFLICT DO NOTHING;",
    fr: { who: "🇨🇲 nadia_cm", text: "Comment traiter chaque callback M-Pesa exactement une fois ?" },
    en: { who: "🇰🇪 wanjiru", text: "How do I process each M-Pesa callback exactly once?" },
  },
  {
    code: "flutter build apk \\\n  --split-per-abi \\\n  --obfuscate",
    fr: { who: "🇨🇮 yao_dev", text: "Comment réduire la taille de mon APK pour la 3G ?" },
    en: { who: "🇬🇭 kwame_k", text: "How can I shrink my APK for 3G users?" },
  },
];

/** Hero illustration: the same post flips between French and English while the code stays byte-identical. */
export function TranslationDemo() {
  // One counter drives everything: even steps show French, odd steps English, every two steps a new sample.
  const [step, setStep] = useState(0);
  const lang = step % 2 === 0 ? "fr" : "en";
  const i = Math.floor(step / 2) % SAMPLES.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStep((n) => n + 1), 2800);
    return () => clearInterval(id);
  }, []);

  const s = SAMPLES[i];
  const side = s[lang];

  return (
    <div className="relative" aria-hidden>
      {/* glow behind the window */}
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),transparent)] blur-2xl" />
      <div className="gradient-border relative overflow-hidden rounded-xl shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3f4a]" />
          <div className="ml-2 flex gap-1 font-mono text-[11px]">
            {(["fr", "en"] as const).map((l) => (
              <span
                key={l}
                className={`rounded-md border px-2 py-0.5 transition ${lang === l ? "border-border-strong bg-surface text-text" : "border-transparent text-muted"}`}
              >
                question.{l}
              </span>
            ))}
          </div>
          <span className="ml-auto font-mono text-[11px] text-muted">{lang === "fr" ? "fr → en" : "en → fr"}</span>
        </div>

        <div className="space-y-4 p-5">
          <div key={`${i}-${lang}`} className="animate-fade-up">
            <p className="font-mono text-xs text-muted">{side.who}</p>
            <p className="mt-1.5 min-h-[3.5rem] text-xl font-semibold leading-snug tracking-tight">
              {side.text}
              <span className="caret ml-0.5 text-accent-strong">▍</span>
            </p>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-border bg-code-bg p-3 font-mono text-[13px] leading-relaxed text-[#86efac]">{s.code}</pre>

          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green" /> code: 0 bytes changed
            </span>
            <span className="text-muted">auto-translated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
