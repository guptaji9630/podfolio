import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';
import { ENV } from '../config/env.js';
import { ServiceError } from '../utils/serviceError.js';

export const connectionSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/), name: z.string().min(1).max(100),
  transport: z.enum(['http', 'sse', 'stdio']), url: z.string().url().optional(),
  command: z.string().min(1).max(500).optional(), args: z.array(z.string().max(1000)).max(30).optional(),
  headers: z.record(z.string().max(4000)).optional(), env: z.record(z.string().max(4000)).optional(),
  enabled: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.transport === 'stdio' ? !value.command : !value.url || !/^https?:\/\//.test(value.url)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Supply a command for stdio or an HTTP(S) URL.' });
  }
});
export type MCPConnectionConfig = z.infer<typeof connectionSchema>;
export const PUBLIC_MCP_TOOLS = new Set(['create_element', 'create_from_mermaid', 'query_elements', 'export_scene', 'export_to_image']);
export class MCPToolRegistry {
  private readonly configs = new Map<string, MCPConnectionConfig>();
  constructor() {
    this.configs.set('excalidraw', { id: 'excalidraw', name: 'Excalidraw', transport: 'http', url: ENV.EXCALIDRAW_MCP_URL, enabled: true });
    if (process.env.MCP_CONNECTIONS) {
      for (const config of z.array(connectionSchema).max(20).parse(JSON.parse(process.env.MCP_CONNECTIONS))) this.configs.set(config.id, config);
    }
  }
  list() { return [...this.configs.values()].map(({ headers, env, command, args, ...safe }) => ({ ...safe, url: safe.url ? (() => { const url = new URL(safe.url); url.username = ''; url.password = ''; url.search = ''; return url.toString(); })() : undefined, status: safe.enabled ? 'configured' : 'disconnected' })); }
  register(value: unknown) {
    const config = connectionSchema.parse(value);
    if (this.configs.size >= 20 && !this.configs.has(config.id)) throw new Error('Maximum 20 MCP connections.');
    this.configs.set(config.id, config);
  }
  remove(id: string) { this.configs.delete(id); }
  enable(id: string, enabled: boolean) {
    const config = this.configs.get(id); if (!config) throw new Error('Connection not found.'); config.enabled = enabled;
  }
  private async withClient<T>(id: string, conversationId: string, signal: AbortSignal | undefined, run: (client: Client) => Promise<T>): Promise<T> {
    const config = this.configs.get(id);
    if (!config?.enabled) throw new ServiceError('MCP_CONNECTION_UNAVAILABLE', 'The MCP connection is disabled or missing. Enable it in MCP connection settings.');
    const client = new Client({ name: 'podfolio', version: '1.0.0' });
    const headers = { ...config.headers, ...(id === 'excalidraw' ? { 'x-canvas-id': conversationId } : {}) };
    const transport = config.transport === 'stdio'
      ? new StdioClientTransport({ command: config.command!, args: config.args, env: config.env, stderr: 'pipe' })
      : config.transport === 'sse'
        ? new SSEClientTransport(new URL(config.url!), { requestInit: { headers } })
        : new StreamableHTTPClientTransport(new URL(config.url!), { requestInit: { headers } });
    try {
      await client.connect(transport, { signal, timeout: 8000 });
      return await run(client);
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('MCP_CONNECTION_FAILED', 'The MCP connection failed. Check that Excalidraw is running and its transport and URL match the service. The local demo uses HTTP on port 3001.');
    } finally { await client.close().catch(() => {}); await transport.close().catch(() => {}); }
  }
  async tools(conversationId: string, signal?: AbortSignal, admin = false) {
    const configs = [...this.configs.values()].filter(c => c.enabled && (admin || c.id === 'excalidraw'));
    return Promise.all(configs.map(async config => {
      try {
        const result = await this.withClient(config.id, conversationId, signal, client => client.listTools({}, { signal, timeout: 8000 }));
        return { serverId: config.id, name: config.name, status: 'connected', tools: result.tools.filter(t => admin || PUBLIC_MCP_TOOLS.has(t.name)) };
      } catch { signal?.throwIfAborted(); return { serverId: config.id, name: config.name, status: 'unavailable', tools: [] }; }
    }));
  }
  async call(serverId: string, name: string, args: Record<string, unknown>, conversationId: string, signal?: AbortSignal, admin = false) {
    if (!admin && (serverId !== 'excalidraw' || !PUBLIC_MCP_TOOLS.has(name))) throw new Error('Tool requires admin authorization.');
    const result = await this.withClient(serverId, conversationId, signal, client => client.callTool({ name, arguments: args }, undefined, { signal, timeout: 15000 }));
    if (result.isError) throw new ServiceError('MCP_TOOL_FAILED', 'Excalidraw could not create this drawing. Use a basic Mermaid flowchart with simple nodes and --> arrows.');
    return result;
  }
}
export const mcpToolRegistry = new MCPToolRegistry();
