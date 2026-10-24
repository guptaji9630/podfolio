import { Router, Request, Response } from 'express';
import { mcpToolRegistry } from '../services/mcpToolRegistry.js';
import { emailService } from '../services/emailService.js';
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
    console.log('MCP Tools endpoint called, returning:', JSON.stringify(tools, null, 2));
    res.json({ success: true, data: tools });
  } catch (error) {
    console.error('MCP Tools error:', error);
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

router.post('/agent/detect-tool', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const { agentService: agentServiceInstance } = await import('../services/agentService');
    const tools = agentServiceInstance.getAvailableTools();
    
    // Use the same detection logic as agentService
    const lower = message.toLowerCase();
    
    // Check for "list tools" / "what tools" / "available tools" queries
    if (/(what tools|list tools|available tools|show tools|tools available)/.test(lower)) {
      return res.json({ 
        success: true, 
        detected: true, 
        tool: { name: 'list_available_tools', description: 'List all available tools' },
        allTools: tools.map(t => ({ name: t.name, description: t.description }))
      });
    }

    // Check for excalidraw/drawing related queries - prefer create_from_mermaid for flowcharts/diagrams
    if (/(draw|diagram|sketch|excalidraw|whiteboard|chart|flowchart|mind.?map|flow.?chart)/.test(lower)) {
      // Find excalidraw-related MCP tools - prefer create_from_mermaid for flowcharts
      for (const tool of tools) {
        const toolName = tool.name.toLowerCase();
        const toolDesc = tool.description?.toLowerCase() || '';
        
        // For flowchart/diagram requests, prefer create_from_mermaid
        if ((/flowchart|flow.?chart|diagram/.test(lower)) && toolName === 'create_from_mermaid') {
          return res.json({ 
            success: true, 
            detected: true, 
            tool: { name: tool.name, description: tool.description },
            allTools: tools.map(t => ({ name: t.name, description: t.description }))
          });
        }
        
        // For general draw requests
        if (toolName === 'create_element') {
          return res.json({ 
            success: true, 
            detected: true, 
            tool: { name: tool.name, description: tool.description },
            allTools: tools.map(t => ({ name: t.name, description: t.description }))
          });
        }
        
        // Other excalidraw tools
        if (toolName.includes('excalidraw') || toolName.includes('draw') || toolName.includes('diagram') || toolDesc.includes('excalidraw') || toolDesc.includes('draw') || toolDesc.includes('diagram') || toolDesc.includes('flowchart') || toolDesc.includes('mermaid')) {
          return res.json({ 
            success: true, 
            detected: true, 
            tool: { name: tool.name, description: tool.description },
            allTools: tools.map(t => ({ name: t.name, description: t.description }))
          });
        }
      }
    }
    
    // Check for MCP tools by name matching (name or description)
    for (const tool of tools) {
      const keywords = tool.name.toLowerCase().split('_');
      const descKeywords = (tool.description || '').toLowerCase().split(/[\s_]+/);
      const allKeywords = [...keywords, ...descKeywords];
      if (allKeywords.some(k => k.length > 2 && lower.includes(k))) {
        return res.json({ 
          success: true, 
          detected: true, 
          tool: { name: tool.name, description: tool.description },
          allTools: tools.map(t => ({ name: t.name, description: t.description }))
        });
      }
    }
    res.json({ 
      success: true, 
      detected: false, 
      allTools: tools.map(t => ({ name: t.name, description: t.description }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/agent/send-output', async (req: Request, res: Response) => {
  try {
    const { subject, content } = req.body;
    const result = await emailService.sendAgentOutput({
      to: process.env.RECIPIENT_EMAIL || 'abhishekg9630@gmail.com',
      subject: subject || 'AI Agent Output',
      agentOutput: content,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;