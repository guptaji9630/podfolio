import { apiClient } from './api';
import type { MCPConnectionConfig, MCPTool, MCPToolResult } from '../types/mcp.types';
export interface ToolCatalog {
  localTools: MCPTool[];
  servers: Array<{ serverId: string; name: string; status: string; tools: MCPTool[] }>;
}
class MCPService {
  private adminToken = '';
  setAdminToken(value: string) { this.adminToken = value; }
  private headers() { return { Authorization: `Bearer ${this.adminToken}` }; }
  private unwrap<T>(response: { success: boolean; data?: { success: boolean; data?: T }; error?: { message?: string } }): T {
    if (!response.success || !response.data?.success) throw new Error(response.error?.message || 'MCP request failed.');
    return response.data.data as T;
  }
  async getConnections(): Promise<MCPConnectionConfig[]> {
    return this.unwrap(await apiClient.get('/api/mcp/connections', this.headers()));
  }
  async addConnection(config: MCPConnectionConfig) { this.unwrap(await apiClient.post('/api/mcp/connections', config, this.headers())); }
  async connect(id: string) { this.unwrap(await apiClient.post(`/api/mcp/connections/${encodeURIComponent(id)}/connect`, {}, this.headers())); }
  async disconnect(id: string) { this.unwrap(await apiClient.post(`/api/mcp/connections/${encodeURIComponent(id)}/disconnect`, {}, this.headers())); }
  async deleteConnection(id: string) { this.unwrap(await apiClient.delete(`/api/mcp/connections/${encodeURIComponent(id)}`, this.headers())); }
  async listTools(conversationId: string, signal?: AbortSignal): Promise<ToolCatalog> {
    return this.unwrap(await apiClient.get(`/api/mcp/tools?conversationId=${encodeURIComponent(conversationId)}`, undefined, signal));
  }
  async callTool(serverId: string, name: string, args: Record<string, unknown>, conversationId: string): Promise<MCPToolResult> {
    return this.unwrap(await apiClient.post('/api/mcp/tools/call', { serverId, name, arguments: args, conversationId }, this.headers()));
  }
}
export const mcpService = new MCPService();
