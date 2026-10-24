import { MCPClient } from './mcpClient.js';
import { MCPConnectionConfig, MCPTool, MCPToolCall, MCPToolResult, MCPServerInfo } from '../types/mcp.types.js';

export class MCPToolRegistry {
  private clients: Map<string, MCPClient> = new Map();
  private configs: Map<string, MCPConnectionConfig> = new Map();

  registerConnection(config: MCPConnectionConfig): void {
    this.configs.set(config.id, config);
  }

  async connect(configId: string): Promise<MCPServerInfo> {
    const config = this.configs.get(configId);
    if (!config) throw new Error(`Connection config not found: ${configId}`);
    if (!config.enabled) throw new Error(`Connection disabled: ${configId}`);

    const existing = this.clients.get(configId);
    if (existing && existing.isConnected()) {
      return existing.getServerInfo()!;
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(configId, client);
    return client.getServerInfo()!;
  }

  async disconnect(configId: string): Promise<void> {
    const client = this.clients.get(configId);
    if (client) {
      await client.disconnect();
      this.clients.delete(configId);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [_id, client] of this.clients) {
      await client.disconnect();
    }
    this.clients.clear();
  }

  getConnectedClients(): Map<string, MCPClient> {
    return new Map(this.clients);
  }

  getAllConfigs(): MCPConnectionConfig[] {
    return Array.from(this.configs.values());
  }

  getConfig(configId: string): MCPConnectionConfig | undefined {
    return this.configs.get(configId);
  }

  async listAllTools(): Promise<{ serverId: string; tools: MCPTool[] }[]> {
    const results: { serverId: string; tools: MCPTool[] }[] = [];
    for (const [serverId, client] of this.clients) {
      console.log(`Checking MCP server: ${serverId}, connected: ${client.isConnected()}`);
      if (client.isConnected()) {
        try {
          const tools = await client.listTools();
          console.log(`MCP server ${serverId} returned ${tools.length} tools:`, tools.map(t => t.name));
          results.push({ serverId, tools });
        } catch (e) {
          console.error(`Failed to list tools for ${serverId}:`, e);
        }
      }
    }
    return results;
  }

  async callTool(serverId: string, call: MCPToolCall): Promise<MCPToolResult> {
    const client = this.clients.get(serverId);
    if (!client || !client.isConnected()) {
      throw new Error(`MCP server not connected: ${serverId}`);
    }
    return client.callTool(call);
  }

  getServerInfo(serverId: string): MCPServerInfo | null {
    const client = this.clients.get(serverId);
    return client?.getServerInfo() || null;
  }

  removeConnection(configId: string): void {
    this.configs.delete(configId);
    const client = this.clients.get(configId);
    if (client) {
      client.disconnect();
      this.clients.delete(configId);
    }
  }
}

export const mcpToolRegistry = new MCPToolRegistry();