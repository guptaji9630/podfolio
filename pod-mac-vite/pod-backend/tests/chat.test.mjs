import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import express from 'express';

process.env.RESEND_API_KEY = 'test-placeholder';
process.env.NVIDIA_NIM_API_KEY = 'test-placeholder';
let upstreamCalls = 0;
let upstreamDisconnected;
let replyNormally = false;
const upstream = createServer((req, res) => {
  upstreamCalls++;
  if (req.url === '/chat/completions') {
    req.resume();
    if (replyNormally) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { content: 'Successful reply' } }] })); return; }
    res.on('close', () => upstreamDisconnected?.());
    // Intentionally hold the response to test cancellation.
  }
});
upstream.listen(0, '127.0.0.1');
await once(upstream, 'listening');
process.env.NVIDIA_NIM_API_URL = `http://127.0.0.1:${upstream.address().port}`;
const { default: router } = await import('../dist/routes/nim.js');
const app = express();
app.use(express.json());
app.use(router);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const valid = { messages: [{ role: 'user', content: 'Hello' }], max_tokens: 512, stream: false };

test('invalid AI inputs are rejected before upstream invocation', async () => {
  for (const body of [
    {}, { messages: [] }, { messages: [{ role: 'unknown', content: 'Hello' }] },
    { messages: [{ role: 'user', content: 'a'.repeat(12001) }] },
    { messages: Array.from({ length: 22 }, () => ({ role: 'user', content: 'Hello' })) },
    { messages: Array.from({ length: 6 }, () => ({ role: 'user', content: 'a'.repeat(11000) })) },
    { ...valid, max_tokens: 2049 }, { ...valid, max_tokens: -1 }, { ...valid, stream: true },
    { ...valid, temperature: 'hot' }, { ...valid, model: {} },
  ]) {
    const response = await fetch(`${base}/chat/completions`, { method: 'POST', signal: AbortSignal.timeout(1000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error.message, 'string');
  }
  assert.equal(upstreamCalls, 0);
});

test('disconnect aborts upstream HTTP work within one second', async () => {
  const closed = new Promise(resolve => { upstreamDisconnected = resolve; });
  const req = request(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  req.on('error', () => {});
  req.end(JSON.stringify(valid));
  const deadline = Date.now() + 1000;
  while (upstreamCalls === 0 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(upstreamCalls, 1);
  const start = Date.now();
  req.destroy();
  let timer;
  try {
    await Promise.race([closed, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('upstream not cancelled')), 1000); })]);
    assert.ok(Date.now() - start < 1000);
  } finally { clearTimeout(timer); }
});

test('valid completion preserves upstream JSON response', async () => {
  replyNormally = true;
  const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).choices[0].message.content, 'Successful reply');
});

test.after(async () => {
  server.closeAllConnections(); upstream.closeAllConnections();
  await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => upstream.close(resolve))]);
});
