import { Router, Request, Response } from 'express';
import { mcpToolRegistry } from '../services/mcpToolRegistry.js';
import { MCPConnectionConfig, MCPToolCall } from '../types/mcp.types.js';

const router = Router();

router.get('/connections', (_req: Request, res: Response) => {
  const configs = mcpToolRegistry.getAllConfigs();
  const servers = configs.map(config => {
    const info = mcpToolRegistry.getServerInfo(config.id);
    return {
      ...config,
      status: info?.status || 'disconnected',
      toolsCount: info?.tools.length || 0,
    };
  });
  res.json({ success: true, data: servers });
});

router.post('/connections', async (req: Request, res: Response) => {
  try {
    const config: MCPConnectionConfig = req.body;
    mcpToolRegistry.registerConnection(config);
    res.json({ success: true, message: 'Connection registered' });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/connections/:id/connect', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const serverInfo = await mcpToolRegistry.connect(id);
    res.json({ success: true, data: serverInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/connections/:id/disconnect', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await mcpToolRegistry.disconnect(id);
    res.json({ success: true, message: 'Disconnected' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    mcpToolRegistry.removeConnection(id);
    res.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get('/tools', async (_req: Request, res: Response) => {
  try {
    const tools = await mcpToolRegistry.listAllTools();
    res.json({ success: true, data: tools });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/tools/call', async (req: Request, res: Response) => {
  try {
    const { serverId, name, arguments: args } = req.body as { serverId: string; name: string; arguments: Record<string, unknown> };
    const call: MCPToolCall = { name, arguments: args };
    const result = await mcpToolRegistry.callTool(serverId, call);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/agent/chat', async (req: Request, res: Response) => {
  try {
    const { messages, sendEmail, emailTo, conversationId } = req.body;
    const { agentService } = await import('../services/agentService');
    const response = await agentService.processMessage(messages, { sendEmail, emailTo, conversationId });
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;