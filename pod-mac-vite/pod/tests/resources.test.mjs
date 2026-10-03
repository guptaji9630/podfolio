import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

async function load(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env': '{}' } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const { apiClient } = await load('src/services/api.ts');

// Tests run serially because they replace browser globals.
test('explicit cancellation aborts fetch without retries', async () => {
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_, { signal }) => new Promise((_, reject) => {
    calls++;
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  try {
    const controller = new AbortController();
    const request = apiClient.post('/api/nim/chat/completions', {}, undefined, controller.signal);
    controller.abort();
    const result = await Promise.race([request, new Promise((_, reject) => setTimeout(() => reject(new Error('cancellation did not settle')), 100))]);
    assert.equal(result.success, false);
    assert.equal(result.error.code, 'ABORTED');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('cancellation interrupts retry backoff and avoids another fetch', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError('fetch failed'); };
  try {
    const controller = new AbortController();
    const request = apiClient.get('/health', undefined, controller.signal);
    setTimeout(() => controller.abort(), 10);
    const result = await request;
    assert.equal(result.error.code, 'ABORTED');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('API base and legacy endpoints do not duplicate /api', async () => {
  const originalFetch = globalThis.fetch;
  let url;
  globalThis.fetch = async value => { url = value; return { ok: true, json: async () => ({}) }; };
  try {
    await apiClient.post('/api/contact', {});
    assert.equal(new URL(url).pathname, '/api/contact');
  } finally { globalThis.fetch = originalFetch; }
});

test('muted sound does not create audio contexts; finished nodes disconnect', async () => {
  let created = 0;
  const nodes = [];
  class AudioContext {
    constructor() { created++; this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    createOscillator() { const node = { frequency: {}, connect() {}, disconnect() { this.disconnected = true; }, start() {}, stop() {} }; nodes.push(node); return node; }
    createGain() { const node = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() { this.disconnected = true; } }; nodes.push(node); return node; }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  globalThis.window = { AudioContext };
  const { soundManager } = await load('src/utils/sound.ts');
  soundManager.setGlobalVolume(0);
  soundManager.playJump();
  assert.equal(created, 0);
  soundManager.setGlobalVolume(0.5);
  soundManager.playJump();
  nodes[0].onended();
  assert.ok(nodes.every(node => node.disconnected));
  soundManager.dispose();
  delete globalThis.window;
  delete globalThis.localStorage;
});


test('Dino releases audio and delayed tones across 20 open/close cycles', async () => {
  const contexts = [];
  const nodes = [];
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; contexts.push(this); }
    createOscillator() { const n = { frequency: {}, connect() {}, disconnect() { this.disconnected = true; }, start() {}, stop() {} }; nodes.push(n); return n; }
    createGain() { const n = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() { this.disconnected = true; } }; nodes.push(n); return n; }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  globalThis.window = { AudioContext };
  try {
    const { DinoSoundManager } = await load('src/utils/dinoSound.ts');
    for (let i = 0; i < 20; i++) {
      const sound = new DinoSoundManager();
      sound.death();
      sound.dispose();
      sound.dispose();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(contexts.length, 20, 'delayed tones must not create new contexts');
    assert.ok(contexts.every(ctx => ctx.state === 'closed'));
    assert.ok(nodes.every(node => node.disconnected));
    // Strict Mode effect replay can use the manager again.
    const sound = new DinoSoundManager();
    sound.jump(); sound.dispose(); sound.jump(); sound.dispose();
    assert.ok(contexts.every(ctx => ctx.state === 'closed'));
  } finally { delete globalThis.window; }
});

test('timeout covers slow response body consumption', async () => {
  const originalFetch = globalThis.fetch;
  const originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, ms, ...args) => originalTimeout(callback, ms === 30000 ? 20 : ms, ...args);
  globalThis.fetch = async (_, { signal }) => ({ ok: true, json: () => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }) });
  try {
    const result = await apiClient.post('/api/nim/chat/completions', {});
    assert.equal(result.success, false);
    assert.equal(result.error.message, 'Aborted');
  } finally { globalThis.fetch = originalFetch; globalThis.setTimeout = originalTimeout; }
});

test('failed writes are not retried and completion context stays bounded', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new TypeError('fetch failed'); };
  try {
    await apiClient.post('/api/contact', {});
    assert.equal(calls, 1);
    const { chatService } = await load('src/services/chatService.ts');
    let payload;
    globalThis.fetch = async (_, options) => {
      payload = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Reply' } }] }) };
    };
    const messages = Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `Message ${i}` }));
    await chatService.sendMessage(messages, false);
    assert.equal(payload.messages.length, 21);
    assert.equal(payload.messages[1].content, 'Message 30');
    await chatService.sendMessage(messages.map(m => ({ ...m, content: 'a'.repeat(12000) })), false);
    assert.ok(payload.messages.reduce((total, message) => total + message.content.length, 0) <= 60000);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(chatService.sendMessage([{ role: 'user', content: 'play dino' }], true, controller.signal), { name: 'AbortError' });
  } finally { globalThis.fetch = originalFetch; }
});
