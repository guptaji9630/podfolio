import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import express from 'express';
import { randomUUID } from 'node:crypto';

process.env.MCP_CONNECTIONS = '[]';
process.env.RESEND_API_KEY = 're_test_placeholder';
process.env.NVIDIA_NIM_API_KEY = 'test-placeholder';
process.env.MCP_ADMIN_TOKEN = 'local-test-admin';
let completions = 0;
const provider = createServer((req, res) => {
  req.resume(); res.setHeader('Content-Type', 'application/json');
  if (req.url === '/embeddings') return res.end(JSON.stringify({ data: [{ embedding: [1, 0] }] }));
  completions++;
  setTimeout(() => res.end(JSON.stringify({ choices: [{ message: { content: 'QA skills answer' } }] })), 25);
});
provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
process.env.NVIDIA_NIM_API_URL = `http://127.0.0.1:${provider.address().port}`;
const { createApp } = await import('../../../mcp-server-excalidraw/dist/service.js');
const canvasServer = createApp().listen(0, '127.0.0.1'); await once(canvasServer, 'listening');
process.env.EXCALIDRAW_SERVICE_URL = `http://127.0.0.1:${canvasServer.address().port}`;
process.env.EXCALIDRAW_MCP_URL = `${process.env.EXCALIDRAW_SERVICE_URL}/mcp`;
const { default: routes } = await import('../dist/routes/index.js');
const { AgentService, isEmailRequest } = await import('../dist/services/agentService.js');
const app = express(); app.use(express.json()); app.use('/api', routes);
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const post = (path, body, headers = {}) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
const payload = (question, options = {}) => ({ messages: [{ role: 'user', content: question }], options });

test('unified route deduplicates N generic requests then serves exact cache', async () => {
  const body = payload('What are the QA skills?', { useTools: false });
  const responses = await Promise.all(Array.from({ length: 8 }, () => post('/api/chat', body)));
  assert.ok(responses.every(r => r.status === 200));
  const values = await Promise.all(responses.map(r => r.json()));
  assert.ok(values.every(v => v.data.message === 'QA skills answer'));
  assert.equal(completions, 1);
  const cached = await (await post('/api/chat', body)).json();
  assert.equal(cached.data.cached, true); assert.equal(cached.data.source, 'cache');
  const changedContext = { ...body, messages: [{ role: 'assistant', content: 'Different conversation' }, ...body.messages] };
  assert.equal((await post('/api/chat', changedContext)).status, 200);
  assert.equal(completions, 2);
});
test('cache opt-out bypasses reuse and option/input validation prevents upstream calls', async () => {
  const before = completions;
  for (const body of [payload('hello', { useTools: 'yes' }), payload('hello', { stream: true }), payload('hello', { conversationId: 'bad' }), { messages: [{ role: 'assistant', content: 'hi' }] }, { messages: [] }]) {
    assert.equal((await post('/api/chat', body)).status, 400);
  }
  assert.equal(completions, before);
  await post('/api/chat', payload('unique uncached', { useCache: false, useTools: false }));
  await post('/api/chat', payload('unique uncached', { useCache: false, useTools: false }));
  assert.equal(completions, before + 2);
});
test('legacy agent endpoint works and tool listing includes local and real MCP schemas', async () => {
  const response = await post('/api/mcp/agent/chat', payload('List available tools'));
  assert.equal(response.status, 200);
  const data = (await response.json()).data;
  assert.match(data.message, /create_element/); assert.match(data.message, /send_agent_output/);
});
test('draw and export execute actual MCP operations, preserve isolated canvas IDs and mutate once', async () => {
  const id = randomUUID(); const other = randomUUID();
  const response = await post('/api/chat', payload('Draw a rectangle', { conversationId: id }));
  assert.equal(response.status, 200);
  const data = (await response.json()).data;
  assert.equal(data.source, 'mcp'); assert.equal(data.cached, false); assert.match(data.canvasUrl, new RegExp(id));
  const scene = await (await fetch(`${base}/api/mcp/canvas/${id}`)).json(); assert.equal(scene.elements.length, 1);
  assert.equal((await (await fetch(`${base}/api/mcp/canvas/${other}`)).json()).elements.length, 0);
  const exported = (await (await post('/api/chat', payload('Export canvas', { conversationId: id }))).json()).data;
  const image = await fetch(`${base}${exported.downloadUrl}`);
  assert.equal(image.status, 200); assert.match(await image.text(), /<rect/);
  await post('/api/chat', payload('Draw a rectangle', { conversationId: id }));
  assert.equal((await (await fetch(`${base}/api/mcp/canvas/${id}`)).json()).elements.length, 2);
});
test('admin endpoints reject public access and omit secret headers/environment values', async () => {
  assert.equal((await fetch(`${base}/api/mcp/connections`)).status, 401);
  assert.equal((await post('/api/mcp/tools/call', { name: 'create_element' })).status, 401);
  const headers = { Authorization: 'Bearer local-test-admin' };
  assert.equal((await post('/api/mcp/connections', { id: 'test', name: 'Test', transport: 'http', url: 'https://example.com/mcp', enabled: false, headers: { Authorization: 'secret' } }, headers)).status, 200);
  const configs = await (await fetch(`${base}/api/mcp/connections`, { headers })).json();
  assert.doesNotMatch(JSON.stringify(configs), /secret/);
});
test('email requires an explicit request; sends once using stub and never cached', async () => {
  for (const text of ['What is his email?', 'How do I send an email?', 'Do not email this conversation', 'Email me an example of how to send mail', 'Please draft an email', 'send no email']) assert.equal(isEmailRequest(text), false, text);
  assert.equal(isEmailRequest('Please send this conversation via email'), true);
  let emails = 0;
  const service = new AgentService({ complete: async () => 'generic answer', embed: async () => [1, 0], registry: {}, email: { sendAgentOutput: async () => { emails++; return { success: true }; } } });
  await service.processMessage([{ role: 'user', content: 'What is his email?' }]); assert.equal(emails, 0);
  const message = [{ role: 'user', content: 'Please send this conversation via email' }];
  await service.processMessage(message); await service.processMessage(message); assert.equal(emails, 2);
  assert.equal(service.cache.getStats().size, 1);
});
test('natural-language diagrams generate Mermaid before tools; failures and negations do not replay actions', async () => {
  let completions = 0; const calls = [];
  const service = new AgentService({ complete: async () => { completions++; return 'flowchart TD; A[Login] --> B[Dashboard]'; }, embed: async () => [1, 0], registry: { call: async (...args) => { calls.push(args); return { content: [] }; } }, email: {} });
  const request = [{ role: 'user', content: 'Draw a flowchart for login and dashboard' }];
  await service.processMessage(request); await service.processMessage(request);
  assert.equal(completions, 2); assert.equal(calls.length, 2); assert.equal(calls[0][1], 'create_from_mermaid');
  assert.match(calls[0][2].mermaidDiagram, /Login/); assert.equal(service.cache.getStats().size, 0);
  await service.processMessage([{ role: 'user', content: 'Do not draw a rectangle' }]);
  assert.equal(calls.length, 2);
  const failed = new AgentService({ complete: async () => { throw new Error('offline'); }, embed: async () => [1, 0], registry: {}, email: {} });
  await assert.rejects(failed.processMessage([{ role: 'user', content: 'skills?' }]), /offline/);
  assert.equal(failed.cache.getStats().size, 0);
});
after(async () => {
  for (const item of [server, provider, canvasServer]) item.closeAllConnections();
  await Promise.all([server, provider, canvasServer].map(item => new Promise(resolve => item.close(resolve))));
});
