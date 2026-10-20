"use client";

import { useState, type ReactNode } from "react";

/**
 * Shows the translated version by default when one exists, with a toggle back to the original.
 * Both versions are rendered on the server; this only switches which one is visible.
 */
export function Translatable({
  original,
  translated,
  labels,
}: {
  original: ReactNode;
  translated: ReactNode | null;
  labels: { translated: string; showOriginal: string; showTranslation: string };
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  if (!translated) return <>{original}</>;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        {!showOriginal && <span className="rounded-full bg-green-soft px-2 py-0.5 font-medium text-green">🌍 {labels.translated}</span>}
        <button type="button" onClick={() => setShowOriginal((v) => !v)} className="underline hover:text-accent">
          {showOriginal ? labels.showTranslation : labels.showOriginal}
        </button>
      </div>
      {showOriginal ? original : translated}
    </div>
  );
}
