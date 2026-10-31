export type Embedder = (text: string, signal?: AbortSignal) => Promise<number[]>;
interface CacheEntry {
  question: string;
  answer: string;
  scope: string;
  embedding?: number[];
  timestamp: number;
}

/** Bounded LRU. Context/model isolation is mandatory, including for semantic hits. */
export class SemanticCacheService {
  private readonly cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  constructor(private readonly options: {
    embed?: Embedder; maxSize?: number; ttl?: number; threshold?: number; now?: () => number;
  } = {}) {}
  private now() { return this.options.now?.() ?? Date.now(); }
  private prune() {
    for (const [key, entry] of this.cache) {
      if (this.now() - entry.timestamp >= (this.options.ttl ?? 86400000)) this.cache.delete(key);
    }
  }
  private key(question: string, scope: string) { return JSON.stringify([scope, question.trim()]); }
  private hit(key: string, entry: CacheEntry) {
    this.cache.delete(key); this.cache.set(key, entry); this.hits++;
    return entry.answer;
  }
  private async embed(question: string, signal?: AbortSignal) {
    try {
      const value = await this.options.embed?.(question, signal);
      signal?.throwIfAborted();
      return value?.length && value.every(Number.isFinite) ? value : undefined;
    } catch { signal?.throwIfAborted(); return undefined; }
  }
  async get(question: string, scope = '', signal?: AbortSignal): Promise<string | null> {
    signal?.throwIfAborted(); this.prune();
    const exact = this.key(question, scope);
    const existing = this.cache.get(exact);
    if (existing) return this.hit(exact, existing);
    const candidates = [...this.cache].filter(([, e]) => e.scope === scope && e.embedding);
    if (!candidates.length) { this.misses++; return null; }
    const embedding = await this.embed(question, signal);
    let best: [string, CacheEntry] | undefined;
    let score = this.options.threshold ?? 0.85;
    if (embedding) for (const candidate of candidates) {
      const other = candidate[1].embedding!;
      if (other.length !== embedding.length) continue;
      const dot = embedding.reduce((sum, n, i) => sum + n * other[i], 0);
      const norm = Math.hypot(...embedding) * Math.hypot(...other);
      const similarity = norm ? dot / norm : -1;
      if (similarity >= score && this.now() - candidate[1].timestamp < (this.options.ttl ?? 86400000)) {
        score = similarity; best = candidate;
      }
    }
    if (best && this.cache.has(best[0])) return this.hit(...best);
    this.misses++; return null;
  }
  async set(question: string, answer: string, scope = '', signal?: AbortSignal): Promise<void> {
    const embedding = await this.embed(question, signal);
    signal?.throwIfAborted(); this.prune();
    const key = this.key(question, scope);
    this.cache.delete(key);
    this.cache.set(key, { question: question.trim(), answer, scope, embedding, timestamp: this.now() });
    while (this.cache.size > (this.options.maxSize ?? 1000)) this.cache.delete(this.cache.keys().next().value!);
  }
  getStats() {
    this.prune();
    return { size: this.cache.size, maxSize: this.options.maxSize ?? 1000, hits: this.hits, misses: this.misses };
  }
}
