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
        {!showOriginal && <span className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent-soft px-2 py-0.5 text-accent-strong"><span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />{labels.translated}</span>}
        <button type="button" onClick={() => setShowOriginal((v) => !v)} className="text-muted underline-offset-2 hover:text-text hover:underline">
          {showOriginal ? labels.showTranslation : labels.showOriginal}
        </button>
      </div>
      {showOriginal ? original : translated}
    </div>
  );
}
