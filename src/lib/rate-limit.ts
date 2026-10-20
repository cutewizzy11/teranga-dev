/**
 * Fixed-window rate limiter kept in process memory. Enough for a single-instance
 * deployment; swap the Map for Redis/Postgres if the app is scaled horizontally.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) sweep(now);
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function sweep(now: number) {
  for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
}

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60_000 },
  signup: { limit: 5, windowMs: 60 * 60_000 },
  post: { limit: 20, windowMs: 60 * 60_000 },
  vote: { limit: 120, windowMs: 60 * 60_000 },
} as const;
