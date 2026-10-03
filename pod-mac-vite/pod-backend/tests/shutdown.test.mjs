import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';

for (const signal of ['SIGTERM', 'SIGINT']) {
test(`${signal} drains an active AI reply before exiting`, { timeout: 10000 }, async () => {
  let finishReply;
  let announceRequest;
  const received = new Promise(resolve => { announceRequest = resolve; });
  const upstream = createServer((req, res) => {
    req.resume();
    finishReply = () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { content: 'Drained reply' } }] })); };
    announceRequest();
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const reserve = createServer();
  reserve.listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = reserve.address().port;
  await new Promise(resolve => reserve.close(resolve));
  const child = spawn(process.execPath, ['dist/index.js'], {
    env: { ...process.env, PORT: String(port), RESEND_API_KEY: 'test-placeholder', NVIDIA_NIM_API_KEY: 'test-placeholder', NVIDIA_NIM_API_URL: `http://127.0.0.1:${upstream.address().port}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  try {
    await new Promise((resolve, reject) => {
      child.stdout.on('data', chunk => { if (chunk.toString().includes('Server Running')) resolve(); });
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`server exited early: ${code}`)));
    });
    const reply = fetch(`http://127.0.0.1:${port}/api/nim/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    await received;
    child.kill(signal);
    child.kill(signal); // Repeated shutdown requests must not interrupt draining.
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(child.exitCode, null, 'active connection must keep server alive');
    finishReply();
    const response = await reply;
    assert.equal(response.status, 200);
    assert.equal((await response.json()).choices[0].message.content, 'Drained reply');
    assert.equal((await exited)[0], 0);
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});
}

test('shutdown force-closes only after the ten-second drain deadline', { timeout: 16000 }, async () => {
  let announceRequest;
  const received = new Promise(resolve => { announceRequest = resolve; });
  const upstream = createServer(req => { req.resume(); announceRequest(); });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const reserve = createServer();
  reserve.listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = reserve.address().port;
  await new Promise(resolve => reserve.close(resolve));
  const child = spawn(process.execPath, ['dist/index.js'], {
    env: { ...process.env, PORT: String(port), RESEND_API_KEY: 'test-placeholder', NVIDIA_NIM_API_KEY: 'test-placeholder', NVIDIA_NIM_API_URL: `http://127.0.0.1:${upstream.address().port}` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  try {
    await new Promise((resolve, reject) => {
      child.stdout.on('data', chunk => { if (chunk.toString().includes('Server Running')) resolve(); });
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`server exited early: ${code}`)));
    });
    const reply = fetch(`http://127.0.0.1:${port}/api/nim/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    }).then(response => ({ response }), error => ({ error }));
    await received;
    const start = Date.now();
    child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(child.exitCode, null, 'must allow active work to drain before the deadline');
    assert.equal((await exited)[0], 1, 'a missed deadline is an unsuccessful shutdown');
    assert.ok(Date.now() - start >= 9900, 'must not force-close before the ten-second deadline');
    assert.ok((await reply).error, 'the held client request is terminated at the deadline');
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});
