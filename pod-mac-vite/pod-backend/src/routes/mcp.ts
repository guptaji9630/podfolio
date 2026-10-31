import { Router, type RequestHandler } from 'express';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { traceOperation } from '../utils/logger.js';
import axios from 'axios';
import { z } from 'zod';
import { ENV } from '../config/env.js';
import { mcpToolRegistry } from '../services/mcpToolRegistry.js';
import { agentService, localTools } from '../services/agentService.js';
import { chatMiddleware } from './unifiedChat.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import { emailService } from '../services/emailService.js';

const router = Router();
function isAdmin(header?: string) {
  const received = Buffer.from(header ?? ''); const expected = Buffer.from(`Bearer ${ENV.MCP_ADMIN_TOKEN}`);
  return !!ENV.MCP_ADMIN_TOKEN && received.length === expected.length && timingSafeEqual(received, expected);
}
const admin: RequestHandler = (req, res, next) => {
  if (!isAdmin(req.headers.authorization)) return res.status(401).json({ success: false, error: { message: 'Admin authorization required.' } });
  next();
};
router.post('/agent/chat', (req, res, next) => {
  if (req.body?.emailTo && req.body.emailTo !== ENV.RECIPIENT_EMAIL) return res.status(400).json({ error: { message: 'Email recipient must be the portfolio owner.' } });
  if (req.body?.sendEmail === true) return res.status(400).json({ error: { message: 'Request email explicitly in a chat message or use send-output.' } });
  req.body = { ...req.body, options: { ...req.body?.options, ...(req.body?.conversationId ? { conversationId: req.body.conversationId } : {}) } };
  next();
}, ...chatMiddleware);
router.get('/tools', async (req, res) => {
  const id = z.string().uuid().safeParse(req.query.conversationId ?? randomUUID());
  if (!id.success) return res.status(400).json({ error: { message: 'Invalid conversation ID.' } });
  try {
    const servers = await mcpToolRegistry.tools(id.data, AbortSignal.timeout(10000), isAdmin(req.headers.authorization));
    res.json({ success: true, data: { localTools, servers } });
  } catch { res.status(502).json({ error: { message: 'MCP tool discovery is unavailable.' } }); }
});
router.get('/cache/stats', admin, (_req, res) => res.json({ success: true, data: agentService.cache.getStats() }));
router.get('/connections', admin, (_req, res) => res.json({ success: true, data: mcpToolRegistry.list() }));
router.post('/connections', admin, (req, res) => {
  try { mcpToolRegistry.register(req.body); res.json({ success: true }); }
  catch { res.status(400).json({ error: { message: 'Invalid MCP connection.' } }); }
});
router.post('/connections/:id/:action', admin, async (req, res) => {
  if (!['connect', 'disconnect'].includes(req.params.action)) return res.sendStatus(404);
  try {
    mcpToolRegistry.enable(req.params.id, req.params.action === 'connect');
    const servers = req.params.action === 'connect' ? await mcpToolRegistry.tools(randomUUID(), AbortSignal.timeout(10000), true) : [];
    const connected = servers.find(s => s.serverId === req.params.id);
    if (req.params.action === 'connect' && connected?.status !== 'connected') return res.status(502).json({ error: { message: 'MCP connection failed.' } });
    res.json({ success: true, data: connected });
  } catch { res.status(400).json({ error: { message: 'Unknown connection.' } }); }
});
router.delete('/connections/:id', admin, (req, res) => { mcpToolRegistry.remove(req.params.id); res.json({ success: true }); });
const toolCallSchema = z.object({
  serverId: z.string().min(1).max(64), name: z.string().min(1).max(100), arguments: z.record(z.string(), z.unknown()), conversationId: z.string().uuid(),
});
router.post('/tools/call', admin, async (req, res) => {
  const parsed = toolCallSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Invalid tool call.' } });
  try {
    const p = parsed.data;
    const data = await mcpToolRegistry.call(p.serverId, p.name, p.arguments, p.conversationId, AbortSignal.timeout(20000), true);
    res.json({ success: true, data });
  } catch { res.status(502).json({ error: { message: 'Tool execution failed.' } }); }
});
router.post('/agent/send-output', contactLimiter, async (req, res) => {
  const parsed = z.object({ subject: z.string().min(1).max(200), content: z.string().min(1).max(60000) }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { message: 'Supply subject and content.' } });
  const result = await emailService.sendAgentOutput(parsed.data);
  res.status(result.success ? 200 : 502).json({ success: result.success, data: result.success ? { messageId: result.messageId } : undefined });
});
// The backend selects the upstream host. The UUID is an unguessable scene capability.
router.all('/canvas/:id/:export?', async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success ||
      (req.params.export && req.params.export !== 'export.svg') ||
      !['GET', 'PUT'].includes(req.method) || (req.params.export && req.method !== 'GET')) return res.sendStatus(400);
  const controller = new AbortController();
  const abort = () => { if (!res.writableEnded) controller.abort(); };
  res.once('close', abort);
  try {
    const response = await traceOperation('canvas.proxy', () => axios.request({
      baseURL: ENV.EXCALIDRAW_SERVICE_URL,
      url: `/canvas/${encodeURIComponent(id.data)}${req.params.export ? '/export.svg' : ''}`,
      // A scene endpoint must never redirect the proxy to another destination.
      maxRedirects: 0,
      method: req.method, data: req.method === 'PUT' ? req.body : undefined, signal: controller.signal,
      timeout: 8000, maxContentLength: 512 * 1024, responseType: req.params.export ? 'text' : 'json',
    }));
    if (req.params.export) res.type('image/svg+xml').attachment('podfolio-canvas.svg');
    res.status(response.status).send(response.data);
  } catch (error) {
    if (!res.destroyed) res.status(axios.isAxiosError(error) ? error.response?.status ?? 502 : 502).json({ error: { message: 'Canvas service is unavailable or the scene changed. Refresh and retry.' } });
  } finally { res.off('close', abort); }
});
export default router;
