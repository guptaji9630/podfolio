import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const uuid = z.string().uuid();
const number = z.number().finite().min(-100000).max(100000);
const shapeSchema = z.object({
  id: z.string().min(1).max(100).optional(), type: z.enum(['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line']),
  x: number, y: number, width: z.number().min(1).max(10000).default(180), height: z.number().min(1).max(10000).default(100),
  text: z.string().max(2000).optional(), strokeColor: z.string().regex(/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/).optional(),
  backgroundColor: z.string().regex(/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/).optional(),
  points: z.array(z.tuple([number, number])).min(2).max(1000).optional(),
});
type Element = Record<string, unknown> & { id: string; type: string; x: number; y: number; width?: number; height?: number; text?: string };
interface Scene { elements: Element[]; revision: number; updatedAt: number }
export class SceneStore {
  private readonly scenes = new Map<string, Scene>();
  constructor(private readonly now = Date.now, private readonly limit = 1000) {}
  read(id: string): Scene {
    const scene = this.scenes.get(id);
    if (scene && this.now() - scene.updatedAt >= 86400000) { this.scenes.delete(id); return { elements: [], revision: 0, updatedAt: this.now() }; }
    return scene ?? { elements: [], revision: 0, updatedAt: this.now() };
  }
  write(id: string, elements: Element[], expectedRevision?: number) {
    const current = this.read(id);
    if (expectedRevision !== undefined && current.revision !== expectedRevision) throw new Error('CONFLICT');
    if (!this.scenes.has(id) && this.scenes.size >= this.limit) {
      for (const key of this.scenes.keys()) this.read(key);
      if (this.scenes.size >= this.limit) throw new Error('CAPACITY');
    }
    if (elements.length > 500 || JSON.stringify(elements).length > 200000) throw new Error('SCENE_LIMIT');
    const scene = { elements, revision: current.revision + 1, updatedAt: this.now() };
    this.scenes.set(id, scene); return scene;
  }
  append(id: string, elements: Element[]) { return this.write(id, [...this.read(id).elements, ...elements]); }
}
function element(input: z.input<typeof shapeSchema>): Element {
  const parsed = shapeSchema.parse(input);
  return { ...parsed, id: parsed.id ?? randomUUID(), strokeColor: parsed.strokeColor ?? '#1e1e1e', backgroundColor: parsed.backgroundColor ?? 'transparent',
    ...(parsed.type === 'arrow' || parsed.type === 'line' ? { points: parsed.points ?? [[0, 0], [parsed.width, 0]], endArrowhead: parsed.type === 'arrow' ? 'arrow' : null } : {}),
  };
}
/** Deliberately limited to basic flowcharts; reject unsupported syntax instead of pretending to render it. */
export function fromMermaid(source: string): Element[] {
  if (source.length > 10000) throw new Error('Diagram exceeds 10000 characters.');
  const header = source.trim().match(/^(?:flowchart|graph)\s+(TD|TB|LR|RL|BT)\s*;?/);
  if (!header) throw new Error('Use a basic Mermaid flowchart: flowchart TD; A[Start] --> B[End]');
  const horizontal = ['LR', 'RL'].includes(header[1]);
  const reverse = ['RL', 'BT'].includes(header[1]);
  const nodes = new Map<string, { label: string; type: 'rectangle' | 'ellipse' | 'diamond' }>();
  const edges: [string, string][] = [];
  const parseNode = (raw: string) => {
    const match = raw.trim().match(/^([A-Za-z][\w-]*)(?:\[([^\[\]]*)\]|\(([^()]*)\)|\{([^{}]*)\})?$/);
    if (!match) throw new Error('Unsupported Mermaid syntax. Use simple nodes and --> arrows.');
    const id = match[1]; const label = match[2] ?? match[3] ?? match[4];
    if (!nodes.has(id) || label !== undefined) nodes.set(id, { label: label ?? id, type: match[3] !== undefined ? 'ellipse' : match[4] !== undefined ? 'diamond' : 'rectangle' });
    return id;
  };
  for (const line of source.slice(header[0].length).split(/[;\n]+/).map(s => s.trim()).filter(Boolean)) {
    if (line.startsWith('%%')) continue;
    const chain = line.split(/\s*-->\s*/);
    const ids = chain.map(parseNode);
    for (let i = 1; i < ids.length; i++) edges.push([ids[i - 1], ids[i]]);
  }
  if (!nodes.size || nodes.size > 50 || edges.length > 100) throw new Error('Use between 1 and 50 nodes, at most 100 arrows.');
  const positions = new Map<string, { x: number; y: number }>();
  const out: Element[] = [];
  const entries = [...nodes];
  entries.forEach(([id, node], i) => {
    const n = reverse ? entries.length - 1 - i : i;
    const x = 80 + (horizontal ? n * 260 : 0); const y = 80 + (horizontal ? 0 : n * 180);
    positions.set(id, { x, y });
    out.push(element({ id: `${randomUUID()}-${id}`, type: node.type, x, y, width: 180, height: 90 }));
    out.push(element({ type: 'text', x: x + 20, y: y + 30, width: 140, height: 30, text: node.label }));
  });
  for (const [from, to] of edges) {
    const a = positions.get(from)!; const b = positions.get(to)!;
    const start = horizontal ? { x: a.x + (b.x > a.x ? 180 : 0), y: a.y + 45 } : { x: a.x + 90, y: a.y + (b.y > a.y ? 90 : 0) };
    const end = horizontal ? { x: b.x + (b.x > a.x ? 0 : 180), y: b.y + 45 } : { x: b.x + 90, y: b.y + (b.y > a.y ? 0 : 90) };
    out.push(element({ type: 'arrow', x: start.x, y: start.y, width: Math.max(1, Math.abs(end.x - start.x)), height: Math.max(1, Math.abs(end.y - start.y)), points: [[0, 0], [end.x - start.x, end.y - start.y]] }));
  }
  return out;
}
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
export function toSvg(elements: Element[]) {
  const visible = elements.filter(e => !e.isDeleted);
  const minX = Math.min(0, ...visible.map(e => e.x - 20)); const minY = Math.min(0, ...visible.map(e => e.y - 20));
  const maxX = Math.max(400, ...visible.map(e => e.x + Math.abs(e.width ?? 180) + 40));
  const maxY = Math.max(300, ...visible.map(e => e.y + Math.abs(e.height ?? 100) + 40));
  const body = visible.map(e => {
    const width = e.width ?? 180; const height = e.height ?? 100;
    const attrs = `stroke="${escape(e.strokeColor ?? '#1e1e1e')}" fill="${escape(e.backgroundColor ?? 'transparent')}" stroke-width="2"`;
    if (e.type === 'text') return `<text x="${e.x}" y="${e.y + 24}" font-size="20" fill="${escape(e.strokeColor ?? '#1e1e1e')}">${escape(e.text)}</text>`;
    if (e.type === 'ellipse') return `<ellipse cx="${e.x + width / 2}" cy="${e.y + height / 2}" rx="${width / 2}" ry="${height / 2}" ${attrs}/>`;
    if (e.type === 'diamond') return `<polygon points="${e.x + width / 2},${e.y} ${e.x + width},${e.y + height / 2} ${e.x + width / 2},${e.y + height} ${e.x},${e.y + height / 2}" ${attrs}/>`;
    if (e.type === 'arrow' || e.type === 'line' || e.type === 'freedraw') {
      const points = Array.isArray(e.points) ? e.points as [number, number][] : [[0, 0], [width, height]];
      return `<polyline points="${points.map(([x, y]) => `${e.x + x},${e.y + y}`).join(' ')}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"')} ${e.type === 'arrow' ? 'marker-end="url(#arrow)"' : ''}/>`;
    }
    return `<rect x="${e.x}" y="${e.y}" width="${Math.abs(width)}" height="${Math.abs(height)}" ${attrs}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>${body}</svg>`;
}
const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }] });
export function createMcpServer(store: SceneStore, id: string) {
  const server = new McpServer({ name: 'podfolio-excalidraw', version: '1.0.0' });
  const safe = (fn: () => unknown) => {
    try { return result(fn()); } catch (error) { return { content: [{ type: 'text' as const, text: (error as Error).message }], isError: true }; }
  };
  server.tool('create_element', 'Add an editable shape to the current canvas', shapeSchema.shape, args => safe(() => store.append(id, [element(args)])));
  server.tool('create_from_mermaid', 'Add a basic Mermaid flowchart with simple nodes and --> arrows', { mermaidDiagram: z.string().min(1).max(10000) }, args => safe(() => store.append(id, fromMermaid(args.mermaidDiagram))));
  server.tool('query_elements', 'Read current canvas elements', {}, () => result(store.read(id)));
  server.tool('export_scene', 'Export current Excalidraw scene as JSON', {}, () => result({ type: 'excalidraw', version: 2, source: 'podfolio', elements: store.read(id).elements }));
  server.tool('export_to_image', 'Prepare an SVG download of the current canvas', { format: z.literal('svg').default('svg') }, () => result({ downloadPath: `/canvas/${id}/export.svg`, elements: store.read(id).elements.length }));
  return server;
}
export function createApp(store = new SceneStore()) {
  const app = express();
  const allowed = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',');
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)) }));
  app.use(express.json({ limit: '256kb' }));
  app.get('/', (_req, res) => res.redirect(`${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/mcp`));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.post('/mcp', async (req, res) => {
    const parsed = uuid.safeParse(req.headers['x-canvas-id']);
    if (!parsed.success) return res.status(400).json({ error: 'Supply a UUID x-canvas-id header.' });
    const server = createMcpServer(store, parsed.data);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.once('close', () => { void transport.close(); void server.close(); });
    try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
    catch { if (!res.headersSent) res.status(500).json({ error: 'MCP request failed.' }); }
  });
  app.all('/mcp', (_req, res) => res.status(405).json({ error: 'Stateless MCP uses POST.' }));
  app.get('/canvas/:id', (req, res) => {
    if (!uuid.safeParse(req.params.id).success) return res.sendStatus(400);
    res.set('Cache-Control', 'no-store').json(store.read(req.params.id));
  });
  const savedElement = shapeSchema.partial({ width: true, height: true }).extend({ id: z.string().min(1).max(100), width: z.number().min(0).max(10000).optional(), height: z.number().min(0).max(10000).optional(), type: z.enum(['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line', 'freedraw', 'frame']) }).passthrough();
  app.put('/canvas/:id', (req, res) => {
    const parsed = z.object({ expectedRevision: z.number().int().nonnegative(), elements: z.array(savedElement).max(500) }).strict().safeParse(req.body);
    if (!uuid.safeParse(req.params.id).success || !parsed.success) return res.sendStatus(400);
    try { res.json(store.write(req.params.id, parsed.data.elements as Element[], parsed.data.expectedRevision)); }
    catch (error) { res.status((error as Error).message === 'CONFLICT' ? 409 : 413).json({ error: (error as Error).message }); }
  });
  app.get('/canvas/:id/export.svg', (req, res) => {
    if (!uuid.safeParse(req.params.id).success) return res.sendStatus(400);
    res.type('image/svg+xml').attachment('podfolio-canvas.svg').send(toSvg(store.read(req.params.id).elements));
  });
  return app;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createApp();
  const server = app.listen(Number(process.env.PORT ?? 3001), () => console.log('Excalidraw MCP HTTP service listening on port', process.env.PORT ?? 3001));
  const shutdown = () => { server.close(() => process.exit(0)); server.closeIdleConnections(); setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10000).unref(); };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}
