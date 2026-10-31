import assert from 'node:assert/strict';
import { test } from 'node:test';
import { once } from 'node:events';
import express from 'express';
import { requestLogger, traceOperation } from '../dist/utils/logger.js';
import { ServiceError } from '../dist/utils/serviceError.js';

test('request logs correlate parallel operations, record failures and exclude sensitive data', async () => {
  const records = []; const original = console.log;
  console.log = line => records.push(JSON.parse(line));
  const app = express(); app.use(requestLogger); app.use(express.json());
  app.post('/test/:id', async (req, res) => {
    try {
      await traceOperation('test.upstream', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        if (req.params.id === 'fail') throw new ServiceError('TEST_FAILURE', 'SECRET_PROVIDER_BODY', 503);
      });
      res.json({ ok: true });
    } catch { res.sendStatus(503); }
  });
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const replies = await Promise.all(['SECRET_CANVAS_ID', 'fail'].map(id => fetch(`${base}/test/${id}?key=SECRET_QUERY`, {
      method: 'POST', headers: { authorization: 'Bearer SECRET_TOKEN', 'content-type': 'application/json' }, body: JSON.stringify({ content: 'SECRET_CHAT' }),
    })));
    await new Promise(resolve => setImmediate(resolve));
    const ids = replies.map(r => r.headers.get('x-request-id'));
    assert.ok(ids.every(Boolean)); assert.notEqual(ids[0], ids[1]);
    for (let i = 0; i < 2; i++) {
      const logs = records.filter(r => r.requestId === ids[i]);
      assert.equal(logs.filter(r => r.event === 'request.started').length, 1);
      const finish = logs.find(r => r.event === (i ? 'request.failed' : 'request.completed'));
      assert.equal(finish.status, i ? 503 : 200); assert.equal(finish.route, '/test/:id');
      assert.ok(finish.durationMs >= 0);
      assert.ok(logs.some(r => r.event === (i ? 'operation.failed' : 'operation.completed')));
    }
    assert.equal(records.find(r => r.event === 'operation.failed').code, 'TEST_FAILURE');
    assert.doesNotMatch(JSON.stringify(records), /SECRET_/);
  } finally { console.log = original; server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
