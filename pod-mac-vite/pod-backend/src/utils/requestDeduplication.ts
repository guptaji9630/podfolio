import { createHash } from 'node:crypto';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])
  );
  return value;
}
export function generateRequestKey(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(data))).digest('hex');
}
interface Pending { promise: Promise<unknown>; controller: AbortController; subscribers: number }
const pending = new Map<string, Pending>();

/** One subscriber cancelling must not abort work that another subscriber needs. */
export function deduplicateRequest<T>(key: string, factory: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted();
  let entry = pending.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = { controller, subscribers: 0, promise: Promise.resolve() };
    const owned = entry;
    owned.promise = Promise.resolve().then(() => { controller.signal.throwIfAborted(); return factory(controller.signal); }).finally(() => {
      if (pending.get(key) === owned) pending.delete(key);
    });
    pending.set(key, owned);
  }
  const owned = entry;
  owned.subscribers++;
  return new Promise<T>((resolve, reject) => {
    let finished = false;
    const finish = (value: unknown, failed: boolean) => {
      if (finished) return;
      finished = true; signal?.removeEventListener('abort', abort);
      owned.subscribers--;
      if (!owned.subscribers) {
        if (pending.get(key) === owned) pending.delete(key);
        owned.controller.abort();
      }
      if (failed) reject(value); else resolve(value as T);
    };
    const abort = () => finish(signal?.reason ?? new DOMException('Aborted', 'AbortError'), true);
    signal?.addEventListener('abort', abort, { once: true });
    owned.promise.then(value => finish(value, false), error => finish(error, true));
    if (signal?.aborted) abort();
  });
}
