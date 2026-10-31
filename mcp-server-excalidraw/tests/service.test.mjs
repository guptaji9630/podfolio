import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createApp, SceneStore, fromMermaid, toSvg } from '../dist/service.js';
const server = createApp().listen(0, '127.0.0.1'); await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
test('MCP initialize/list/call work across separate stateless HTTP requests', async () => {
  const id = randomUUID(); const client = new Client({ name: 'test', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { 'x-canvas-id': id } } }));
    assert.ok((await client.listTools()).tools.some(t => t.name === 'create_from_mermaid'));
    const result = await client.callTool({ name: 'create_from_mermaid', arguments: { mermaidDiagram: 'flowchart TD; A[Start] --> B[End]' } });
    assert.notEqual(result.isError, true);
    const scene = await (await fetch(`${base}/canvas/${id}`)).json();
    assert.equal(scene.elements.length, 5);
    const other = await (await fetch(`${base}/canvas/${randomUUID()}`)).json(); assert.equal(other.elements.length, 0);
    const svg = await (await fetch(`${base}/canvas/${id}/export.svg`)).text();
    assert.match(svg, /Start/); assert.match(svg, /<polyline/); assert.doesNotMatch(svg, /fill="[^"]*" fill=/);
    const stale = await fetch(`${base}/canvas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ elements: [], expectedRevision: 0 }) });
    assert.equal(stale.status, 409);
    const fail = await client.callTool({ name: 'create_from_mermaid', arguments: { mermaidDiagram: 'sequenceDiagram\nA->>B: hello' } }); assert.equal(fail.isError, true);
  } finally { await client.close(); }
});
test('scene TTL, bounded capacity and element limits', () => {
  let now = 0; const store = new SceneStore(() => now, 1);
  store.write('one', []); assert.throws(() => store.write('two', []), /CAPACITY/);
  now = 86400000; store.write('two', []); assert.equal(store.read('one').revision, 0);
  assert.throws(() => store.write('two', Array.from({ length: 501 }, () => ({}))), /SCENE_LIMIT/);
});
test('Mermaid branches preserve IDs and SVG escapes user text', () => {
  const elements = fromMermaid('graph LR; A[Start] --> B{Decision}; B --> C[End]');
  assert.equal(elements.filter(e => e.type === 'arrow').length, 2);
  assert.ok(elements.some(e => e.type === 'diamond'));
  assert.match(toSvg([{ id: 'text', type: 'text', x: 0, y: 0, text: '<script>alert(1)</script>' }]), /&lt;script&gt;/);
});
test('editor can save and export a one-point pen stroke', async () => {
  const id = randomUUID();
  const dot = { id: 'dot', type: 'freedraw', x: 50, y: 60, width: 0, height: 0, points: [[0, 0]], strokeColor: '#123456' };
  const saved = await fetch(`${base}/canvas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: 0, elements: [dot] }) });
  assert.equal(saved.status, 200);
  const scene = await (await fetch(`${base}/canvas/${id}`)).json();
  assert.deepEqual(scene.elements[0].points, [[0, 0]]);
  const svg = await (await fetch(`${base}/canvas/${id}/export.svg`)).text();
  assert.match(svg, /<circle/);
});
test('leading whitespace in pasted Mermaid preserves the header offset', () => {
  const elements = fromMermaid('  \nflowchart TD; A[Start] --> B[End]');
  assert.equal(elements.length, 5);
  assert.ok(elements.some(element => element.text === 'Start'));
});
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });

test('HTML comment-like diagram labels remain escaped SVG text', () => {
  for (const label of ['<!-- --!><img src=x onerror=alert>', '<svg onload=alert>']) {
    const svg = toSvg(fromMermaid(`flowchart TD; A[${label}] --> B[End]`));
    assert.doesNotMatch(svg, /<!--|<img|<svg onload/);
    assert.match(svg, /&lt;/);
  }
  assert.throws(() => fromMermaid('flowchart TD; A[Start] --!> B[End]'), /Unsupported/);
});
