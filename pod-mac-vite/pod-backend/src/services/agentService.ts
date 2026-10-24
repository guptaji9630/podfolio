import { mcpToolRegistry } from './mcpToolRegistry.js';
import { emailService, type AgentOutputEmailData } from './emailService.js';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  type: 'local' | 'mcp';
  serverId?: string;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result?: unknown }>;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }>;
  canvasUrl?: string; // URL to view the canvas (for excalidraw MCP)
}

export class AgentService {
  private localTools: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();

  constructor(_systemPrompt: string) {
    this.registerLocalTools();
  }

  private registerLocalTools(): void {
    this.localTools.set('send_contact_email', async (args) => {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return response.json();
    });

    this.localTools.set('get_project_details', async (args) => {
      const { PROJECTS } = await import('../config/constants.js');
      const { query } = args as { query: string };
      const lowerQuery = query.toLowerCase();
      const projects = PROJECTS.filter((p: { name: string; category: string; techStack?: string[] }) => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.category.toLowerCase().includes(lowerQuery) ||
        p.techStack?.some((t: string) => t.toLowerCase().includes(lowerQuery))
      );
      return { projects: projects.map((p: { name: string; description: string; techStack?: string[]; githubUrl?: string; liveDemo?: string }) => ({ name: p.name, description: p.description, techStack: p.techStack, githubUrl: p.githubUrl, liveDemo: p.liveDemo })) };
    });

    this.localTools.set('get_availability', async () => {
      return { available: true, message: "Abhishek is currently open to QA/testing roles and freelance projects. Available for consultations and full-time opportunities." };
    });

    this.localTools.set('get_game_list', async () => {
      return {
        games: [
          {
            id: 'dino',
            name: 'Dino Run',
            description: "Endless runner inspired by Chrome's offline dinosaur game. Jump over cacti and duck under birds. How far can you go?",
            highScore: 0,
            genre: 'Endless Runner',
          },
          {
            id: 'pong',
            name: 'Pong vs AI',
            description: 'Classic Pong with an AI opponent. Choose from 4 difficulty levels (Easy to Unbeatable) and 2 game modes (Classic & Survival).',
            modes: ['classic', 'survival'],
            highScores: {
              classic: 0,
              survival: 0,
            },
            genre: 'Arcade',
          },
        ],
      };
    });

    this.localTools.set('launch_game', async (args) => {
      const { gameId, mode } = args as { gameId: string; mode?: string };
      const allowedGameIds = ['dino', 'pong'];
      const allowedPongModes = ['classic', 'survival'];
      if (!gameId || !allowedGameIds.includes(gameId)) {
        return { success: false, message: 'Invalid game ID' };
      }
      if (gameId === 'pong' && mode && !allowedPongModes.includes(mode)) {
        return { success: false, message: 'Invalid mode for Pong' };
      }
      return { success: true, message: `Launching ${gameId}${mode ? ` (${mode} mode)` : ''}...` };
    });

    this.localTools.set('list_available_tools', async () => {
      const tools = this.getAvailableTools();
      return { 
        tools: tools.map(t => ({ 
          name: t.name, 
          description: t.description || 'No description',
          type: t.type
        }))
      };
    });
  }

  getAvailableTools(): AgentTool[] {
    const tools: AgentTool[] = [];

    for (const [name] of this.localTools) {
      const descriptions: Record<string, string> = {
        send_contact_email: 'Send a contact/inquiry email to Abhishek on behalf of the user',
        get_project_details: 'Get detailed information about a specific project by name or category',
        get_availability: "Check Abhishek's current availability for projects or consultations",
        get_game_list: 'Get list of available games with high scores and descriptions',
        launch_game: 'Launch a specific game for the user',
      };
      tools.push({
        name,
        description: descriptions[name] || 'Local tool',
        parameters: {},
        type: 'local',
      });
    }

    console.log('[AgentService] Getting available tools...');
    const connectedClients = mcpToolRegistry.getConnectedClients();
    console.log('[AgentService] Connected clients:', connectedClients.size);
    
    for (const [serverId, client] of connectedClients) {
      console.log('[AgentService] Checking server:', serverId, 'connected:', client.isConnected());
      const serverInfo = client.getServerInfo();
      if (serverInfo) {
        console.log('[AgentService] Server info:', serverId, 'tools:', serverInfo.tools.length);
        for (const tool of serverInfo.tools) {
          tools.push({
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
            type: 'mcp',
            serverId,
          });
        }
      } else {
        console.log('[AgentService] No server info for:', serverId);
      }
    }

    console.log('[AgentService] Total tools:', tools.length);
    return tools;
  }

  async executeToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
    const localTool = this.localTools.get(name);
    if (localTool) {
      return localTool(args);
    }

    for (const [_serverId, client] of mcpToolRegistry.getConnectedClients()) {
      const serverInfo = client.getServerInfo();
      if (serverInfo?.tools.some(t => t.name === name)) {
        const result = await client.callTool({ name, arguments: args });
        if (result.isError) {
          throw new Error(`MCP tool error: ${result.content[0]?.text || 'Unknown error'}`);
        }
        return result.content[0]?.text || result;
      }
    }

    throw new Error(`Tool not found: ${name}`);
  }

  async processMessage(
    messages: AgentMessage[],
    options?: { sendEmail?: boolean; emailTo?: string; conversationId?: string }
  ): Promise<AgentResponse> {
    const tools = this.getAvailableTools();
    
    const latestUserMessage = messages.filter(m => m.role === 'user').at(-1)?.content || '';
    const toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }> = [];

    const toolIntent = this.detectToolIntent(latestUserMessage, tools);
    if (toolIntent) {
      try {
        const result = await this.executeToolCall(toolIntent.name, toolIntent.arguments);
        toolCalls.push({ name: toolIntent.name, arguments: toolIntent.arguments, result });
      } catch (error) {
        toolCalls.push({ 
          name: toolIntent.name, 
          arguments: toolIntent.arguments, 
          result: { error: (error as Error).message } 
        });
      }
    }

    const aiResponse = await this.getAIResponse(messages, toolCalls);

    if (options?.sendEmail && options.emailTo) {
      const emailData: AgentOutputEmailData = {
        to: options.emailTo,
        subject: 'AI Agent Response',
        agentOutput: aiResponse,
        toolCalls,
        conversationId: options.conversationId,
      };
      await emailService.sendAgentOutput(emailData);
    }

    return { 
      message: aiResponse, 
      toolCalls,
      // Include canvas URL if MCP tools were used (excalidraw canvas)
      canvasUrl: toolCalls.some(tc => tc.name.startsWith('create_') || tc.name.startsWith('update_') || tc.name.startsWith('delete_') || tc.name.startsWith('batch_') || tc.name === 'clear_canvas' || tc.name === 'export_to_image' || tc.name === 'get_canvas_screenshot' || tc.name === 'describe_scene' || tc.name === 'set_viewport' || tc.name === 'read_diagram_guide' || tc.name === 'export_to_excalidraw_url') 
        ? 'http://localhost:3001' 
        : undefined
    };
  }

  private detectToolIntent(message: string, tools: AgentTool[]): { name: string; arguments: Record<string, unknown> } | null {
    const lower = message.toLowerCase();
    
    // Check for "list tools" / "what tools" / "available tools" queries
    if (/(what tools|list tools|available tools|show tools|tools available)/.test(lower)) {
      return { name: 'list_available_tools', arguments: {} };
    }

    // Check for excalidraw/drawing related queries - prefer create_from_mermaid for flowcharts/diagrams
    if (/(draw|diagram|sketch|excalidraw|whiteboard|chart|flowchart|mind.?map|flow.?chart)/.test(lower)) {
      // Find excalidraw-related MCP tools - prefer create_from_mermaid for flowcharts
      for (const tool of tools) {
        const toolName = tool.name.toLowerCase();
        const toolDesc = tool.description?.toLowerCase() || '';
        
        // For flowchart/diagram requests, prefer create_from_mermaid
        if ((/flowchart|flow.?chart|diagram/.test(lower)) && toolName === 'create_from_mermaid') {
          return { name: tool.name, arguments: { mermaidDiagram: 'flowchart TD\n    A[Start] --> B[Process]\n    B --> C[Decision]\n    C -->|Yes| D[End]\n    C -->|No| B' } };
        }
        
        // For general draw requests, use create_element with defaults
        if (toolName === 'create_element') {
          return { name: tool.name, arguments: { type: 'rectangle', x: 100, y: 100, width: 200, height: 100, text: 'Step 1' } };
        }
        
        // Other excalidraw tools
        if (toolName.includes('excalidraw') || toolName.includes('draw') || toolName.includes('diagram') || toolDesc.includes('excalidraw') || toolDesc.includes('draw') || toolDesc.includes('diagram') || toolDesc.includes('flowchart') || toolDesc.includes('mermaid')) {
          return { name: tool.name, arguments: {} };
        }
      }
    }
    
    // Check for MCP tools by name matching (name or description)
    for (const tool of tools) {
      const keywords = tool.name.toLowerCase().split('_');
      const descKeywords = (tool.description || '').toLowerCase().split(/[\s_]+/);
      const allKeywords = [...keywords, ...descKeywords];
      if (allKeywords.some(k => k.length > 2 && lower.includes(k))) {
        return { name: tool.name, arguments: {} };
      }
    }
    return null;
  }

  private async getAIResponse(_messages: AgentMessage[], toolCalls: Array<{ name: string; arguments: Record<string, unknown>; result: unknown }>): Promise<string> {
    const toolContext = toolCalls.length > 0 
      ? `\nTool results: ${toolCalls.map(tc => `${tc.name}: ${JSON.stringify(tc.result)}`).join('; ')}`
      : '';
    
    return `I've processed your request.${toolContext} How can I help you further?`;
  }
}

export const agentService = new AgentService(`You are Abhishek's AI assistant with access to MCP tools.`);