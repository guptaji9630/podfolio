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
let redirectedRequests = 0;
let completionText = 'QA skills answer';
let completionStatus = 200;
let finishReason = 'stop';
let lastCompletionBudget;
const provider = createServer(async (req, res) => {
  if (req.url === '/redirect-target') { redirectedRequests++; return res.end('must not reach'); }
  let body = '';
  for await (const chunk of req) body += chunk;
  lastCompletionBudget = JSON.parse(body || '{}').max_tokens;
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/embeddings') return res.end(JSON.stringify({ data: [{ embedding: [1, 0] }] }));
  completions++;
  res.statusCode = completionStatus;
  setTimeout(() => res.end(JSON.stringify({ choices: [{ finish_reason: finishReason, message: { content: completionText } }] })), 25);
});
provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
process.env.NVIDIA_NIM_API_URL = `http://127.0.0.1:${provider.address().port}`;
const { createApp } = await import('../../../mcp-server-excalidraw/dist/service.js');
const redirectSceneId = randomUUID();
const canvasApp = express();
canvasApp.get(`/canvas/${redirectSceneId}`, (_req, res) => res.redirect(`${process.env.NVIDIA_NIM_API_URL}/redirect-target`));
canvasApp.use(createApp());
const canvasServer = canvasApp.listen(0, '127.0.0.1'); await once(canvasServer, 'listening');
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
test('custom diagram wording generates a canvas without caching tool actions', async () => {
  const calls = []; const prompts = [];
  const service = new AgentService({ complete: async messages => { prompts.push(messages); return 'Here is the diagram:\n```mermaid\nflowchart TD; A[Requirements] --> B[Test execution]\n```'; }, embed: async () => [1, 0], registry: { call: async (...args) => { calls.push(args); return { content: [] }; } }, email: {} });
  for (const question of [
    'Use Exali draw tool to create a flow chart of waterfall model',
    'create a flow diagram of manual testing', 'Give me a flowchart for checkout',
    'I need a diagram of the deployment process', 'Flow chart for signing up',
    'Could you show the testing process as a flow diagram?', 'Visualize manual testing',
    'Map out the manual testing process', 'Turn this into a flow diagram',
    'Create a flow diagram showing how to test checkout', 'Draw a flowchart, but do not use colors',
  ]) {
    const conversationId = randomUUID();
    const response = await service.processMessage([{ role: 'user', content: question }], { conversationId });
    assert.equal(response.source, 'mcp', question);
    assert.equal(response.cached, false);
    assert.equal(new URL(response.canvasUrl).searchParams.get('canvasId'), conversationId);
    assert.equal(response.toolCalls[0].name, 'create_from_mermaid');
  }
  assert.equal(calls.length, 11); assert.equal(prompts.length, 11);
  assert.equal(service.cache.getStats().size, 0);
  const before = calls.length;
  for (const question of ['What is a flowchart?', 'Tell me how to create a flow diagram', 'Can you explain how to draw a diagram?', 'Show me how to create a diagram', 'Do not create a diagram', 'Don’t draw a flowchart', 'Do not visualize manual testing', 'Never map out this process', 'Give me only Mermaid code for a diagram']) {
    const response = await service.processMessage([{ role: 'user', content: question }], { useCache: false });
    assert.equal(response.canvasUrl, undefined, question);
  }
  await service.processMessage([{ role: 'user', content: 'create a flow diagram of manual testing' }], { useTools: false, useCache: false });
  assert.equal(calls.length, before, 'informational, negative, code-only and tools-disabled requests do not draw');
  const history = [{ role: 'user', content: 'The process is requirements, test execution, then bug reporting.' }, { role: 'assistant', content: 'Understood.' }, { role: 'user', content: 'Turn this into a flow diagram' }];
  await service.processMessage(history);
  assert.deepEqual(prompts.at(-1).slice(1), history, 'diagram generation retains the topic from conversation history');
});
test('custom manual-testing prompt runs the LLM and real MCP service and returns a usable canvas URL', async () => {
  const id = randomUUID();
  completionText = '```mermaid\nflowchart TD; A[Requirements] --> B[Test execution]; B --> C[Bug reporting]\n```';
  try {
    const response = await post('/api/chat', payload('create a flow diagram of manual testing', { conversationId: id }));
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.source, 'mcp');
    assert.equal(new URL(data.canvasUrl).searchParams.get('canvasId'), id);
    const scene = await (await fetch(`${base}/api/mcp/canvas/${id}`)).json();
    assert.ok(scene.elements.some(element => element.text === 'Test execution'));
    assert.ok(scene.elements.some(element => element.type === 'arrow'));
    completionText = 'I cannot produce a diagram.';
    const failed = await post('/api/chat', payload('create a flow diagram of manual testing'));
    assert.equal(failed.status, 502);
    assert.equal((await failed.json()).error.code, 'DIAGRAM_GENERATION_FAILED');
  } finally { completionText = 'QA skills answer'; }
});
test('provider overload is reported explicitly without retrying or claiming a canvas exists', async () => {
  const before = completions;
  completionStatus = 503;
  completionText = 'private upstream detail';
  try {
    const response = await post('/api/chat', payload('create a flow diagram of manual testing'));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, 'LLM_BUSY');
    assert.match(body.error.message, /AI provider is busy/);
    assert.equal(body.data, undefined);
    assert.doesNotMatch(JSON.stringify(body), /private upstream/);
    assert.equal(completions, before + 1);
  } finally { completionStatus = 200; completionText = 'QA skills answer'; }
});
test('a broken configured MCP connection returns a specific safe error; correcting it restores flowcharts', async () => {
  const { mcpToolRegistry } = await import('../dist/services/mcpToolRegistry.js');
  mcpToolRegistry.register({ id: 'excalidraw', name: 'Excalidraw', transport: 'http', url: `${base}/missing-mcp`, enabled: true, headers: { Authorization: 'do-not-leak-this-secret' } });
  try {
    const failed = await post('/api/chat', payload('Draw a flowchart'));
    assert.equal(failed.status, 502);
    const body = await failed.json();
    assert.equal(body.error.code, 'MCP_CONNECTION_FAILED');
    assert.match(body.error.message, /HTTP on port 3001/);
    assert.doesNotMatch(JSON.stringify(body), /do-not-leak|Authorization|stack/);
  } finally {
    mcpToolRegistry.register({ id: 'excalidraw', name: 'Excalidraw', transport: 'http', url: process.env.EXCALIDRAW_MCP_URL, enabled: true });
  }
  const restored = await post('/api/chat', payload('Draw a flowchart'));
  assert.equal(restored.status, 200);
  assert.equal((await restored.json()).data.toolCalls[0].name, 'create_from_mermaid');
});
test('admin can register the stdio form with an unused empty URL', async () => {
  const headers = { Authorization: 'Bearer local-test-admin' };
  const response = await post('/api/mcp/connections', { id: 'stdio-form', name: 'Local tool', transport: 'stdio', command: 'unused-test-command', args: [], url: '', enabled: false }, headers);
  assert.equal(response.status, 200);
  const invalid = await post('/api/mcp/connections', { id: 'invalid-http', name: 'Invalid HTTP', transport: 'http', url: '', enabled: false }, headers);
  assert.equal(invalid.status, 400);
  await fetch(`${base}/api/mcp/connections/stdio-form`, { method: 'DELETE', headers });
});
test('cancelling an SSE connection before its endpoint arrives closes the transport', async () => {
  const { MCPToolRegistry } = await import('../dist/services/mcpToolRegistry.js');
  let connected; let disconnected;
  const ready = new Promise(resolve => { connected = resolve; });
  const closed = new Promise(resolve => { disconnected = resolve; });
  const stalled = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(': waiting for endpoint\n\n');
    res.once('close', disconnected);
    connected();
  });
  stalled.listen(0, '127.0.0.1'); await once(stalled, 'listening');
  const registry = new MCPToolRegistry(); registry.enable('excalidraw', false);
  registry.register({ id: 'stalled', name: 'Stalled SSE', transport: 'sse', url: `http://127.0.0.1:${stalled.address().port}`, enabled: true });
  const controller = new AbortController();
  let deadline;
  try {
    const request = registry.tools(randomUUID(), controller.signal, true);
    await ready;
    controller.abort();
    await Promise.race([
      (async () => { await assert.rejects(request, { name: 'AbortError' }); await closed; })(),
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error('SSE cancellation did not release the connection')), 1000); }),
    ]);
  } finally { clearTimeout(deadline); stalled.closeAllConnections(); await new Promise(resolve => stalled.close(resolve)); }
});
test('game launch ignores negative and informational requests', async () => {
  const service = new AgentService({ complete: async () => 'Game information', embed: async () => [1, 0], registry: {}, email: {} });
  for (const question of ["Don't play Dino", 'Do not launch Pong', 'How do I play Dino?', 'What happens when I start Pong?']) {
    const result = await service.processMessage([{ role: 'user', content: question }], { useCache: false });
    assert.equal(result.toolCalls?.some(tool => tool.name === 'launch_game') ?? false, false, question);
  }
  const result = await service.processMessage([{ role: 'user', content: 'Please play Pong survival' }]);
  assert.equal(result.toolCalls[0].name, 'launch_game');
  assert.deepEqual(result.toolCalls[0].arguments, { gameId: 'pong', mode: 'survival' });
});
after(async () => {
  for (const item of [server, provider, canvasServer]) item.closeAllConnections();
  await Promise.all([server, provider, canvasServer].map(item => new Promise(resolve => item.close(resolve))));
});

test('canvas proxy rejects URL injection and does not follow upstream redirects', async () => {
  for (const id of ['https%3A%2F%2Fexample.com', '..%2F..%2Fhealth', `${randomUUID()}%3Furl%3Dhttp%3A%2F%2Fexample.com`]) {
    assert.equal((await fetch(`${base}/api/mcp/canvas/${id}`)).status, 400);
  }
  const response = await fetch(`${base}/api/mcp/canvas/${redirectSceneId}`);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), null);
  assert.equal(redirectedRequests, 0);
});

test('explicit Exali draw waterfall prompt has reasoning budget and rejects truncation before MCP mutation', async () => {
  const id = randomUUID();
  completionText = 'flowchart TD; A[Requirements] --> B[Design] --> C[Implementation] --> D[Testing] --> E[Deployment] --> F[Maintenance]';
  try {
    const response = await post('/api/chat', payload('Use Exali draw tool to create a flow chart of waterfall model', { conversationId: id }));
    assert.equal(response.status, 200);
    assert.equal(lastCompletionBudget, 2048);
    const { data } = await response.json();
    assert.equal(data.source, 'mcp'); assert.match(data.canvasUrl, new RegExp(id));
    const scene = await (await fetch(`${base}/api/mcp/canvas/${id}`)).json();
    assert.equal(scene.elements.filter(e => e.type === 'arrow').length, 5);
    finishReason = 'length'; completionText = '';
    const failed = await post('/api/chat', payload('Use Exali draw tool to create a flow chart of waterfall model', { conversationId: id }));
    assert.equal(failed.status, 502);
    assert.equal((await failed.json()).error.code, 'LLM_RESPONSE_TRUNCATED');
    assert.equal((await (await fetch(`${base}/api/mcp/canvas/${id}`)).json()).revision, scene.revision);
  } finally { completionText = 'QA skills answer'; finishReason = 'stop'; }
});
