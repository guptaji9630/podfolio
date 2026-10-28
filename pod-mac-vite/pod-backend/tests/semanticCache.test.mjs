import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SemanticCacheService } from '../dist/services/semanticCache.js';
import { deduplicateRequest, generateRequestKey } from '../dist/utils/requestDeduplication.js';

test('exact hits, TTL expiry and context isolation', async () => {
  let now = 0;
  const cache = new SemanticCacheService({ now: () => now, ttl: 100 });
  await cache.set('Question?', 'Answer', 'first');
  assert.equal(await cache.get('Question?', 'first'), 'Answer');
  assert.equal(await cache.get('Question?', 'second'), null);
  now = 100;
  assert.equal(await cache.get('Question?', 'first'), null);
  assert.equal(cache.getStats().size, 0);
});
test('embedding similarity includes 0.85 and never crosses conversation scope', async () => {
  const embed = async text => text === 'skills' ? [1, 0] : text === 'QA skills' ? [0.85, Math.sqrt(1 - 0.85 ** 2)] : [0, 1];
  const cache = new SemanticCacheService({ embed });
  await cache.set('skills', 'Testing', 'same');
  assert.equal(await cache.get('QA skills', 'same'), 'Testing');
  assert.equal(await cache.get('QA skills', 'different'), null);
  assert.equal(await cache.get('weather', 'same'), null);
});
test('LRU eviction, updates and failed embeddings retain exact caching', async () => {
  const cache = new SemanticCacheService({ maxSize: 2, embed: async () => { throw new Error('offline'); } });
  await cache.set('a', 'A'); await cache.set('b', 'B');
  await cache.get('a'); await cache.set('c', 'C');
  assert.equal(await cache.get('b'), null);
  assert.equal(await cache.get('a'), 'A');
  await cache.set('a', 'new');
  assert.equal(cache.getStats().size, 2);
  assert.equal(await cache.get('c'), 'C');
  assert.equal(await cache.get('a'), 'new');
});
test('stable keys preserve nested message contents and order', () => {
  assert.equal(generateRequestKey({ b: 1, a: { c: 2 } }), generateRequestKey({ a: { c: 2 }, b: 1 }));
  assert.notEqual(generateRequestKey({ messages: [{ content: 'one' }] }), generateRequestKey({ messages: [{ content: 'two' }] }));
});
test('identical in-flight requests coalesce, cancelled subscriber leaves remaining subscriber alive', async () => {
  let calls = 0; let release; let upstreamSignal;
  const factory = async signal => { calls++; upstreamSignal = signal; await new Promise(resolve => { release = resolve; }); return 'answer'; };
  const a = new AbortController(); const b = new AbortController();
  const first = deduplicateRequest('coalesce', factory, a.signal);
  const rejection = assert.rejects(first, { name: 'AbortError' });
  const second = deduplicateRequest('coalesce', factory, b.signal);
  await Promise.resolve(); a.abort(); await rejection;
  assert.equal(upstreamSignal.aborted, false); release();
  assert.equal(await second, 'answer'); assert.equal(calls, 1);
});
test('all subscribers cancelling aborts upstream and permits immediate new work', async () => {
  const controller = new AbortController(); let upstreamSignal;
  const first = deduplicateRequest('cancel', async signal => { upstreamSignal = signal; await new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); }, controller.signal);
  const rejected = assert.rejects(first, { name: 'AbortError' });
  await Promise.resolve(); controller.abort(); await rejected;
  assert.equal(upstreamSignal.aborted, true);
  assert.equal(await deduplicateRequest('cancel', async () => 'new'), 'new');
});
test('failed and synchronously throwing factories release in-flight ownership', async () => {
  await assert.rejects(deduplicateRequest('failure', () => { throw new Error('failed'); }), /failed/);
  assert.equal(await deduplicateRequest('failure', async () => 'recovered'), 'recovered');
});
