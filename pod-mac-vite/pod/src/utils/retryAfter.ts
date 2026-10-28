/** Retry-After may contain seconds or an HTTP date. Never retry immediately. */
export function retryAfterMs(value: string | null, fallbackMs: number, now = Date.now()): number {
  if (!value?.trim()) return fallbackMs;
  const text = value.trim();
  const delay = /^\d+$/.test(text) ? Number(text) * 1000 : Date.parse(text) - now;
  return Number.isFinite(delay) && delay >= 0 ? Math.max(1000, delay) : fallbackMs;
}
