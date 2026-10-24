import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { MCPConnectionConfig, MCPTool, MCPToolCall, MCPToolResult, MCPServerInfo, MCPResource, MCPPrompt } from '../types/mcp.types.js';

export class MCPClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | StdioClientTransport | SSEClientTransport | null = null;
  private config: MCPConnectionConfig;
  private connected = false;
  private serverInfo: MCPServerInfo | null = null;

  constructor(config: MCPConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.client = new Client({
      name: `podfolio-mcp-client-${this.config.id}`,
      version: '1.0.0',
    });

    switch (this.config.transport) {
      case 'http':
        if (!this.config.url) throw new Error('HTTP transport requires URL');
        this.transport = new StreamableHTTPClientTransport(new URL(this.config.url));
        break;
      case 'sse':
        if (!this.config.url) throw new Error('SSE transport requires URL');
        this.transport = new SSEClientTransport(new URL(this.config.url));
        break;
      case 'stdio':
        if (!this.config.command) throw new Error('STDIO transport requires command');
        // Merge custom env with process.env so child process has PATH, etc.
        const mergedEnv: Record<string, string> = { ...process.env as Record<string, string>, ...(this.config.env || {}) };
        this.transport = new StdioClientTransport({
          command: this.config.command,
          args: this.config.args || [],
          env: mergedEnv,
        });
        break;
      default:
        throw new Error(`Unknown transport: ${this.config.transport}`);
    }

    if (this.config.headers) {
      // Headers are handled by the transport internally
    }

    await this.client.connect(this.transport);
    this.connected = true;

    // Fetch server info - handle servers that don't implement all methods
    let toolsResult, resourcesResult, promptsResult;
    try {
      toolsResult = await this.client.listTools();
    } catch (e) {
      console.warn('MCP server does not support listTools:', e);
      toolsResult = { tools: [] };
    }
    try {
      resourcesResult = await this.client.listResources();
    } catch (e) {
      console.warn('MCP server does not support listResources:', e);
      resourcesResult = { resources: [] };
    }
    try {
      promptsResult = await this.client.listPrompts();
    } catch (e) {
      console.warn('MCP server does not support listPrompts:', e);
      promptsResult = { prompts: [] };
    }

    this.serverInfo = {
      id: this.config.id,
      name: this.config.name,
      version: '1.0.0',
      capabilities: {},
      tools: toolsResult.tools.map((t: { name: string; description?: string; inputSchema: unknown; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean } }) => ({
        name: t.name,
        description: t.description || '',
        inputSchema: t.inputSchema as Record<string, unknown>,
        annotations: t.annotations,
      })),
      resources: resourcesResult.resources.map((r: { uri: string; name: string; description?: string; mimeType?: string }) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
      prompts: promptsResult.prompts.map((p: { name: string; description?: string; arguments?: Array<{ name: string; description?: string; required?: boolean }> }) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
      status: 'connected',
    };
  }

  async disconnect(): Promise<void> {
    if (this.client && this.transport) {
      await this.client.close();
      this.client = null;
      this.transport = null;
      this.connected = false;
      if (this.serverInfo) {
        this.serverInfo.status = 'disconnected';
      }
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.connected) throw new Error('Not connected');
    const result = await this.client.listTools();
    return result.tools.map((t: { name: string; description?: string; inputSchema: unknown; annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean } }) => ({
      name: t.name,
      description: t.description || '',
      inputSchema: t.inputSchema as Record<string, unknown>,
      annotations: t.annotations,
    }));
  }

  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client || !this.connected) throw new Error('Not connected');
    const result = await this.client.callTool({
      name: call.name,
      arguments: call.arguments,
    });
    return {
      content: result.content as MCPToolResult['content'],
      isError: result.isError as boolean | undefined,
    };
  }

  async listResources(): Promise<MCPResource[]> {
    if (!this.client || !this.connected) throw new Error('Not connected');
    try {
      const result = await this.client.listResources();
      return result.resources.map((r: { uri: string; name: string; description?: string; mimeType?: string }) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      }));
    } catch (e) {
      console.warn('MCP server does not support listResources:', e);
      return [];
    }
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    if (!this.client || !this.connected) throw new Error('Not connected');
    try {
      const result = await this.client.listPrompts();
      return result.prompts.map((p: { name: string; description?: string; arguments?: Array<{ name: string; description?: string; required?: boolean }> }) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      }));
    } catch (e) {
      console.warn('MCP server does not support listPrompts:', e);
      return [];
    }
  }

  getServerInfo(): MCPServerInfo | null {
    return this.serverInfo;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConfig(): MCPConnectionConfig {
    return { ...this.config };
  }
}