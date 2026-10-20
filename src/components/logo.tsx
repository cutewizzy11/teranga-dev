/** Brand mark: two code brackets facing each other — two languages meeting — on the brand gradient. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="td-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="0.55" stopColor="#e0609b" />
          <stop offset="1" stopColor="#ff8a4c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#td-grad)" />
      <path d="M12.5 10 7 16l5.5 6M19.5 10 25 16l-5.5 6" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.8" fill="#fff" />
    </svg>
  );
}

export function Wordmark() {
  return <span className="text-[17px] font-semibold tracking-tight">Teranga</span>;
}
